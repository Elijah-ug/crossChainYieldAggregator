// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/KeeperCompatibleInterface.sol";


 contract CCIPSender is ReentrancyGuard, FunctionsClient, KeeperCompatibleInterface {
    using FunctionsRequest for FunctionsRequest.Request;
    IRouterClient public immutable ccipRouter;
    LinkTokenInterface public immutable linkToken;
    IERC20 public immutable usdcToken;
    // bytes32 public donId;
    struct YieldData {
        string project;
        string chain;
        string symbol;
        string poolAddress;
        uint256 apy;
    }
    YieldData public bestYield;
    bytes32 public lastRequestId;
    struct User{
        address user;
        bool isRegistered;
        uint256 balance;
    }
    User[] public users;
    //mapping to track user deposits
    mapping(address => uint256) public userBalances;
    mapping(address => bool) public isRegistered;
    //autamation state
    uint256 public lastUpdateTimestamp;
    uint256 public interval = 3600; // 1 hour default

    address public owner;
    address public receiverAddress;
    uint64 public destinationChainSelector;


    // Events for deposit and cross-chain send
    event Deposited(address indexed user, uint256 amount);
    event CrossChainSent(
        bytes32 indexed messageId, uint64 indexed destinationChainSelector,
         address indexed user,  address receiver, uint256 amount, address token, uint256 fees, string preferredStrategy);
         event BestYieldUpdated(string project, string chain, uint256 apy, string symbol, string poolAddress);
          event ResponseRaw(bytes response);
          event FulfillFailed(string reason);

    constructor(address _linkToken, address _ccipRouter, address _usdcToken, address oracle) FunctionsClient(oracle) {
        linkToken = LinkTokenInterface(_linkToken);
        ccipRouter = IRouterClient(_ccipRouter);
        usdcToken = IERC20(_usdcToken);
        lastUpdateTimestamp = block.timestamp;
        owner = msg.sender;
    }
    // user registration
    function registerUser() external {
        require(!isRegistered[msg.sender], "User Registered");
        users.push(User(msg.sender, true, 0));
        isRegistered[msg.sender] = true;
    }

        // 🔒 Safe deposit function with reentrancy protection
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        userBalances[msg.sender] += amount;
        // users[User].balance = userBalances;
        for(uint256 i =0; i < users.length; i++){
            if(users[i].user == msg.sender){
                users[i].balance = userBalances[msg.sender];
                break;
            }
        }
        emit Deposited(msg.sender, amount);
    }
    //function to get user balance
    function getUserBalance() external view returns(User[] memory){
        return users;
    }
    // setter function for the destnation chain selector and the receiver contract
    function setReceiverAndChain(address _receiver, uint64 _selector) external {
        require(msg.sender == owner, "Already set");
        receiverAddress = _receiver;
        destinationChainSelector = _selector;
    }

    // function to send message
    function _ccipSendToken( uint256 amount ) public returns(bytes32 messageId){
            require(receiverAddress != address(0), "Receiver not set");
            require(destinationChainSelector != 0, "Chain not set");
            require(userBalances[msg.sender] >= amount, "Insufficient balance");
            require(isRegistered[msg.sender], "User not registered");

            // Declare tokenAmounts array
            Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
            tokenAmounts[0] = Client.EVMTokenAmount({token: address(usdcToken), amount: amount});
            // Encode user and amount in the message data
            bytes memory messageData = abi.encode(msg.sender, amount, bestYield);
            //construct the ccip message
            Client.EVM2AnyMessage memory evmMessage = Client.EVM2AnyMessage({
                receiver: abi.encode(receiverAddress),
                data: messageData,
                tokenAmounts: tokenAmounts,
                extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 500_000})),
                feeToken: address(linkToken)
            });
            // Get the fee required for the message
            uint256 fee = ccipRouter.getFee(destinationChainSelector, evmMessage);
            // check if the contract has enough LINK to pay fee
            require(linkToken.balanceOf(address(this)) >= fee, "Not enough LINK to pay CCIP fee");
            // approve the router to send link tokens
            require(linkToken.approve(address(ccipRouter), fee), "Not Approved");
            //send the CCIP message
            messageId = ccipRouter.ccipSend(destinationChainSelector, evmMessage);
            // update user balance
            userBalances[msg.sender] -= amount;
            emit CrossChainSent(messageId, destinationChainSelector, msg.sender,
            receiverAddress, amount, address(linkToken), fee, bestYield.project);
            return messageId;
    }


    // =========== send request ==========
  function updateBestYield(bytes memory encodedResult) external {
    YieldData memory newYield = abi.decode(encodedResult, (YieldData));
    bestYield = newYield;

    emit BestYieldUpdated( newYield.project, newYield.chain, newYield.apy, newYield.symbol, newYield.poolAddress);
}


    //🔄 Fulfill request with JSON decoding instead of manual delimiter parsing

function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory error) internal override {
    emit ResponseRaw(response);

    if (error.length > 0) {
        emit FulfillFailed("Chainlink returned error");
        return;
    }

    try this.decodeYield(response) returns (YieldData memory newYield) {
        bestYield = newYield;
        lastRequestId = requestId;
        emit BestYieldUpdated(newYield.project, newYield.chain, newYield.apy, newYield.symbol, newYield.poolAddress);
    } catch {
        emit FulfillFailed("Decoding failed");
    }
}

function decodeYield(bytes memory response) public pure returns (YieldData memory) {
    return abi.decode(response, (YieldData));
}
// ========= chainlink automation functions ==========
function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData){
    bool hasDeposited = false;
    for(uint256 i = 0; i < users.length; i++){
        if(userBalances[users[i].user] > 0){
            hasDeposited = true;
            break;
        }
    }
    bool isDataAvilable = bytes(bestYield.project).length > 0;
    upkeepNeeded = isDataAvilable && hasDeposited;
    return (upkeepNeeded, "");
}

function performUpkeep(bytes calldata) external override{
    for(uint256 i = 0; i < users.length; i ++){
        address user = users[i].user;
        uint256 balance = userBalances[user];
        if(balance > 0){
        _ccipSendToken(balance);
        break;
    }

    }

}
function isConfigReady() public view returns (bool) {
    return (receiverAddress != address(0) && destinationChainSelector != 0);
}


}
