import { createAsyncThunk } from "@reduxjs/toolkit"
import {toast} from "react-toastify"
import { fetchRegisterUser } from "../register/registerUserThunk"

export const connectWallet = createAsyncThunk(
    "auth/connectWallet",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            if (!window.ethereum) throw new Error("Metamask Not detected")
            const ethSepoliaChainId = "0xaa36a7"
            const network = await window.ethereum.request({ method: "eth_chainId" });
            // if (ethSepoliaChainId !== network) {
            //     await window.ethereum.request({
            //         method: "wallet_switchEthereumChain",
            //         params: [{chainId: ethSepoliaChainId}]
            //     })
            // }
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
            dispatch(fetchRegisterUser())
            toast.success("Wallet connected")
            return {address: accounts[0], chainId: network }
        } catch (error) {
            rejectWithValue(error.message);
        }
    }
)
