import {createSlice} from "@reduxjs/toolkit";
import { autoConnectWallet, connectWallet } from "./walletThunk";

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
                state.error = null;
            })
            .addCase(connectWallet.fulfilled, (state, action) => {
                state.loading = false;
                state.address = action.payload?.address;
                state.chainId = action.payload?.chainId;
            })
            .addCase(connectWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(autoConnectWallet.fulfilled, (state, action) => {
                state.loading = false;
                state.address = action.payload.address;
                state.chainId = action.payload.chainId;
            })
            .addCase(autoConnectWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    }
})
export default walletSlice.reducer;
