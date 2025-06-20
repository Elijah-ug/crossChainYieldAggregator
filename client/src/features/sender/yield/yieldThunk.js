import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";

export const fetchBestYieldData = createAsyncThunk(
    "data/fetchBestYieldData",
    async (__, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            console.log("contract address", contract.target)
            const bestYieldData = await contract.bestYield();
            console.log("bestYieldData.project: ", bestYieldData);
            if (!bestYieldData.project) {
                console.log("🤷🏾 No data fetched yet.");
            }

            return {
                project: bestYieldData.project,
                chain: bestYieldData.chain,
                symbol: bestYieldData.symbol,
                poolAddress: bestYieldData.poolAddress,
                apy: (Number(bestYieldData.apy) / 1e4).toFixed(2)

            }
        } catch (error) {
            return rejectWithValue(error.value)
        }
    }
)
