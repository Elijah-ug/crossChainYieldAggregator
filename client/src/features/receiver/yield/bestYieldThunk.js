import { createAsyncThunk } from "@reduxjs/toolkit";
import { getReceiverContract } from "../../../assets/receiverContract";

export const fetchBestReceiverYield = createAsyncThunk(
    "receivedYield/fetchBestReceiverYield",
    async (_, { rejectWithValue }) => {
        try {
            const contract = await getReceiverContract();
            const latestYield = await contract.getLatestStrategy();
            // console.log("latestYield: ", latestYield);
            console.log("contract: ", contract);
            console.log("contract.target: " + contract.target);
            const [project, poolAddress, symbol, rawApy] = latestYield;
            console.log("Projects ====: ", project)
             return { project, poolAddress, symbol, apy: rawApy.toString(), };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
)
