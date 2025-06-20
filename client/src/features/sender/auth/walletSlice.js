import { createSlice } from "@reduxjs/toolkit";
import { connectWallet } from "./walletThunk";

const initialState = {
    address: null,
    chainId: null,
    loading: false,
    error: null
}
const walletSlice = createSlice({
    name: "auth",
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(connectWallet.pending, (state) => {
                state.loading = true;
            })
            .addCase(connectWallet.fulfilled, (state, action) => {
                state.address = action.payload.address;
                state.chainId = action.payload.chainId;
                state.loading = false;
            })
        .addCase(connectWallet.rejected, (state, action) => {
            state.error = action.payload;
            state.address = null;
            state.chainId = null;
            state.loading = false;
        })
    }
})
export default walletSlice.reducer;
