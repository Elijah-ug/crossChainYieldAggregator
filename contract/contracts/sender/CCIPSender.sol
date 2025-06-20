// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { IRouterClient } from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Client } from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import { LinkTokenInterface } from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/KeeperCompatibleInterface.sol";

/**
 * @title AutoCCIPSender
 * @notice This contract allows users to deposit USDC, auto-fetch the best APY using Chainlink Functions,
 *         and periodically update yield strategy info. Users can also send cross-chain messages via CCIP.
 */
contract AutoCCIPSender is ReentrancyGuard, FunctionsClient, KeeperCompatibleInterface {
    using FunctionsRequest for FunctionsRequest.Request;

    IRouterClient public immutable ccipRouter; // Chainlink CCIP router
    LinkTokenInterface public immutable linkToken; // LINK token for paying CCIP fee
    IERC20 public immutable usdcToken; // The stablecoin used (USDC)

    // Struct to hold the best yield data
    struct YieldData {
        string project;
        string chain;
        string symbol;
        string poolAddress;
        uint256 apy;
    }

    YieldData public bestYield; // Most recently fetched best yield data
    bytes32 public lastRequestId; // Last request ID for Chainlink Functions

    // Struct to hold registered user info
    struct User {
        address user;
        bool isRegistered;
        uint256 balance;
    }

    User[] public users; // Array of all users
    mapping(address => uint256) public userBalances; // User address => balance
    mapping(address => bool) public isRegistered; // User registration status

    uint64 public subscriptionId; // Chainlink Functions subscription ID
    uint32 public gasLimit; // Gas limit for Functions callback
    bytes32 public donId; // Chainlink DON ID
    uint256 public lastUpdateTimestamp; // Last time upkeep was triggered
    uint256 public interval = 240; // Time interval for automation (default: 1 hour)

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
    event BestYieldUpdated(string project, string chain, uint256 apy, string symbol, string poolAddress);
    event ResponseRaw(bytes response);
    event FulfillFailed(string reason);
    event requestSent(bytes32 requestId);

    // Constructor sets important immutable addresses and config params
    constructor(
        address _linkToken,
        address _ccipRouter,
        address _usdcToken,
        address _oracle,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donId
    ) FunctionsClient(_oracle) {
        linkToken = LinkTokenInterface(_linkToken);
        ccipRouter = IRouterClient(_ccipRouter);
        usdcToken = IERC20(_usdcToken);
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donId = _donId;
        lastUpdateTimestamp = block.timestamp;
    }

    // Register a user
    function registerUser() external {
        require(!isRegistered[msg.sender], "User Registered");
        users.push(User(msg.sender, true, 0));
        isRegistered[msg.sender] = true;
    }

    // Deposit USDC into the contract
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        userBalances[msg.sender] += amount;
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i].user == msg.sender) {
                users[i].balance = userBalances[msg.sender];
                break;
            }
        }
        emit Deposited(msg.sender, amount);
    }

    // View all users and their balances
    function getUserBalance() external view returns (User[] memory) {
        return users;
    }

    // Cross-chain send USDC with a strategy tag using CCIP
    function _ccipSendToken(
        address receiver,
        uint64 destinationChainSelector,
        uint256 amount,
        string calldata preferredStrategy
    ) external returns (bytes32 messageId) {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        require(isRegistered[msg.sender], "User not registered");

        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({token: address(usdcToken), amount: amount});
        bytes memory messageData = abi.encode(msg.sender, amount, preferredStrategy);

        Client.EVM2AnyMessage memory evmMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: messageData,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 500_000})),
            feeToken: address(linkToken)
        });

        uint256 fee = ccipRouter.getFee(destinationChainSelector, evmMessage);
        require(linkToken.balanceOf(address(this)) >= fee, "Not enough LINK to pay CCIP fee");
        require(linkToken.approve(address(ccipRouter), fee), "Not Approved");

        messageId = ccipRouter.ccipSend(destinationChainSelector, evmMessage);
        userBalances[msg.sender] -= amount;

        emit CrossChainSent(
            messageId,
            destinationChainSelector,
            msg.sender,
            receiver,
            amount,
            address(linkToken),
            fee,
            preferredStrategy
        );
        return messageId;
    }

    // Chainlink Automation check
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastUpdateTimestamp) > interval;
        return (upkeepNeeded, "");
    }

    // Chainlink Automation performs best APY update
    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastUpdateTimestamp) > interval, "Too early for upkeep");
        lastUpdateTimestamp = block.timestamp;
        requestBestYieldUpdate();
    }

    // Chainlink Functions request to fetch best APY
    function requestBestYieldUpdate() public {
        FunctionsRequest.Request memory req;

        // Inline JS logic will be inserted here or encoded off-chain and passed in
        req.initializeRequestForInlineJavaScript(
    string(
        abi.encodePacked(
            'const response = await Functions.makeHttpRequest({ url: "https://yields.llama.fi/pools" });',
            'if (response.error) throw Error("Fetch failed");',
            'const chains = ["Polygon","Ethereum","Avalanche","Base","Arbitrum"];',
            'const pools = response.data.data;',
            'const filtered = pools.filter(p => chains.includes(p.chain) && p.symbol.toLowerCase() === "usdc" && p.apyBase !== null).sort((a, b) => b.apyBase - a.apyBase);',
            'const best = filtered[0] ?? {};',
            'const result = [',
            'best.poolMeta ?? "Unknown Strategy",',
            'best.chain ?? "Unknown",',
            '"USDC",',
            'best.pool ?? "0x0000000000000000000000000000000000000000",',
            'Math.round((best.apyBase ?? 0) * 1e4)',
            '];',
            'return Functions.encodeAbi(["tuple(string,string,string,string,uint256)"], [result]);'
        )
    )
);


        bytes memory requestBytes = req.encodeCBOR();
        lastRequestId = _sendRequest(requestBytes, subscriptionId, gasLimit, donId);
        emit requestSent(lastRequestId);
    }

    // Chainlink Functions fulfill callback
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory error
    ) internal override {
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

    // Decode the ABI-encoded best yield tuple
    function decodeYield(bytes memory response) public pure returns (YieldData memory) {
        return abi.decode(response, (YieldData));
    }
}
