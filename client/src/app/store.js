import { configureStore } from "@reduxjs/toolkit";
import walletSliceReducer from "../features/wallet/auth/walletSlice";
import yieldSliceReducer from "../features/sender/yield/yieldSlice"
import clientSliceReducer from "../features/sender/clients/clientSlice"
import constantsSliceReducer from "../features/sender/constants/constantsSlice"
export const store = configureStore({
    reducer: {
        "auth": walletSliceReducer,
        "yield": yieldSliceReducer,
        "clients": clientSliceReducer,
        "constants": constantsSliceReducer,
    }
})
