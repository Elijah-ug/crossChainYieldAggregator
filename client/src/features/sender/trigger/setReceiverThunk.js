import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";
import { toast } from "react-toastify";

export const fetchSetReceiverAndChain = createAsyncThunk(
    "baseSepolia/fetchSetReceiverAndChain",
    async ({ receiver, selector }, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            const setting = await contract.setReceiverAndChain(receiver, selector);
            await setting.wait();
            toast.success("Receiver and Selector set")
            console.log("Receiver Chain set");
            return true;
        } catch (error) {
            console.log(error.message);
            return rejectWithValue(error.message);
        }
    }
)
