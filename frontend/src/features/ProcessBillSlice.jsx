import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const generateProcessBill = "/api/processBillRouter/generateProcessBill";
const getAllProcessBill = "/api/processBillRouter/getAllProcessBills";
const getProcessBillById = "/api/processBillRouter/getProcessillById";
const getAllPictureAccountsURL = "/api/process/pictures/getAllPictureAccounts";
const getPicruresBillByIdURL = "/api/process/pictures/getPicruresBillById";
const deletePictureOrderByIdURL = "/api/process/pictures/deletePictureOrderById";
const deleteBillAndProcessOrderURL =
  "/api/processBillRouter/deleteBillAndProcessOrder";
const markAsPaidURL = "/api/processBillRouter/markAsPaid";
const applyDiscountOnProcessAccountURL = "/api/processBillRouter/applyDiscountOnProcessAccount";
const applyClaimOnProcessAccountURL = "/api/processBillRouter/claimProcessAccount";
const deleteClaimProcessAccountURL = "/api/processBillRouter/deleteClaimProcessAccount";
const temporaryAcoountUpdateUrl = "/api/processBillRouter/temporaryAcoountUpdate"

// GENERATE PROCESS BILL ASYNC
export const GenerateProcessBillAsync = createAsyncThunk(
  "generate/processBills",
  async (data) => {
    try {
      const response = await axios.post(generateProcessBill, data);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET ALL PROCESS BILL ASYNC
export const GetAllProcessBillAsync = createAsyncThunk(
  "getAll/processBills",
  async (data) => {
    const query = buildQueryParams({
      page: data.page,
      limit: data.limit,
      name: data.name,
      category: data.category,
      status: data.status,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    });
    try {
      const response = await axios.post(
        `${getAllProcessBill}?${query}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

// GET PROCESS BILL BY ID ASYNC
export const GetProcessBillByIdAsync = createAsyncThunk(
  "getById/processBills",
  async (data) => {
    try {
      const response = await axios.post(getProcessBillById, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

// GET PICTURES BILL BY ID ASYNC
export const GetPicturesBillByIdAsync = createAsyncThunk(
  "getById/PicturesBill",
  async (data) => {
    try {
      const response = await axios.post(getPicruresBillByIdURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

// GET ALL PICTURES BILL ASYNC
export const GetAllPictureAccountsAsync = createAsyncThunk(
  "pictures/getAllPictureAccounts",
  async (data) => {
    console.log("pictures being hit");

    const query = buildQueryParams({
      page: data.page,
      limit: data.limit,
      name: data.name,
      status: data.status,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    });
    try {
      const response = await axios.post(
        `${getAllPictureAccountsURL}?${query}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

//Delete Order And BIll
export const deleteProcessBillAndOrderAsync = createAsyncThunk(
  "Process/deleteProcessBill",
  async (data) => {
    try {
      const response = await axios.post(deleteBillAndProcessOrderURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//Delete Order And BIll
export const deletePicturesBillOrderAsync = createAsyncThunk(
  "Process/deletePicturesBill",
  async (data) => {
    try {
      const response = await axios.post(deletePictureOrderByIdURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//MARK AS PAID
export const markAsPaidAsync = createAsyncThunk(
  "Process/markAsPaid",
  async (data) => {
    try {
      const response = await axios.post(markAsPaidURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//Apply Discount
export const applyDiscountAsync = createAsyncThunk(
  "Process/applyDiscount",
  async (data) => {
    try {
      const response = await axios.post(applyDiscountOnProcessAccountURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//Apply Claim On Account
export const applyClaimAccountAsync = createAsyncThunk(
  "Process/applyClaim",
  async (data) => {
    try {
      const response = await axios.post(applyClaimOnProcessAccountURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//Delete Claim On Account
export const deleteClaimAccountAsync = createAsyncThunk(
  "Process/deleteClaim",
  async (data) => {
    try {
      const response = await axios.post(deleteClaimProcessAccountURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

export const temporaryAccountUpdateAsync = createAsyncThunk(
  "ProcessBills/accountUpdate",
  async (data) => {
    try {
      const response = await axios.put(temporaryAcoountUpdateUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);


const initialState = {
  ProcessBills: [],
  ProcessBillsDetails: [],
  loading: false,
  deleteLoadings: false,
  discountLoading:false,
  accountUpdateLoading:false
};

const ProcessBillSlice = createSlice({
  name: "ProcessBillSlice",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      //DELETE PROCESS BILL
      .addCase(deleteProcessBillAndOrderAsync.pending, (state, action) => {
        state.deleteLoadings = true;
      })
      .addCase(deleteProcessBillAndOrderAsync.fulfilled, (state, action) => {
        state.deleteLoadings = false;
      })

       //DELETE PICTURES BILL
       .addCase(deletePicturesBillOrderAsync.pending, (state, action) => {
        state.deleteLoadings = true;
      })
      .addCase(deletePicturesBillOrderAsync.fulfilled, (state, action) => {
        state.deleteLoadings = false;
      })


      //MARK AS PAID ACCOUNT
      .addCase(markAsPaidAsync.pending, (state, action) => {
        state.deleteLoadings = true;
      })
      .addCase(markAsPaidAsync.fulfilled, (state, action) => {
        state.deleteLoadings = false;
      })

      
      //APPLY DISCOUNT ACCOUNT
      .addCase(applyDiscountAsync.pending, (state, action) => {
        state.discountLoading = true;
      })
      .addCase(applyDiscountAsync.fulfilled, (state, action) => {
        state.discountLoading = false;
      })

       //APPLY CLAIM ON ACCOUNT
       .addCase(applyClaimAccountAsync.pending, (state, action) => {
        state.discountLoading = true;
      })
      .addCase(applyClaimAccountAsync.fulfilled, (state, action) => {
        state.discountLoading = false;
      })

      //DELETE CLAIM ON ACCOUNT
      .addCase(deleteClaimAccountAsync.pending, (state) => {
        state.deleteLoadings = true;
      })
      .addCase(deleteClaimAccountAsync.fulfilled, (state) => {
        state.deleteLoadings = false;
      })

      // GENERATE PROCESS BILL
      .addCase(GenerateProcessBillAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GenerateProcessBillAsync.fulfilled, (state, action) => {
        state.loading = false;
      })

      // GET ALL PROCESS BILL
      .addCase(GetAllProcessBillAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetAllProcessBillAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.ProcessBills = action.payload;
      })

      // GET ALL PICTURES BILL
      .addCase(GetAllPictureAccountsAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetAllPictureAccountsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.ProcessBills = action.payload;
      })

      // GET PROCESS BILL BY ID
      .addCase(GetProcessBillByIdAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetProcessBillByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.ProcessBillsDetails = action.payload;
      })

      // GET PICTURES BILL BY ID
      .addCase(GetPicturesBillByIdAsync.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetPicturesBillByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.ProcessBillsDetails = action.payload;
      })

      //APPLY DISCOUNT ACCOUNT
      .addCase(temporaryAccountUpdateAsync.pending, (state) => {
        state.accountUpdateLoading = true;
      })
      .addCase(temporaryAccountUpdateAsync.fulfilled, (state) => {
        state.accountUpdateLoading = false;
      })
      .addCase(temporaryAccountUpdateAsync.rejected, (state) => {
        state.accountUpdateLoading = false;
      });

  },
});

export default ProcessBillSlice.reducer;
