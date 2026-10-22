import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

//API URL
const createReturn = "/api/returns/createReturn";


// GET BUYER FOR BRANCH THUNK
export const CreateReturnforBranch = createAsyncThunk(
  "Returns/create",
  async (data) => {
    try {
      const response = await axios.post(createReturn, data);
      toast.success(response.data.message)
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// INITIAL STATE
const initialState = {
  Returnloading: false,
};

const ReturnSlice = createSlice({
  name: "ReturnSlice",
  initialState,
  extraReducers: (builder) => {
    builder


      // GET BUYER FOR BRANCH
      .addCase(CreateReturnforBranch.pending, (state) => {
        state.Returnloading = true;
      })
      .addCase(CreateReturnforBranch.fulfilled, (state) => {
        state.Returnloading = false;
      });
  },
});

export default ReturnSlice.reducer;
