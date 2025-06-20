// import contractAbi from "../utils/CCIPSender.json"
import contractAbi from "../../../contract/artifacts/contracts/sender/AutoCCIPSender.sol/CCIPSender.json"
import { ethers } from "ethers"
import { CCIPSenderAddress } from "../../config";
const getProvider = () => {
    if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    } else {
        throw new Error("Metamask Not installed")
    }
}
const getSigner = async () => {
    const provider = getProvider();
    await provider.send("eth_requestAccounts", []);
    return await provider.getSigner()
}
const getContract = async () => {
    if(!CCIPSenderAddress) throw new Error("Contract Address Unavailable")
    const signer = await getSigner();
    const contract = new ethers.Contract(CCIPSenderAddress, contractAbi.abi, signer);
    // console.log("contract address", contract.target)

    return contract;
}
export { getProvider, getSigner, getContract }
