import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";
import {formatEther} from "ethers"

export const fetchClientsThunk = createAsyncThunk(
    "client/fetchClientsThunk",
    async (_, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            const clients = await contract.getUserBalance();
            const parsedClients = clients.map(([user, isRegistered, balance]) => ({
                user, isRegistered, balance: formatEther(balance.toString())
            }))
            console.log("Clints array", clients)
            return parsedClients;
        } catch (error) {
            return rejectWithValue(error.error);
        }
    }
)
