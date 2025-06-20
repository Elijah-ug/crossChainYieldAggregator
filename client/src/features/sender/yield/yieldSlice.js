import { createSlice } from "@reduxjs/toolkit";
import { fetchBestYieldData } from "./yieldThunk";

const initialState = {
    loading: false,
    bestYield: {
        project: "",
        chain: "",
        symbol: "",
        poolAddress: "",
        apy: ""
    },
    error: null
}

const yieldSlice = createSlice({
    name: "yield",
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchBestYieldData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchBestYieldData.fulfilled, (state, action) => {
                state.loading = false;
                state.bestYield = action.payload;
            })
            .addCase(fetchBestYieldData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
        })
    }
})
export default yieldSlice.reducer;
