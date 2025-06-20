require("dotenv").config({path: "../.env"});

const  getBestYield  =  require("./getBestApy.js");
                                                                                                                                                                                                                                                  const  ethers  =  require("ethers");
const config = require("./functionsConfig.js");
const { toUtf8Bytes } = require("ethers")
// const pkg = require("@chainlink/functions-toolkit");
// const { FunctionsConsumerContract } = pkg;
const contractAbi = require("../artifacts/contracts/sender/CCIPSender.sol/CCIPSender.json")

// ✅ Setup provider and signer
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// console.log(config)
async function requestBestYield() {
  try {
    console.log("🔑 Loaded private key:", wallet.address);
    console.log("🔍 Fetching yield data...");

    const encodedData = await getBestYield();
    // console.log("encodedData hex:", encodedData);

    // ✅ Interact with deployed contract
    const functionsConsumer = new ethers.Contract(
      config.contractAddress,
      contractAbi.abi,
      wallet
    );
    console.log("functionsConsumer:", functionsConsumer);

    const tx = await functionsConsumer.sendRequestToGetBestYield(
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
