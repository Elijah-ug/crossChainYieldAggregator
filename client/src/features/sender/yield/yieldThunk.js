import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";
import { toast } from "react-toastify";

export const fetchBestYieldData = createAsyncThunk(
    "data/fetchBestYieldData",
    async (__, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            console.log("contract address", contract.target)
            const bestYieldData = await contract.bestYield();
            console.log("bestYieldData.project:==> ", bestYieldData);
            toast.success("Data fetched")
            // const [project, chain, symbol, poolAddress, apy] = bestYieldData;

//    return { project, chain, symbol, poolAddress, apy: Number(apy).toFixed(2)};
            return {
                project: bestYieldData.project,
                chain: bestYieldData.chain,
                symbol: bestYieldData.symbol,
                poolAddress: bestYieldData.poolAddress,
                apy: (Number(bestYieldData.apy)).toFixed(2)

            }
        } catch (error) {
            console.log(error.message)
            toast.error("Data not fetched")
            return rejectWithValue(error.value)
        }
    }
)
