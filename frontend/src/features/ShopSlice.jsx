import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const createShop = "/api/branches/createBranch";
const DeletShop = "/api/branches/deleteBranch";
const UpdateShop = "/api/branches/updateBranch";
const GetShop = "/api/branches/getAllBranches";
const getBranchCashoutHistoryUrl = "/api/branches/getBranchCashoutHistory";

//CREATE ASYNC THUNK
export const createShopAsync = createAsyncThunk(
  "Shop/create",
  async (formData) => {
    try {
      const response = await axios.post(createShop, formData);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// lOGIN ASYNC THUNK
export const UpdateShopAsync = createAsyncThunk(
  "Shop/Update",
  async (formData) => {
    try {
      const response = await axios.post(UpdateShop, formData);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// FORGET ASYNC THUNK
export const DeleteShop = createAsyncThunk("Shop/Delete", async (formData) => {
  try {
    const response = await axios.post(DeletShop, formData);
    return response.data;
  } catch (error) {
    toast.error(error.response.data.error);
  }
});

// VERIFY ASYNC THUNK
export const GetAllShop = createAsyncThunk("Shop/Get", async () => {
  try {
    const response = await axios.post(GetShop);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
});

//GET BRANCH CASH OUT HISTORY
export const getBranchCashoutHistoryAsync = createAsyncThunk(
  "Branch/BranchCashOut",
  async ({ page, limit }) => {
    const query = buildQueryParams({
      page: page,
      limit,
    });
    try {
      const response = await axios.post(
        `${getBranchCashoutHistoryUrl}?${query}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
);

// INITIAL STATE
const initialState = {
  Shop: [],
  loading: false,
  historyLoading:false,
  BranchcashOutHistory: [],
};

const authSlice = createSlice({
  name: "authSlice",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder

      // Shop Add ADD CASE
      .addCase(createShopAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(createShopAsync.fulfilled, (state, action) => {
        state.loading = false;
      })

      // LOGIN ADD CASE
      .addCase(GetAllShop.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetAllShop.fulfilled, (state, action) => {
        state.loading = false;
        state.Shop = action.payload;
      })

      // UPDATE SHOP CASE
      .addCase(UpdateShopAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(UpdateShopAsync.fulfilled, (state, action) => {
        state.loading = false;
      })

      //DELETE SHOP CASE
      .addCase(DeleteShop.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(DeleteShop.fulfilled, (state, action) => {
        state.loading = false;
      })

      //BRANCH CASH OUT HISTORY ASYNC
      .addCase(getBranchCashoutHistoryAsync.pending, (state, action) => {
        state.historyLoading = true;
      })
      .addCase(getBranchCashoutHistoryAsync.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.BranchcashOutHistory = action.payload;
      })
        .addCase(getBranchCashoutHistoryAsync.rejected, (state, action) => {
        state.historyLoading = false;
        state.BranchcashOutHistory = [];

      })
  },
});

export const { reset } = authSlice.actions;

export default authSlice.reducer;
