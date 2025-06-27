import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";

export const fetchConstants = createAsyncThunk(
    "baseSepolia/fetchSetReceiverAndChain",
    async (_, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            const receiver = await contract.receiverAddress();
            const selector = await contract.destinationChainSelector();

            console.log("Constants fetched");
            return {receiver, selector};
        } catch (error) {
            console.log(error.message);
            return rejectWithValue(error.message);
        }
    }
)
