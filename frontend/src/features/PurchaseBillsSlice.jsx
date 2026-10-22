import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

//API URL
const createBase = "/api/stock/base/addBaseInStock";
const createBag = "/api/stock/bags/addBagsAndBoxInStock";
const createLace = "/api/stock/lace/addLaceInStock";
const createAccesseries = "/api/stock/accessories/addAccesoriesInStock";
const createExpense = "/api/stock/expense/addExpense";

// CREATE BASE ASYNC THUNK
export const createBaseAsync = createAsyncThunk(
  "Base/create",
  async (formData) => {
    try {
      const response = await axios.post(createBase, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// CREATE BAG ASYNC THUNK
export const createBagAsync = createAsyncThunk(
  "Box/create",
  async (formData) => {
    try {
      const response = await axios.post(createBag, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// CREATE LACE ASYNC THUNK
export const createLaceAsync = createAsyncThunk(
  "Lace/Create",
  async (formData) => {
    try {
      const response = await axios.post(createLace, formData);
      toast.success(response.data.message);
  
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// CREATE ACCESSORIES ASYNC THUNK
export const createAsseceriesAsync = createAsyncThunk(
  "Asseceries/Create",
  async (formData) => {
    try {
      const response = await axios.post(createAccesseries, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// CREATE EXPENSE ASYNC THUNK
export const CeateExpenseAsync = createAsyncThunk(
  "Expense/Create",
  async (formData) => {
    try {
      const response = await axios.post(createExpense, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// INITIAL STATE
const initialState = {
  Shop: [],
  loading: false,
  baseLoading: false,
  expenseLoading: false
};

const PurchaseSlice = createSlice({
  name: "PurchaseSlice",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder

      // CREATE BASE
      .addCase(createBaseAsync.pending, (state, action) => {
        state.baseLoading = true;
      })
      .addCase(createBaseAsync.fulfilled, (state, action) => {
        state.baseLoading = false;
      })

      // CREATE BAG
      .addCase(createBagAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(createBagAsync.fulfilled, (state, action) => {
        state.loading = false;
      })

      // CREATE LACE
      .addCase(createLaceAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(createLaceAsync.fulfilled, (state, action) => {
        state.loading = false;
      })

      // CREATE ACCESSORIES
      .addCase(createAsseceriesAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(createAsseceriesAsync.fulfilled, (state, action) => {
        state.loading = false;
      })

      // CREATE EXPENSE
      .addCase(CeateExpenseAsync.pending, (state, action) => {
        state.expenseLoading = true;
      })
      .addCase(CeateExpenseAsync.fulfilled, (state, action) => {
        state.expenseLoading = false;
      });
  },
});

export const { reset } = PurchaseSlice.actions;

export default PurchaseSlice.reducer;
