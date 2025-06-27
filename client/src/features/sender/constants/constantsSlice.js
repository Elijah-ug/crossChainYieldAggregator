import { createSlice } from "@reduxjs/toolkit";
import { fetchConstants } from "./constantsThunk";

const initialState = {
    loading: false,
    receiver: null,
    selector: null,
    error: null
}
const constantsSlice = createSlice({
    name: "constants",
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchConstants.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchConstants.fulfilled, (state, action) => {
                state.loading = false;
                state.receiver = action.payload.receiver;
                state.selector = action.payload.selector;
            })
            .addCase(fetchConstants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
        })
    }
})
export default constantsSlice.reducer;
