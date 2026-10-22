import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const getDailySale = "/api/dailysale/getDailySaleHistoryForBranch";
const getDailySaleById = "/api/dailysale/getDailySaleById";
const cashOutUrlAsyncUrl = "/api/dailysale/cashOutForBranch";

// GET DAILY SALE HISTORY THUNK
export const getDailySaleAsync = createAsyncThunk("dailysale/history", async (data) => {
    const query = buildQueryParams({
      page: data.page,
      limit: data.limit,
      search: data.date,
    });
    try {
        const response = await axios.post(`${getDailySale}?${query}`, { id: data.id });
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.error);
    }
}
);


// GET DAILY SALE BY ID THUNK
export const getDailySaleByIdAsync = createAsyncThunk("dailysale/byId", async (id) => {
    try {
        const response = await axios.post(getDailySaleById, id);
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.error);
   
    }
}
);

//CASH OUT SLICE
export const BranchCashOutAsync = createAsyncThunk(
    "DailySale/CashOutForBranch",
    async (formData) => {
      try {
        const response = await axios.post(cashOutUrlAsyncUrl, formData);
        toast.success(response.data.message);       
        return response.data;
      } catch (error) {
        toast.error(error.response.data.error);
      }
    }
  );


// INITIAL STATE
const initialState = {
    DailySaleHistory: [],
    DailySaleById: [],
    loading: false,
    cashOutLoading:false
};

const DailySaleSlice = createSlice({
    name: "DailySaleSlice",
    initialState,
    extraReducers: (builder) => {
        builder

            // GET DAILY SALE HISTORY
            .addCase(getDailySaleAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(getDailySaleAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.DailySaleHistory = action.payload
            })

            // CASH OUT CASE
            .addCase(BranchCashOutAsync.pending, (state) => {
                state.cashOutLoading = true;
            })
            .addCase(BranchCashOutAsync.fulfilled, (state, action) => {
                state.cashOutLoading = false;
            })

            // GET DAILY SALE BY ID
            .addCase(getDailySaleByIdAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(getDailySaleByIdAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.DailySaleById = action.payload
            })
    },
});


export default DailySaleSlice.reducer;
