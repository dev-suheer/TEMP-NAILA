import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { buildQueryParams } from "../Utils/Common";
import toast from "react-hot-toast";

const getbPairUrl = "/api/b_PairRouter/getAllBPairs";
const getOrderProcessPartiesUrl = "/api/b_PairRouter/getOrderProcessParties";
const getBPairStockForBillUrl = "/api/b_PairRouter/getBPairStockForBill";
const exchangeBPairBillUrl = "/api/b_PairRouter/exchangeBPairBill";

export const getbPairDataAsync = createAsyncThunk(
  "b_pair/getBpair",
  async (data) => {
    try {
      const query = buildQueryParams({
        page: data.page,
        limit: data.limit,
        category: data.category,
        search: data.search,
        stitch_type: data.stitch_type,
      });
      const response = await axios.post(`${getbPairUrl}?${query}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const getOrderProcessPartiesAsync = createAsyncThunk(
  "b_pair/getOrderProcessParties",
  async (data) => {
    try {
      const response = await axios.post(getOrderProcessPartiesUrl, data);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const getBPairStockForBillAsync = createAsyncThunk(
  "b_pair/getBPairStockForBill",
  async () => {
    try {
      const response = await axios.post(getBPairStockForBillUrl);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const exchangeBPairBillAsync = createAsyncThunk(
  "b_pair/exchangeBPairBill",
  async (data) => {
    try {
      const response = await axios.post(exchangeBPairBillUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

const initailState = {
  B_pairData: [],
  B_pairDataLoading: false,
  processParties: [],
  processPartiesLoading: false,
  bPairStockForBill: [],
  bPairStockForBillLoading: false,
  exchangeLoading: false,
};

const B_PairSlice = createSlice({
  name: "b_pair",
  initialState: initailState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      //GET BPAIR DATA
      .addCase(getbPairDataAsync.pending, (state) => {
        state.B_pairDataLoading = true;
      })
      .addCase(getbPairDataAsync.fulfilled, (state, action) => {
        state.B_pairDataLoading = false;
        state.B_pairData = action.payload;
      })
      .addCase(getbPairDataAsync.rejected, (state) => {
        state.B_pairDataLoading = false;
        state.B_pairData = [];
      })

      .addCase(getOrderProcessPartiesAsync.pending, (state) => {
        state.processPartiesLoading = true;
      })
      .addCase(getOrderProcessPartiesAsync.fulfilled, (state, action) => {
        state.processPartiesLoading = false;
        state.processParties = action.payload || [];
      })
      .addCase(getOrderProcessPartiesAsync.rejected, (state) => {
        state.processPartiesLoading = false;
        state.processParties = [];
      })

      .addCase(getBPairStockForBillAsync.pending, (state) => {
        state.bPairStockForBillLoading = true;
      })
      .addCase(getBPairStockForBillAsync.fulfilled, (state, action) => {
        state.bPairStockForBillLoading = false;
        state.bPairStockForBill = action.payload || [];
      })
      .addCase(getBPairStockForBillAsync.rejected, (state) => {
        state.bPairStockForBillLoading = false;
        state.bPairStockForBill = [];
      })

      .addCase(exchangeBPairBillAsync.pending, (state) => {
        state.exchangeLoading = true;
      })
      .addCase(exchangeBPairBillAsync.fulfilled, (state) => {
        state.exchangeLoading = false;
      });
  },
});

export default B_PairSlice.reducer;
