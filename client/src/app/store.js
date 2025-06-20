import { configureStore } from "@reduxjs/toolkit";
import walletSliceReducer from "../features/sender/auth/walletSlice";
import yieldSliceReducer from "../features/sender/yield/yieldSlice"
export const store = configureStore({
    reducer: {
        auth: walletSliceReducer,
        yield: yieldSliceReducer,
    }
})
