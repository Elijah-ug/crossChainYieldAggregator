require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const { buildRequestCBOR } = require("@chainlink/functions-toolkit");

// const contractABI = require("../artifacts/contracts/sender/CCIPSender.sol/CCIPSender.json").abi;
const contractABI = require("../artifacts/contracts/sender/CCIPSender.sol/AutoCCIPSender.json").abi;


const CONTRACT_ADDRESS = "0xc614E8A7c42a7da1F848De39a5a74B2ce2E66759";
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// Inline JS source as a string — still inline but embedded inside this script
const source = `
const response = await Functions.makeHttpRequest({
  url: "https://yields.llama.fi/pools"
});
if (response.error) throw Error("Fetch failed");

const chains = ["Polygon", "Ethereum", "Avalanche", "Base", "Arbitrum"];
const pools = response.data.data;
const filtered = pools.filter(p =>
  chains.includes(p.chain) &&
  p.symbol.toLowerCase() === "usdc" &&
  p.apyBase !== null
).sort((a, b) => b.apyBase - a.apyBase);

const best = filtered[0] ?? {};
const result = [
  best.poolMeta ?? "Unknown Strategy",
  best.chain ?? "Unknown",
  best.symbol ?? "USDC",
  best.pool ?? "0x0000000000000000000000000000000000000000",
  Math.round((best.apyBase ?? 0) * 1e4)
];

return Functions.encodeAbi(["tuple(string,string,string,string,uint256)"], [result]);
`;

async function sendYieldRequest() {
  try {
    const subscriptionId = Number(process.env.CHAINLINK_SUBSCRIPTION_ID);
    const gasLimit = 300_000;
    const donId = ethers.encodeBytes32String("fun-ethereum-sepolia-1");

    // Build CBOR request with inline JS source
    const cborPayload = buildRequestCBOR({
      source,
      codeLocation: 0, // Inline source
      codeLanguage: 0, // JavaScript
      secretsLocation: 0, // No secrets
      args: [],
      bytesArgs: [],
    });

    const tx = await contract.requestBestYieldUpdate(cborPayload);
    console.log("📤 Request sent! Tx hash:", tx.hash);
    await tx.wait();
    console.log("✅ Yield fetch triggered successfully!");
  } catch (err) {
    console.error("❌ Error sending request:", err.message);
  }
}

sendYieldRequest();
