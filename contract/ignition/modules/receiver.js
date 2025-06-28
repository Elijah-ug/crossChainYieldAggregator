const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ccipRouter = "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93";
const linkTokenAddress = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410";
const senderAddress = "0xb04B88014993C5Cf1b65C2455A160f1Fe87aC124";
const mockAddress = "0xc55f36B3703153fC04ACC76ce83CF4E9e6d3d622";
module.exports = buildModule("ReceiverModule", (m) => {
    const ROUTER = m.getParameter("router", ccipRouter);
    const LINK_ADDRESS = m.getParameter("linkToken", linkTokenAddress);
    const SENDER = m.getParameter("senderContract", senderAddress);
    const MOCK = m.getParameter("mockProtocol", mockAddress);
    const deployedContract = m.contract( "ReceiverContract", [ROUTER, LINK_ADDRESS, SENDER, MOCK] )
    return {deployedContract}
})
