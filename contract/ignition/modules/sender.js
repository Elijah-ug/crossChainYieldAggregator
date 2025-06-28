const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

  const linkTokenAddress = "0x779877a7b0d9e8603169ddbd7836e478b4624789";           // LINK token for CCIP fees
  const ccipRouterAddress = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";         // CCIP router address for sending cross-chain messages
  const chainlinkOracle = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";         // Chainlink Functions Oracle address

module.exports = buildModule("CCIPSenderModule", (m) => {
  // Replace these with actual addresses from your environment/testnet
  const LINK_TOKEN = m.getParameter("linkToken", linkTokenAddress);
  const CCIP_ROUTER = m.getParameter("ccipRouter", ccipRouterAddress);
  const ORACLE = m.getParameter("oracle", chainlinkOracle);

  // Deploy the contract with constructor args
  const ccipSender = m.contract( "CCIPSender", [ LINK_TOKEN, CCIP_ROUTER, ORACLE ]);

  return { ccipSender };
});
