import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../assets/contract";
import { toast } from "react-toastify";

export const fetchSetReceiverAndChain = createAsyncThunk(
    "selector/fetchSetReceiverAndChain",
    async ({ receiver, selector }, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            const receiverAndSelector = await contract.setReceiverAndChain(receiver, selector);
            await receiverAndSelector.wait();
            toast.success("Receiver and selector set!")
            console.log(receiver, selector);
        } catch (error) {
            toast.error("Receiver and Selector setting Failed");
            console.log(error.message);
            return rejectWithValue(error.message);
        }
    }
)
