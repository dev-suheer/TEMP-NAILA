import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const createOtherAccountUrl = `/api/otheraccounts/createOtherAccount`;
const getAllOtherAccountsUrl = `/api/otheraccounts/getAllOtherAccounts`;
const getOtherAccountDataByIdUrl = `/api/otheraccounts/getOtherAccountDataById`;
const creditDebitOtherAccountUrl = `/api/otheraccounts/creditDebitOtherAccount`;
const deleteOtherAccontsTransactionUrl = `/api/otheraccounts/deleteOtherAccontsTransaction`;

// CREATE OTHER ACCOUNT
export const createOtherAccountAsync = createAsyncThunk(
  "OtherAccounts/CreateOtherAccount",
  async (data) => {
    try {
      const response = await axios.post(createOtherAccountUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//GET ALL OTHER ACCOUNTS
export const getAllOtherAccountsAsync = createAsyncThunk(
  "OtherAccounts/GetOtherAccount",
  async (data) => {
    const query = buildQueryParams({
      page: data.page,
      limit: data.limit,
      name: data.search,
    });
    try {
      const response = await axios.get(`${getAllOtherAccountsUrl}?${query}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

//GET OTHER ACCOUNT BY ID
export const getOtherAccountDataByIdAsync = createAsyncThunk(
  "OtherAccounts/GetOtherAccountById",
  async (data) => {
    try {
      const response = await axios.get(
        `${getOtherAccountDataByIdUrl}/${data.id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

// CREDIT DEBIT OTHER ACCOUNT
export const creditDebitOtherAccountAsync = createAsyncThunk(
  "OtherAccounts/CreditDebitOtherAccount",
  async (data) => {
    try {
      const response = await axios.post(creditDebitOtherAccountUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//DELETE OTHER ACCOUNT TRANSACTION
export const delteOtherAccountTransactionAsync = createAsyncThunk(
  "OtherAccounts/DeleteOtherAccounts",
  async (data) => {
    try {
      const response = await axios.post(
        `${deleteOtherAccontsTransactionUrl}/${data.id}`
      );
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

// INITIAL STATE
const initialState = {
  OtherAccounts: [],
  OtherAccount: null,
  loading: {
    create: false,
    getAll: false,
    getById: false,
    creditDebit: false,
    delete: false,
  },
};

const OtherAccountsSlice = createSlice({
  name: "OtherAccounts",
  initialState,
  extraReducers: (builder) => {
    builder

      // CREATE OTHER ACCOUNT
      .addCase(createOtherAccountAsync.pending, (state) => {
        state.loading.create = true;
      })
      .addCase(createOtherAccountAsync.fulfilled, (state) => {
        state.loading.create = false;
      })
      .addCase(createOtherAccountAsync.rejected, (state) => {
        state.loading.create = false;
      })

      // GET OTHER ACCOUNTS
      .addCase(getAllOtherAccountsAsync.pending, (state) => {
        state.loading.getAll = true;
      })
      .addCase(getAllOtherAccountsAsync.fulfilled, (state, action) => {
        state.loading.getAll = false;
        state.OtherAccounts = action.payload;
      })
      .addCase(getAllOtherAccountsAsync.rejected, (state) => {
        state.loading.getAll = false;
      })

      // GET OTHER ACCOUNT BY ID
      .addCase(getOtherAccountDataByIdAsync.pending, (state) => {
        state.loading.getById = true;
      })
      .addCase(getOtherAccountDataByIdAsync.fulfilled, (state, action) => {
        state.loading.getById = false;
        state.OtherAccount = action.payload;
      })
      .addCase(getOtherAccountDataByIdAsync.rejected, (state) => {
        state.loading.getById = false;
      })

      // CREDIT DEBIT OTHER ACCOUNT
      .addCase(creditDebitOtherAccountAsync.pending, (state) => {
        state.loading.creditDebit = true;
      })
      .addCase(creditDebitOtherAccountAsync.fulfilled, (state) => {
        state.loading.creditDebit = false;
      })
      .addCase(creditDebitOtherAccountAsync.rejected, (state) => {
        state.loading.creditDebit = false;
      })

       // DELETE OTHER ACCOUNT TRANSACTION
      .addCase(delteOtherAccountTransactionAsync.pending, (state) => {
        state.loading.delete = true;
      })
      .addCase(delteOtherAccountTransactionAsync.fulfilled, (state) => {
        state.loading.delete = false;
      })
      .addCase(delteOtherAccountTransactionAsync.rejected, (state) => {
        state.loading.delete = false;
      });
  },
});

export default OtherAccountsSlice.reducer;
