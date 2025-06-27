
require("dotenv").config({ path: "../.env" });
const axios = require("axios");
const { ethers, AbiCoder } = require("ethers");
const contractABI = require("../artifacts/contracts/sender/AutoCCIPSender.sol/CCIPSender.json").abi;

const ETHEREUM_SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(ETHEREUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const abiCoder = new AbiCoder();

async function sendBestYieldRequest() {
  try {
    console.log("🚀 Fetching best USDC yield from DeFiLlama...");

    // Step 1: Fetch yield data
    const response = await axios.get("https://yields.llama.fi/pools");
    const pools = response.data.data;

    const supportedChains = ["Polygon", "Ethereum", "Avalanche", "Base", "Arbitrum"];
    const filtered = pools.filter(
      (p) =>
        supportedChains.includes(p.chain) &&
        p.symbol.toLowerCase() === "usdc" &&
        p.apyBase !== null
    );

    if (filtered.length === 0) throw new Error("No valid USDC pools found!");

    filtered.sort((a, b) => b.apyBase - a.apyBase);
    const best = filtered[0];
    console.log("CONTRACT_ADDRESS: ", CONTRACT_ADDRESS)
    console.log("✅ Best Pool Found:", best.poolMeta, "on", best.chain, "APY:", best.apyBase);

    // Step 2: Encode result for Solidity
    const encoded = abiCoder.encode(
      ["tuple(string project,string chain,string symbol,string poolAddress,uint256 apy)"],
      [[
        best.poolMeta || "Unknown Strategy",
        best.chain || "Unknown Chain",
        best.symbol || "USDC",
        best.pool || "0x0000000000000000000000000000000000000000",
        Math.round((best.apyBase || 0) * 1e4)
      ]]
    );

    console.log("📦 Encoded yield data ready.");

    // Step 3: Call update function on contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    const tx = await contract.updateBestYield(encoded);
    console.log("📤 Transaction sent. Tx hash:", tx.hash);

    await tx.wait();
    console.log("✅ Best yield updated on-chain!");

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}
sendBestYieldRequest();

module.exports = {sendBestYieldRequest}
