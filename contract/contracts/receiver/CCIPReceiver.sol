// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract ReceiverContract is  CCIPReceiver, AutomationCompatibleInterface, ReentrancyGuard {
    IERC20 public immutable usdcToken;
    address public immutable senderContract; // CCIPSender on source chain
    YieldData public latestYield;
    struct YieldData {
        string name;
        address pool;
        bytes4 depositSelector;
        uint256 apy;
    }
    mapping(address => uint256) public userBalances;

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

     // ======== CCIP RECEIVE ========
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override{
        (address sender, uint256 amount, YieldData memory yieldData) = abi.decode(message.data, (address, uint256, YieldData));
        latestYield = yieldData;
        userBalances[sender] += amount;
        emit TokensReceived(message.messageId, message.sourceChainSelector, sender, amount, yieldData.name);

    }


    // automate deposit via chainlink automation
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
    bool hasBalance = usdcToken.balanceOf(address(this)) > 0;

    bool hasData = latestYield.apy > 0;
    upkeepNeeded = hasData && hasBalance;
    performData = abi.encode(hasData, hasBalance);
    return (upkeepNeeded, "");
}

    function performUpkeep(bytes calldata performData) external override {
    (bool hasData, bool hasBalance) = abi.decode(performData, (bool, bool));
     if (hasData && hasBalance) {
        emit YieldUpdateRequested();
        autoDepositToStrategy(latestYield.name);
    }
}

        // ======== DEPOSIT FUNCTION (AUTOMATED) ========
    function autoDepositToStrategy(string memory strategyName) public{
        uint256 amount = usdcToken.balanceOf(address(this));
        require(amount > 0, "No funds available for deposit");

         usdcToken.approve(address(latestYield.pool), amount);
        (bool success, bytes memory result) = latestYield.pool.call(abi.encodeWithSelector(
            latestYield.depositSelector, address(usdcToken), amount, address(this), 0));
            if(!success){
                if(result.length < 68) revert("Deposit call failed");
                assembly {
                  result := add(result, 0x04)
                   }
                   revert(abi.decode(result, (string)));
            }
             require(success, "Deposit call failed");
             emit DepositExecuted(strategyName, latestYield.pool, amount);
    }
        // ======== USER WITHDRAWAL ========
    function manualWithdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Not enough balance");
        require(usdcToken.transfer(msg.sender, amount), "Transfer to user failed");
        userBalances[msg.sender] -= amount;
        emit Withdrawal(msg.sender, amount);
    }

    // ======== User Balances ========
    function getUserBalance(address user) external view returns (uint256) {
    return userBalances[user];
}

function getLatestStrategy() external view returns (string memory, address, bytes4, uint256) {
    return (
        latestYield.name,
        latestYield.pool,
        latestYield.depositSelector,
        latestYield.apy
    );
}

}
