// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReceiverContract is CCIPReceiver, AutomationCompatibleInterface, ReentrancyGuard {
    IERC20 public immutable linkToken;
    address public immutable senderContract;
    address public immutable mockProtocol;
    address public router;

    struct YieldData {
        string name;
        address pool;
        bytes4 depositSelector;
        uint256 apy;
    }

    YieldData public latestYield;
    mapping(address => uint256) public userBalances;

    event TokensReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        uint256 amount,
        string preferredStrategy
    );

    event YieldUpdateRequested();

    constructor(
        address _router,
        address _linkToken,
        address _senderContract,
        address _mockProtocol
    ) CCIPReceiver(router) {
        router = _router;
        linkToken = IERC20(_linkToken);
        senderContract = _senderContract;
        mockProtocol = _mockProtocol;
    }

    // 🔁 Called automatically when a CCIP message is received
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        require(msg.sender == senderContract, "Invalid cross-chain sender");

        (address sender, uint256 amount, YieldData memory yieldData) =
            abi.decode(message.data, (address, uint256, YieldData));

        latestYield = yieldData;

        if (amount == 0 && sender == address(0)) {
            // 🧠 Strategy-only message
            emit YieldUpdateRequested();
            return;
        }

        // 💰 Deposit case: track user balance
        userBalances[sender] += amount;
        emit TokensReceived(message.messageId, message.sourceChainSelector, sender, amount, yieldData.name);

        // ✅ Approve the mock protocol to pull LINK
        require(linkToken.approve(mockProtocol, amount), "Approve failed");

        // 🧾 Call depositFor(sender, amount) on mock
        (bool success, ) = mockProtocol.call(
            abi.encodeWithSignature("depositFor(address,uint256)", sender, amount)
        );

        require(success, "Deposit to mock failed");
    }

    // Automation-compatible (optional for future extensions)
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = bytes(latestYield.name).length > 0;
        performData = "";
    }

    function performUpkeep(bytes calldata) external override {
        emit YieldUpdateRequested();
    }

    function manualWithdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Not enough balance");
        userBalances[msg.sender] -= amount;
        require(linkToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function getUserBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }
}
