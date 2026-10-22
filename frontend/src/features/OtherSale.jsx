import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const generateOtherBillUrl = `/api/otherSale/generateOtherSaleBill`;
const getAllOtherSaleBillsUrl = `/api/otherSale/getAllOtherSaleBills`;
const deleteOtherSaleBillUrl = `/api/otherSale/deleteOtherSaleBill`;

export const getAllOtherSaleBillsAsync = createAsyncThunk(
  "OtherBills/getAllOtherSaleBills",
  async (data) => {
    const query = buildQueryParams({
      page: data.page,
      limit: data.limit,
      search: data.search,
    });
    try {
      const response = await axios.post(
        `${getAllOtherSaleBillsUrl}?${query}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
);

// GENERATE OTHER SALE
export const generateOtherSaleAsync = createAsyncThunk(
  "OtherBills/generateOtherBills",
  async (data) => {
    try {
      const response = await axios.post(generateOtherBillUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

export const deleteOtherSaleBillAsync = createAsyncThunk(
  "OtherBills/deleteOtherSaleBill",
  async (data) => {
    try {
      const response = await axios.post(deleteOtherSaleBillUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data);
      throw error;
    }
  }
);

// INITIAL STATE
const initialState = {
  otherSaleBills: [],
  generateOtherSaleLoading: false,
  otherSaleBillsLoading: false,
  deleteOtherSaleBillLoading: false,
};

const OtherBillSlice = createSlice({
  name: "OtherBillSlice",
  initialState,
  extraReducers: (builder) => {
    builder

      // GENERATE OTHER SALE
      .addCase(generateOtherSaleAsync.pending, (state) => {
        state.generateOtherSaleLoading = true;
      })
      .addCase(generateOtherSaleAsync.fulfilled, (state) => {
        state.generateOtherSaleLoading = false;
      })

      // GENERATE OTHER SALE
      .addCase(getAllOtherSaleBillsAsync.pending, (state) => {
        state.otherSaleBillsLoading = true;
      })
      .addCase(getAllOtherSaleBillsAsync.fulfilled, (state,action) => {
        state.otherSaleBillsLoading = false;
        state.otherSaleBills = action.payload;
      })

      // DELETE OTHER SALE
      .addCase(deleteOtherSaleBillAsync.pending, (state) => {
        state.deleteOtherSaleBillLoading = true;
      })
      .addCase(deleteOtherSaleBillAsync.fulfilled, (state) => {
        state.deleteOtherSaleBillLoading = false;
      })
      .addCase(deleteOtherSaleBillAsync.rejected, (state) => {
        state.deleteOtherSaleBillLoading = false;
      });
  },
});

export default OtherBillSlice.reducer;
