import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

const getAllPackingsUrl = "/api/process/packing/getAllPackings";
const deletePackingUrl = "/api/process/packing/deletePacking";

export const getAllPackingsAsync = createAsyncThunk(
  "packing/getAll",
  async (data) => {
    try {
      const query = buildQueryParams({
        page: data.page,
        limit: data.limit,
        search: data.search,
        embroidery_Id: data.embroidery_Id,
      });
      const response = await axios.post(`${getAllPackingsUrl}?${query}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error);
    }
  }
);

export const deletePackingAsync = createAsyncThunk(
  "packing/delete",
  async (data) => {
    try {
      const response = await axios.post(deletePackingUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error);
      throw new Error(error.response?.data?.error);
    }
  }
);

const initialState = {
  Packings: {},
  packingsLoading: false,
  deletePackingLoading: false,
};

const PackingSlice = createSlice({
  name: "Packing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllPackingsAsync.pending, (state) => {
        state.packingsLoading = true;
      })
      .addCase(getAllPackingsAsync.fulfilled, (state, action) => {
        state.packingsLoading = false;
        state.Packings = action.payload;
      })
      .addCase(getAllPackingsAsync.rejected, (state) => {
        state.packingsLoading = false;
        state.Packings = {};
      })

      .addCase(deletePackingAsync.pending, (state) => {
        state.deletePackingLoading = true;
      })
      .addCase(deletePackingAsync.fulfilled, (state) => {
        state.deletePackingLoading = false;
      })
      .addCase(deletePackingAsync.rejected, (state) => {
        state.deletePackingLoading = false;
      });
  },
});

export default PackingSlice.reducer;
