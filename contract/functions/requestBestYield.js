require("dotenv").config({path: "../.env"});

const  getBestYield  =  require("./getBestApy.js");
const  ethers  =  require("ethers");
const  config  =  require("./functionsConfig.js");
const pk = require("@chainlink/functions-toolkit");
const pkg = require("@chainlink/functions-toolkit");
const { FunctionsConsumerContract } = pkg;

// ✅ Setup provider and signer
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function requestBestYield() {
  try {
    console.log("🔑 Loaded private key:", wallet.address);
    console.log("🔍 Fetching yield data...");

    const encodedData = await getBestYield();

    // ✅ Interact with deployed contract
    const functionsConsumer = new ethers.Contract(
      config.contractAddress,
      FunctionsConsumerContract.abi,
      wallet
    );

    const tx = await functionsConsumer.sendRequest(
      "", // Empty source if encodedRequest is already encoded
      encodedData,
      config.subscriptionId,
      config.gasLimit,
      config.donId
    );

    console.log("✅ Request sent! Tx Hash:", tx.hash);
    await tx.wait();
    console.log("🎉 Request fulfilled!", tx);

  } catch (err) {
    console.error("❌ Failed to send Chainlink Function request:", err.message);
  }
}

requestBestYield();
