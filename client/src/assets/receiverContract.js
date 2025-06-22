import { getSigner } from "./contract"
 import contractAbi from "../../../contract/artifacts/contracts/receiver/CCIPReceiver.sol/ReceiverContract.json"
import { ethers } from "ethers";
import { CCIPReceiverAddress } from "../../config";
export const getReceiverContract = async () => {
    const signer = await getSigner();
    const contract = new ethers.Contract(CCIPReceiverAddress, contractAbi.abi, signer);
    console.log(contract.target);
    return contract;
}
