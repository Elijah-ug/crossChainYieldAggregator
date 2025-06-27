import { createAsyncThunk } from "@reduxjs/toolkit"
import {toast} from "react-toastify"

export const connectWallet = createAsyncThunk(
    "auth/connectWallet",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            if (!window.ethereum) throw new Error("Metamask Not detected")
            const ethereumSepoliaChainId = "0xaa36a7"
            // const baseSepoliaChainId = "0x14a34"
            const network = await window.ethereum.request({ method: "eth_chainId" });
            if (ethereumSepoliaChainId !== network) {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{chainId: ethereumSepoliaChainId}]
                })
            }
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
            toast.success("Wallet connected")
            return {address: accounts[0], chainId: network }
        } catch (error) {
            rejectWithValue(error.message);
        }
    }
)

export const autoConnectWallet = createAsyncThunk(
    "auth/autoConnectWallet",
    async (_, { rejectWithValue }) => {
      try {
        if (!window.ethereum) {
          throw new Error("Metamask not installed");
        }
        const ethereumSepoliaChainId = "0xaa36a7"

        const network = await window.ethereum.request({ method: "eth_chainId" });
        console.log("Chain Id: ", network)
        if (network !== ethereumSepoliaChainId) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ethereumSepoliaChainId }]
          });
        }
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        console.log("Chain Id: ", network)
        if (accounts.length === 0) {
          return rejectWithValue("Wallet not connected");
        }
        return { address: accounts[0], chainId: network };
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );
