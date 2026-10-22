
import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { buildQueryParams } from "../Utils/Common";
import toast from "react-hot-toast";

//API URL
const getAllCashBookEntriesUrl = `/api/cashBook/getAllCashBookEntries`;
const deleteCashBookEntryUrl = '/api/cashbook/deleteCashBookEntry'

export const getAllCashBookEntriesAsync = createAsyncThunk(
  "CashBook/getAllCashBookEntries",
  async (filters) => {
    const query = buildQueryParams({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          account: filters.account,
          transactionType: filters.transactionType,
          branchId:filters.branchId
        });
    try {
      const response = await axios.get(`${getAllCashBookEntriesUrl}?${query}`);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
);

//DELETE CASH BOOK ENTRY
export const deleteCashBookEntryAsync = createAsyncThunk(
  "CashBook/DeleteCashbookEntry",
  async (id) => {
    try {
      const response = await axios.post(`${deleteCashBookEntryUrl}/${id}`);
      toast.success(response.data.message)      
      return response.data;
    } catch (error) {
      toast.error(error.response.data)
      throw new Error(error.response.data);
    }
  }
);

// INITIAL STATE
const initialState = {
  cashBookData: [],
  loading: false,
  deleteLoading: false
};

const CashBookSlice = createSlice({
  name: "CashBookSlice",
  initialState,
  extraReducers: (builder) => {
    builder

      // GET ALL CASH BOOK ENTRIES
      .addCase(getAllCashBookEntriesAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllCashBookEntriesAsync.fulfilled, (state,action) => {
        state.loading = false;
        state.cashBookData = action.payload;
      })
      .addCase(getAllCashBookEntriesAsync.rejected, (state) => {
        state.loading = false;
        state.cashBookData = [];
      })

       // DELETE CASH BOOK ENTRY
      .addCase(deleteCashBookEntryAsync.pending, (state) => {
        state.deleteLoading = true;
      })
      .addCase(deleteCashBookEntryAsync.fulfilled, (state,action) => {
        state.deleteLoading = false;
      })
      .addCase(deleteCashBookEntryAsync.rejected, (state) => {
        state.deleteLoading = false;
      })
  },
});

export default CashBookSlice.reducer;
 