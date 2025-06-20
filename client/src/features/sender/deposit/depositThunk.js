import {createAsyncThunk} from "@reduxjs/toolkit"
import { getContract, getSigner } from "../../../assets/contract";
import { toast } from "react-toastify";
import { ethers } from "ethers";

// Create a helper to get the USDC token contract
const getUsdcTokenContract = async (signer) => {
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    const ERC20_ABI = [
      "function approve(address spender, uint256 amount) public returns (bool)"
    ];
    return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  };
export const fetchDepositThunk = createAsyncThunk(
    "deposit/fetchDepositThunk",
    async ({ amount }, { rejectWithValue }) => {
        try {
            const signer = await getSigner();
            const usdc = await getUsdcTokenContract(signer);
            const contract = await getContract();

            const parsedAmount = ethers.parseUnits(amount, 6)

            const approveTx = await usdc.approve(contract.target, amount);
            await approveTx.wait();

            const deposit = await contract.deposit(amount);
            await deposit.wait();
            toast.success("Deposited Successfully")
            return true;
        } catch (error) {
            toast.error("Deposit Failed");
            return rejectWithValue(error.value);
        }
    }
)
