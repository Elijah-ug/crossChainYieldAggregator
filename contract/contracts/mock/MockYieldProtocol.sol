// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MockYieldAggregator is AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    IERC20 public immutable linkToken;

    struct MockProtocol {
        string name;
        uint256 apy; // APY in basis points (e.g., 450 = 4.5%)
        uint256 totalDeposits;
        bool isActive;
    }

    mapping(uint256 => MockProtocol) public protocols;
    uint256 public protocolCount;
    uint256 public activeProtocolId;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastDepositTime;

    uint256 public updateInterval = 1 hours;
    uint256 public lastApyUpdate;

    event PoolRegistered(uint256 id, string name);
    event Deposit(address indexed user, uint256 amount, uint256 protocolId);
    event YieldUpdated(uint256 indexed protocolId, uint256 newApy);
    event Rebalanced(uint256 fromId, uint256 toId);
    event Withdrawal(address indexed user, uint256 amount);

    constructor(address _linkToken) Ownable(msg.sender) {
        linkToken = IERC20(_linkToken);
        lastApyUpdate = block.timestamp;
    }

    // Register mock protocols (called once)
    function registerMockPool(string memory name, uint256 apy) external onlyOwner {
        protocols[protocolCount] = MockProtocol(name, apy, 0, protocolCount == 0); // first one is active
        emit PoolRegistered(protocolCount, name);
        protocolCount++;
    }

    // Deposit LINK tokens into the currently active protocol
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(protocolCount > 0, "No protocols");

        linkToken.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        lastDepositTime[msg.sender] = block.timestamp;

        protocols[activeProtocolId].totalDeposits += amount;

        emit Deposit(msg.sender, amount, activeProtocolId);
    }

    // Withdraw deposited LINK (no yield calculation for demo simplicity)
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Not enough balance");

        balances[msg.sender] -= amount;
        linkToken.transfer(msg.sender, amount);

        protocols[activeProtocolId].totalDeposits -= amount;

        emit Withdrawal(msg.sender, amount);
    }

    // --- 🔁 Chainlink Automation functions for APY + Rebalancing ---

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = block.timestamp - lastApyUpdate > updateInterval;
        performData = "";
        return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata) external override {
        require(block.timestamp - lastApyUpdate > updateInterval, "Too soon");

        // Randomize APY for demo
        for (uint256 i = 0; i < protocolCount; i++) {
            uint256 newApy = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % 800) + 100; // 1.00% - 9.00%
            protocols[i].apy = newApy;
            emit YieldUpdated(i, newApy);
        }

        // Rebalance to best APY
        uint256 highestApy = 0;
        uint256 bestId = activeProtocolId;

        for (uint256 i = 0; i < protocolCount; i++) {
            if (protocols[i].apy > highestApy) {
                highestApy = protocols[i].apy;
                bestId = i;
            }
        }

        if (bestId != activeProtocolId) {
            protocols[activeProtocolId].isActive = false;
            protocols[bestId].isActive = true;
            emit Rebalanced(activeProtocolId, bestId);
            activeProtocolId = bestId;
        }

        lastApyUpdate = block.timestamp;
    }

    // === View helpers ===

    function getActiveProtocol() external view returns (string memory name, uint256 apy, uint256 total) {
        MockProtocol memory p = protocols[activeProtocolId];
        return (p.name, p.apy, p.totalDeposits);
    }

    function getProtocol(uint256 id) external view returns (string memory name, uint256 apy, bool active) {
        MockProtocol memory p = protocols[id];
        return (p.name, p.apy, p.isActive);
    }
}
