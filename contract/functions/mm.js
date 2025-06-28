require("dotenv").config({ path: "../.env" });
const axios = require("axios");
const { ethers, AbiCoder } = require("ethers");
const contractABI = require("../artifacts/contracts/sender/CCIPSender.sol/CCIPSender.json").abi;

const ETHEREUM_SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(ETHEREUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const abiCoder = new AbiCoder();

const TOKEN = "link"; // 🔁 Change this if you want a different token like "dai", "usdt", etc.

async function sendBestYieldRequest() {
  try {
    console.log(`🚀 Fetching best ${TOKEN.toUpperCase()} yield from DeFiLlama...`);

    // Step 1: Fetch yield data from DeFiLlama API
    const response = await axios.get("https://yields.llama.fi/pools");
    const pools = response.data?.data;
    if (!pools || !Array.isArray(pools)) throw new Error("Invalid API response");

    const supportedChains = ["Polygon", "Ethereum", "Avalanche", "Base", "Arbitrum"];

    // Step 2: Filter pools by chain, token symbol, and valid APY
    const filtered = pools.filter(
      (p) =>
        supportedChains.includes(p.chain) &&
        p.symbol.toLowerCase() === TOKEN &&
        p.apyBase !== null
    );

    if (filtered.length === 0) throw new Error(`No valid ${TOKEN.toUpperCase()} pools found!`);

    // Step 3: Sort descending by APY and pick the best one
    filtered.sort((a, b) => b.apyBase - a.apyBase);
    const best = filtered[0];

    // Step 4: Encode the best pool info to send on-chain
    const encoded = abiCoder.encode(
      ["tuple(string,string,string,string,uint256)"],
      [[
        best.poolMeta ?? "Unknown Strategy",
        best.chain ?? "Unknown Chain",
        best.symbol ?? TOKEN.toUpperCase(),
        best.underlyingTokens?.[0] ?? "0x0000000000000000000000000000000000000000",
        Math.round(best.apyBase * 1e4)
      ]]
    );

    // Logging real best yield info
    console.log("🎯 Best Pool Selected:");
    console.log("- Project: ", best.poolMeta);
    console.log("- Chain:   ", best.chain);
    console.log("- Token:   ", best.symbol);
    console.log("- Address: ", best.underlyingTokens?.[0]);
    console.log("- APY:     ", best.apyBase);
    console.log("📦 Encoded:", encoded);

    // Step 5: Call smart contract function to store best yield
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    const tx = await contract.updateBestYield(encoded);
    console.log("📤 Tx sent:", tx.hash);
    await tx.wait();
    console.log(`✅ Best ${TOKEN.toUpperCase()} yield updated on-chain!`);

    // === MOCK PROTOCOLS SETUP ===
    /**
     * These mock protocols simulate how various DeFi strategies
     * would react to the fetched best APY pool.
     */
    const mockProtocols = [
      {
        name: "MockYieldOptimizerV1",
        minApyRequired: 0.03, // Only invest if APY ≥ 3%
        action: (pool) => {
          if (pool.apyBase >= 0.03) {
            console.log(`💰 Investing in ${pool.poolMeta} via OptimizerV1`);
          } else {
            console.log(`🚫 Skipping ${pool.poolMeta} due to low APY`);
          }
        }
      },
      {
        name: "MockDeFiRouterV2",
        chainTarget: "Polygon", // Only target Polygon pools
        action: (pool) => {
          if (pool.chain === "Polygon") {
            console.log(`🟣 Routing ${pool.symbol} to Polygon strategy in DeFiRouterV2`);
          } else {
            console.log(`⚪ Ignoring ${pool.poolMeta} as it is not on Polygon`);
          }
        }
      },
      {
        name: "MockEmergencyVault",
        fallbackIfApyBelow: 0.01, // Trigger emergency vault if APY < 1%
        action: (pool) => {
          if (pool.apyBase < 0.01) {
            console.log(`🚨 Moving funds to safe vault due to low APY: ${pool.apyBase}`);
          }
        }
      }
    ];

    // === EXECUTE MOCK PROTOCOLS ===
    console.log("\n🧪 Running Mock Protocol Logic...\n");
    mockProtocols.forEach(protocol => {
      protocol.action(best);
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

sendBestYieldRequest();

module.exports = { sendBestYieldRequest };
