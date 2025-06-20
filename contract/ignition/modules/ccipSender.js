const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");
require("dotenv").config()
  const linkTokenAddress = "0x779877a7b0d9e8603169ddbd7836e478b4624789";           // LINK token for CCIP fees
  const ccipRouterAddress = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";         // CCIP router address for sending cross-chain messages
  const usdcTokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";           // USDC token used in your yield strategy
const chainlinkOracle = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";         // Chainlink Functions Oracle address
const subscriptionId = parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID);
const donId = ethers.encodeBytes32String("fun-ethereum-sepolia-1");
const gassLimit = 300000;

module.exports = buildModule("CCIPSenderModule", (m) => {
  // Replace these with actual addresses from your environment/testnet
  const LINK_TOKEN = m.getParameter("linkToken", linkTokenAddress);
  const CCIP_ROUTER = m.getParameter("ccipRouter", ccipRouterAddress);
  const USDC_TOKEN = m.getParameter("usdcToken", usdcTokenAddress);
  const ORACLE = m.getParameter("oracle", chainlinkOracle);
  const SUBSCRIPTION_ID = m.getParameter("subscriptionId", subscriptionId);
  const GAS_LIMIT = m.getParameter("gassLimit", gassLimit);
  const DON_ID = m.getParameter("donId", donId);


  // Deploy the contract with constructor args
  const ccipSender = m.contract("AutoCCIPSender",
    [LINK_TOKEN, CCIP_ROUTER, USDC_TOKEN, ORACLE, SUBSCRIPTION_ID, GAS_LIMIT, DON_ID]);

  return { ccipSender };
});
