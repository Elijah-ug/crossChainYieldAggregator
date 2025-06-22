import { createAsyncThunk } from "@reduxjs/toolkit";
import { getReceiverContract } from "../../../assets/receiverContract";

export const fetchGetBalance = createAsyncThunk(
    "balance/fetchGetBalance",
    async ({address}, { rejectWithValue }) => {
        try {
            const contract = await getReceiverContract();
            const balance = await contract.getUserBalance(address);
            console.log("Balance: ", balance.toString());
            console.log(contract.target)
        } catch (error) {
            return rejectWithValue(error.error);
        }
    }
)
