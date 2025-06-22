import { createAsyncThunk } from "@reduxjs/toolkit";
import { getContract } from "../../../assets/contract";
import { toast } from "react-toastify";

export const fetchRegisterUser = createAsyncThunk(
    "user/fetchRegisterUser",
    async (__, { rejectWithValue }) => {
        try {
            const contract = await getContract();
            const user = await contract.registerUser()
            await user.wait();
            toast.success("Registered as User")
        } catch (error) {
            console.log(error.message);
            return rejectWithValue(error.message);
        }
    }
)
