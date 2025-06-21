import { createSlice } from "@reduxjs/toolkit";
import { fetchClientsThunk } from "./clientThunk";

const initialState = {
    loading: false,
    clients: [],
    error: null
}
const clientSlice = createSlice({
    name: "clients",
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchClientsThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchClientsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.clients = action.payload;
            })
            .addCase(fetchClientsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
        })
    }
})
export default clientSlice.reducer;
