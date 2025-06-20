require("dotenv").config({ path: "../.env" });
const { id, getBytes, ethers } = require("ethers")


const encodedId = ethers.encodeBytes32String("fun-ethereum-sepolia-1"); // ✅ v6 correct
 const config = {
    contractAddress: "0xEEbE751D58a0AFAAe5aFCef016A6ee0677D72eB3",
    chainlinkOracle: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL,
    gasLimit: 300000,
    donId: encodedId,
    subscriptionId: Number(process.env.CHAINLINK_SUBSCRIPTION_ID)
 };
 console.log("DON ID bytes32:", encodedId);

module.exports = config;
