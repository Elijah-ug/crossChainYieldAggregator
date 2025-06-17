const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ccipRouter = "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93"
const usdcTokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const senderAddress = "0xD0037688d70D0B587d4915813b2ef815DA8D9613"
module.exports = buildModule("ReceiverModule", (m) => {
    const ROUTER = m.getParameter("router", ccipRouter);
    const USDC_ADDRESS = m.getParameter("usdcToken", usdcTokenAddress)
    const SENDER = m.getParameter("senderContract", senderAddress);
    const deployedContract = m.contract( "ReceiverContract", [ROUTER, USDC_ADDRESS, SENDER] )
    return {deployedContract}
})
