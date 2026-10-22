import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { getStorage, setStorage } from "../../hooks/use-local-storage";

//API URL
const createPaymentMethodUrl = "/api/paymentMethods/createPaymentMethod";
const getAllPaymentMetodsUrl =
  "/api/paymentMethods/getAllPaymentMethodsForSuperAdmin";
const getAllPaymentMetodsForTransactionUrl =
  "/api/paymentMethods/getAllPaymentMethodsForTransaction";
const updatePaymentMethodUrl = "/api/paymentMethods/updatePaymentMethod";

// CREATE PAYMENT METHOD
export const createPaymentMethodAsync = createAsyncThunk(
  "PaymentMethods/Create",
  async (data) => {
    try {
      const response = await axios.post(createPaymentMethodUrl, data);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

// GET ALL PAYMENT METHODS
export const getAllPaymentMetodsAsync = createAsyncThunk(
  "PaymentMethods/getAll",
  async (data) => {
    try {
      const response = await axios.get(getAllPaymentMetodsUrl);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
);

// GET ALL PAYMENT METHODS FOR TRANSACTION
export const getAllPaymentMetodsForTransactionAsync = createAsyncThunk(
  "PaymentMethods/getForTransaction",
  async (data) => {
    try {
      const response = await axios.get(getAllPaymentMetodsForTransactionUrl);

      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
);

// UPDATE PAYMENT METHOD
export const updatePaymentMethodAsync = createAsyncThunk(
  "PaymentMethods/Update",
  async (data) => {
    try {
      const response = await axios.put(
        `${updatePaymentMethodUrl}/${data.id}`,
        data
      );
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

// INITIAL STATE
const sessionStorageKey = "payment-methods";
const initialState = {
  AllPaymentMethods: [],
  PaymentData: getStorage(sessionStorageKey) || [],
  loading: false,
  updateLoading: false,
};

const PaymentMethodsSlice = createSlice({
  name: "PaymentMethodsSlice",
  initialState,
  extraReducers: (builder) => {
    builder

      // CRETAE PAYMENT METOD
      .addCase(createPaymentMethodAsync.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(createPaymentMethodAsync.fulfilled, (state, action) => {
        state.updateLoading = false;
      })
      .addCase(createPaymentMethodAsync.rejected, (state, action) => {
        state.updateLoading = false;
      })

      // UPDATE PAYMENT METOD
      .addCase(updatePaymentMethodAsync.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updatePaymentMethodAsync.fulfilled, (state, action) => {
        state.updateLoading = false;
      })
      .addCase(updatePaymentMethodAsync.rejected, (state, action) => {
        state.updateLoading = false;
      })

      // GET ALL PAYMENT METHODS
      .addCase(getAllPaymentMetodsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllPaymentMetodsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.AllPaymentMethods = action.payload;
      })
      .addCase(getAllPaymentMetodsAsync.rejected, (state, action) => {
        state.loading = false;
      })

      // GET ALL PAYMENT METHODS FOR TRANSACTION
      .addCase(getAllPaymentMetodsForTransactionAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        getAllPaymentMetodsForTransactionAsync.fulfilled,
        (state, action) => {
          state.loading = false;
          state.PaymentData = action.payload;
          setStorage(sessionStorageKey,action.payload)
        }
      )
      .addCase(
        getAllPaymentMetodsForTransactionAsync.rejected,
        (state, action) => {
          state.loading = false;
        }
      );
  },
});

export default PaymentMethodsSlice.reducer;
