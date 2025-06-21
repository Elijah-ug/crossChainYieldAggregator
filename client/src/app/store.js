import { configureStore } from "@reduxjs/toolkit";
import walletSliceReducer from "../features/sender/auth/walletSlice";
import yieldSliceReducer from "../features/sender/yield/yieldSlice"
import clientSliceReducer from "../features/sender/clients/clientSlice"
export const store = configureStore({
    reducer: {
        auth: walletSliceReducer,
        yield: yieldSliceReducer,
        clients: clientSliceReducer,
    }
})
