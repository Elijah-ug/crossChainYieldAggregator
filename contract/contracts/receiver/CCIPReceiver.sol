// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/KeeperCompatibleInterface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract ReceiverContract is  CCIPReceiver, KeeperCompatibleInterface, ReentrancyGuard {
    IERC20 public immutable usdcToken;
    // IPool public immutable aavePool; // Aave v3 Pool contract
    address public immutable senderContract; // CCIPSender on source chain

    struct Strategy{
        address pool;
        bytes4 depositSelector;
        uint256 apy;
        bool isRegistered;
    }
    struct YieldData {
        string name;
        address pool;
        bytes4 depositSelector;
        uint256 apy;
    }
   string[] public strategyList;
    mapping(string => Strategy) public strategies;
    mapping(address => uint256) public userBalances;
    YieldData public bestYield;

    uint256 public lastUpdated; // 🔁 timestamp of last strategy update
    uint256 public updateInterval = 1 hours; // configurable

    // ==== events
    event TokensReceived(
        bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender, uint256 amount, string preferredStrategy);
    event StrategyRegistered(string strategy, address pool, bytes4 selector, uint256 apy);
    event StrategyUpdated(string strategy, uint256 newApy);
     event BestYieldUpdated(string strategy, uint256 apy);
    event DepositExecuted(string strategy, address pool, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event YieldUpdateRequested();

    constructor ( address router, address _usdcToken, address _senderContract ) CCIPReceiver(router) {
            usdcToken = IERC20(_usdcToken);
            senderContract = _senderContract;
    }

     // ======== Update Strategy ========
     function updateBestStrategy(YieldData calldata _yieldData) external {
    if(strategies[_yieldData.name].isRegistered){
        strategies[_yieldData.name] = Strategy({
            pool: _yieldData.pool,
            depositSelector: _yieldData.depositSelector,
            apy: _yieldData.apy,
            isRegistered: true
        });
        strategyList.push(_yieldData.name);
        emit StrategyRegistered(_yieldData.name, _yieldData.pool, _yieldData.depositSelector, _yieldData.apy);
    }else{
        strategies[_yieldData.name].apy = _yieldData.apy;
        emit StrategyUpdated(_yieldData.name, _yieldData.apy);
    }
    bestYield = _yieldData;
    emit BestYieldUpdated(_yieldData.name, _yieldData.apy);
    }

     // ======== CCIP RECEIVE ========
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override{
        // address sender = abi.decode(message.sender, (address));
        (address sender, uint256 amount, string memory preferredStrategy) = abi.decode(message.data, (address, uint256, string));
        require(strategies[preferredStrategy].isRegistered, "Strategy Not Registered");
        userBalances[sender] += amount;
        emit TokensReceived(message.messageId, message.sourceChainSelector, sender, amount, preferredStrategy);

    }
    // ========= getting the highest strategy
    function getHighestApyStrategy() public view returns (string memory) {
     if (strategyList.length == 0) return "None"; // ✅ Handle empty case gracefully
    string memory highestStrategy;
    uint256 highestApy = 0;
    // Loop through registered strategies and find the highest APY
    for (uint256 i = 0; i < strategyList.length; i++) {
        string memory strategy = strategyList[i];
        if (strategies[strategy].apy > highestApy) {
                highestApy = strategies[strategy].apy;
                highestStrategy = strategy;
            }
    }
    return highestStrategy;
}

    // automate deposit via chainlink automation
    function checkUpkeep(bytes calldata) external view override returns(bool upkeepNeeded, bytes memory performData){
        bool hasBalance = usdcToken.balanceOf(address(this)) > 0;
        bool isMissingStrategy = strategyList.length == 0;
        // string memory bestStrategy = getHighestApyStrategy();
        bool isStale = block.timestamp > lastUpdated + updateInterval;
        upkeepNeeded = isMissingStrategy || hasBalance || isStale;
        // require(bytes(bestStrategy).length > 0, "No strategies available");
        performData = abi.encode(isMissingStrategy, isStale, hasBalance); // default strategy for upkeep
        return (upkeepNeeded, performData);
    }
    function performUpkeep(bytes calldata performData) external override{
        (bool isMissingStrategy, bool isStale, bool hasBalance) = abi.decode(performData, (bool, bool, bool));
         if(isMissingStrategy || isStale){
            emit YieldUpdateRequested();
         }
         if (hasBalance && strategyList.length > 0) {
            string memory bestStrategy = getHighestApyStrategy();
            autoDepositToStrategy(bestStrategy);
        }
    }
        // ======== DEPOSIT FUNCTION (AUTOMATED) ========

    function autoDepositToStrategy(string memory strategyName) public{
        Strategy memory strategy = strategies[strategyName];
        require(strategy.isRegistered, "Strategy Not Registered");

        uint256 amount = usdcToken.balanceOf(address(this));
         require(amount > 0, "No USDC received");
         usdcToken.approve(address(strategy.pool), amount);
        // aavePool.supply(address(usdcToken), amount, address(this), 0);
        (bool success, bytes memory result) = strategy.pool.call(abi.encodeWithSelector(
            strategy.depositSelector, address(usdcToken), amount, address(this), 0));
            if(!success){
                if(result.length < 68) revert("Deposit call failed");
                assembly {
                  result := add(result, 0x04)
                   }
                   revert(abi.decode(result, (string)));
            }
             require(success, "Deposit call failed");
             emit DepositExecuted(strategyName, strategy.pool, amount);
    }
        // ======== USER WITHDRAWAL ========
    function manualWithdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Not enough balance");
        // Withdraw from Aave directly to this contract
        // uint256 withdrawn = aavePool.withdraw(address(usdcToken), amount, address(this));
        require(usdcToken.transfer(msg.sender, amount), "Transfer to user failed");
        userBalances[msg.sender] -= amount;
        emit Withdrawal(msg.sender, amount);
    }
    // ======== View Utilities ========
    function getStrategy(string memory name) external view returns (
        address pool, bytes4 depositSelector,uint256 apy,bool isRegistered) {
            Strategy memory s = strategies[name];
            return (s.pool, s.depositSelector, s.apy, s.isRegistered);
    }
    // ======== User Balances ========
    function getUserBalance(address user) external view returns (uint256) {
    return userBalances[user];
}
}
