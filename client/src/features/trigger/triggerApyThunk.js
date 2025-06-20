import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../assets/contract";
import {ethers} from "ethers"

export const fetchTriggerBestApy = createAsyncThunk(
    "trigger/fetchTriggerBestApy",
    async (_, { rejectWithValue }) => {


        try {

            const contract = await getContract();
            contract.on("requestSent", (requestId) => {
                console.log("Request event", requestId);
            })
            const tx = await contract.requestBestYieldUpdate();
            await tx.wait();
            console.log(tx);
        } catch (error) {
            console.log("❌ error in triggering", error.message);
            return rejectWithValue(error.message);
        }
    }
)
