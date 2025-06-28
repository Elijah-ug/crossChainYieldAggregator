// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

contract CCIPSender is ReentrancyGuard, FunctionsClient, AutomationCompatibleInterface {
    using FunctionsRequest for FunctionsRequest.Request;

    IRouterClient public immutable ccipRouter;
    LinkTokenInterface public immutable linkToken;

    struct YieldData {
        string project;
        string chain;
        string symbol;
        string poolAddress;
        uint256 apy;
    }
    YieldData public bestYield;
    bytes32 public lastRequestId;

    struct User {
        address user;
        bool isRegistered;
        uint256 balance;
    }
    User[] public users;

    mapping(address => uint256) public userBalances;
    mapping(address => bool) public isRegistered;

    uint256 public lastUpdateTimestamp;
    uint256 public interval = 3600; // 1 hour

    address public owner;
    address public receiverAddress;
    uint64 public destinationChainSelector;
    address public oracle;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event CrossChainSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed user,
        address receiver,
        uint256 amount,
        address token,
        uint256 fees,
        string preferredStrategy
    );
    event BestYieldUpdated(
        string project,
        string chain,
        uint256 apy,
        string symbol,
        string poolAddress
    );
    event ResponseRaw(bytes response);
    event FulfillFailed(string reason);

    constructor(address _linkToken, address _ccipRouter, address _oracle) FunctionsClient(_oracle) {
        linkToken = LinkTokenInterface(_linkToken);
        ccipRouter = IRouterClient(_ccipRouter);
        oracle = _oracle;
        lastUpdateTimestamp = block.timestamp;
        owner = msg.sender;
    }

    // Register user once
    function registerUser() external {
        require(!isRegistered[msg.sender], "User already registered");
        users.push(User(msg.sender, true, 0));
        isRegistered[msg.sender] = true;
    }

    // Deposit LINK tokens with reentrancy protection
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit amount must be > 0");
        require(linkToken.transferFrom(msg.sender, address(this), amount), "LINK transfer failed");

        userBalances[msg.sender] += amount;

        // Update user struct balance
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i].user == msg.sender) {
                users[i].balance = userBalances[msg.sender];
                break;
            }
        }

        emit Deposited(msg.sender, amount);
    }

    // View all users and balances
    function getUserBalance() external view returns (User[] memory) {
        return users;
    }

    // Set cross-chain receiver address and destination chain selector (only owner)
    function setReceiverAndChain(address _receiver, uint64 _selector) external {
        require(msg.sender == owner, "Only owner can set");
        receiverAddress = _receiver;
        destinationChainSelector = _selector;
    }

    // Internal CCIP send function using LINK tokens
    function _ccipSendToken(uint256 amount) public returns (bytes32 messageId) {
        require(receiverAddress != address(0), "Receiver not set");
        require(destinationChainSelector != 0, "Chain selector not set");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        require(isRegistered[msg.sender], "User not registered");

        // Declare tokens array
       Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
       tokenAmounts[0] = Client.EVMTokenAmount({token: address(linkToken), amount: amount});

        // Encode user info and yield data
        bytes memory messageData = abi.encode(msg.sender, amount, bestYield);

        // Construct CCIP message
        Client.EVM2AnyMessage memory evmMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiverAddress),
            data: messageData,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 500_000})),
            feeToken: address(linkToken)
        });

        // Calculate fee to pay LINK fee for cross-chain send
        uint256 fee = ccipRouter.getFee(destinationChainSelector, evmMessage);
        require(linkToken.balanceOf(address(this)) >= fee, "Not enough LINK for CCIP fee");

        // Approve LINK spend for CCIP router
        require(linkToken.approve(address(ccipRouter), fee), "Approval failed");

        // Send CCIP message cross-chain
        messageId = ccipRouter.ccipSend(destinationChainSelector, evmMessage);

        // Update user balance
        userBalances[msg.sender] -= amount;

        emit CrossChainSent(
            messageId,
            destinationChainSelector,
            msg.sender,
            receiverAddress,
            amount,
            address(linkToken),
            fee,
            bestYield.project
        );

        return messageId;
    }

    // Update best yield data from Chainlink Functions response (called externally)
    function updateBestYield(bytes memory encodedResult) external {
        YieldData memory newYield = abi.decode(encodedResult, (YieldData));
        bestYield = newYield;
        emit BestYieldUpdated(
            newYield.project,
            newYield.chain,
            newYield.apy,
            newYield.symbol,
            newYield.poolAddress
        );
    }

    // Handle Chainlink Functions fulfillment
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory error) internal override {
        emit ResponseRaw(response);

        if (error.length > 0) {
            emit FulfillFailed("Chainlink returned error");
            return;
        }

        try this.decodeYield(response) returns (YieldData memory newYield) {
            bestYield = newYield;
            lastRequestId = requestId;
            emit BestYieldUpdated(
                newYield.project,
                newYield.chain,
                newYield.apy,
                newYield.symbol,
                newYield.poolAddress
            );
        } catch {
            emit FulfillFailed("Decoding failed");
        }
    }

    // Decode yield data from bytes
    function decodeYield(bytes memory response) public pure returns (YieldData memory) {
        return abi.decode(response, (YieldData));
    }

    // Chainlink Automation check
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        bool hasDeposited = false;

        for (uint256 i = 0; i < users.length; i++) {
            if (userBalances[users[i].user] > 0) {
                hasDeposited = true;
                break;
            }
        }

        bool isDataAvailable = bytes(bestYield.project).length > 0;

        upkeepNeeded = isDataAvailable && hasDeposited;
        performData = "";
    }

    // Chainlink Automation perform upkeep - send CCIP tokens for first depositor found
    function performUpkeep(bytes calldata) external override {
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i].user;
            uint256 balance = userBalances[user];

            if (balance > 0) {
                _ccipSendToken(balance);
                break; // only one per upkeep cycle
            }
        }
    }

    // Check if receiver & chain are set
    function isConfigReady() public view returns (bool) {
        return (receiverAddress != address(0) && destinationChainSelector != 0);
    }
}
