const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const linkTokenAddress = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410";

module.exports = buildModule("MockYieldAggregatorModule", (m) => {
  const LINK_TOKEN = m.getParameter("linkToken", linkTokenAddress);
  const ccipSender = m.contract("MockYieldAggregator", [LINK_TOKEN]);

  return { ccipSender };
});
