 require("dotenv").config({ path: "../.env" });
 const config = {
    contractAddress: "0xD0037688d70D0B587d4915813b2ef815DA8D9613",
    chainlinkOracle: "0x447Fd5eC2D383091C22B8549cb231a3bAD6d3fAf",
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL,
    gasLimit: 500000,
    donId: "fun-ethereum-sepolia-1",
    subscriptionId: ""
  };
module.exports = config;
