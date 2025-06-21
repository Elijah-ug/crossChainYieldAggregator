import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";

export const fetchClientsThunk = createAsyncThunk(
    "client/fetchClientsThunk",
    async (_, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            const clients = await contract.getUserBalance();
            const parsedClients = clients.map(([user, isRegistered, balance]) => ({
                user, isRegistered, balance: balance.toString()
            }))
            console.log("Clints array", parsedClients)
            return parsedClients;
        } catch (error) {
            return rejectWithValue(error.error);
        }
    }
)
