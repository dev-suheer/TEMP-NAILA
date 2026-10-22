import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const getBuyerForBranch = "/api/buyers/getBuyersForBranch";
const searchBuyersForBillUrl = "/api/buyers/searchBuyersForBill";
const getBuyerById = "/api/buyers/getBuyerById";
const markAsPaidForBuyersUrl = "/api/buyers/markAsPaidForBuyers";
const applyDiscountOnBuyersAccountUrl = "/api/buyers/applyDiscountOnBuyersAccount";
const getBuyerBillHistoryForBranchUrl =
  "/api/buyers/getBuyerBillHistoryForBranch";
const getBuyerBillDetailsUrl = "/api/buyers/getBuyerBillDetails";
const getReturnableBillsForBuyerUrl = "/api/buyers/getReturnableBillsForBuyer";
const addBuyerCheckUrl = "/api/buyers/checks/addBuyerCheck";
const updateBuyerCheckWithNewUrl = "/api/buyers/checks/updateBuyerCheckWithNew";
const markCheckAsPaidUrl = "/api/buyers/checks/markCheckAsPaid";
const getAllChecksForPartyUrl = "/api/buyers/checks/getAllChecksForParty";
const deleteCheckUrl = "/api/buyers/checks/deleteCheck";
const getSuitsStockToGenerateBillUrl =
  "/api/branches/getSuitsStockToGenerateBill";
  const deleteBuyerBillUrl = "/api/buyers/deleteBuyerBill";


// GET BUYER FOR BRANCH THUNK
export const getBuyerForBranchAsync = createAsyncThunk(
  "buyers/get",
  async (data) => {
    const query = buildQueryParams({
      page: data.page,
      limit: data.limit,
      name: data.name,
      status: data.status,
      branchId: data.branchId,
    });
    try {
      const response = await axios.post(
        `${getBuyerForBranch}?${query}`,
        { id: data.id }
      );
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const searchBuyersForBillAsync = createAsyncThunk(
  "buyers/searchForBill",
  async (name, { signal, rejectWithValue }) => {
    const query = buildQueryParams({ name });

    try {
      const response = await axios.get(`${searchBuyersForBillUrl}?${query}`, {
        signal,
      });
      return response.data;
    } catch (error) {
      if (signal.aborted || axios.isCancel(error)) throw error;
      const message = error.response?.error;
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

// GET BUYER BY ID THUNK
export const getBuyerByIdAsync = createAsyncThunk(
  "buyers/getById",
  async (id) => {
    try {
      const response = await axios.post(getBuyerById, id);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET BUYER BILLS FOR BRANCH THUNK
export const getBuyerBillsHistoryForBranchAsync = createAsyncThunk(
  "buyers/BuyerBillsHistory",
  async (data) => {
    const query = buildQueryParams({
      name: data.name,
      buyerId: data.buyerId,
      id: data.id,
      page: data.page,
      limit: data.limit,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      city: data.city,
    });
    try {
      const response = await axios.post(
        `${getBuyerBillHistoryForBranchUrl}?${query}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
);

export const getBuyerBillDetailsAsync = createAsyncThunk(
  "buyers/getBuyerBillDetails",
  async (data) => {
    try {
      const response = await axios.post(getBuyerBillDetailsUrl, data);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }
);

//GET BUYER BILLS THAT STILL HAVE SUITS TO RETURN
export const getReturnableBillsForBuyerAsync = createAsyncThunk(
  "buyers/getReturnableBillsForBuyer",
  async (data) => {
    try {
      const response = await axios.post(getReturnableBillsForBuyerUrl, data);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }
);

//MARK AS PAID BUYER ACCOUNT
export const markAsPaidAsync = createAsyncThunk(
  "Buyers/markAsPaid",
  async (data) => {
    try {
      const response = await axios.post(markAsPaidForBuyersUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//APPLY DISCOUNT ON BUYER ACCOUNT
export const applyBuyerDiscountAsync = createAsyncThunk(
  "Buyers/applyDiscount",
  async (data) => {
    try {
      const response = await axios.post(applyDiscountOnBuyersAccountUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data);
    }
  }
);

//ADD CHECK
export const addCheckAsync = createAsyncThunk(
  "Buyers/addCheck",
  async (data) => {
    try {
      const response = await axios.post(addBuyerCheckUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//UPDATECHECK WITH NEW CHECK
export const updateBuyerCheckWithNewAsync = createAsyncThunk(
  "Buyers/updateCheck",
  async (data) => {
    try {
      const response = await axios.post(updateBuyerCheckWithNewUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//MARK AS PAID CHECK
export const markAsPaidCheckAsync = createAsyncThunk(
  "Buyers/markAsPaidCheck",
  async (data) => {
    try {
      const response = await axios.post(markCheckAsPaidUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//GET ALL CHECKS DATA FOR PARTY
export const getAllChecksForPartyAsync = createAsyncThunk(
  "Buyers/getAllChecksForParty",
  async (data) => {
    try {
      const response = await axios.post(getAllChecksForPartyUrl, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data);
    }
  }
);

//GET ALL CHECKS DATA FOR PARTY
export const deleteCheckAsync = createAsyncThunk(
  "Buyers/deleteCheckForParty",
  async (data) => {
    try {
      const response = await axios.post(deleteCheckUrl, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data);
    }
  }
);


//GET ALL STOCK TO GENERATE BILL
export const getSuitsStockToGenerateBillAsync = createAsyncThunk(
  "BuyerBills/getASuitsStocToGenerateBill",
  async () => {
    try {
      const response = await axios.post(getSuitsStockToGenerateBillUrl);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data);
    }
  }
);

//DELETE BUYER BILL
export const deleteBuyerBillAsync = createAsyncThunk(
  "BuyerBills/deleteBuyerBill",
  async (id) => {
    try {
      const response = await axios.post(`${deleteBuyerBillUrl}/${id}`);
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
  Buyers: [],
  BuyerById: [],
  loading: false,
  BuyerBillHistory: [],
  BuyerBillDetails: null,
  buyerBillDetailsLoading: false,
  ReturnableBills: [],
  returnableBillsLoading: false,
  billHistoryLoading: true,
  markAsPaidLoading: false,
  discountLoading: false,
  checkLoading: false,
  getBuyersChecksLoading: false,
  BuyersChecks: [],
  CheckNotifications: [],
  returnBillLoading: false,
  getReturnBillLoading: false,
  StockToGenerateBill: [],
  stockLoading:false,
  deleteBillLoading: false,
  buyerBillSearchResults: [],
  buyerBillSearchLoading: false,
  buyerBillSearchRequestId: null,
};

const BuyerSlice = createSlice({
  name: "BuyerSlice",
  initialState,
  reducers: {
    clearBuyerSearchResults: (state) => {
      state.buyerBillSearchResults = [];
      state.buyerBillSearchLoading = false;
      state.buyerBillSearchRequestId = null;
    },
  },
  extraReducers: (builder) => {
    builder

      //GET ALL STOCK TO GENERATE BILL
      .addCase(getSuitsStockToGenerateBillAsync.pending, (state, action) => {
        state.stockLoading = true
      })
      .addCase(getSuitsStockToGenerateBillAsync.fulfilled, (state, action) => {
         state.stockLoading = false
        state.StockToGenerateBill = action.payload;
      })
      .addCase(getSuitsStockToGenerateBillAsync.rejected, (state, action) => {
        state.stockLoading = false
        state.StockToGenerateBill = [];
      })

      //ADD CHECK
      .addCase(addCheckAsync.pending, (state, action) => {
        state.checkLoading = true;
      })
      .addCase(addCheckAsync.fulfilled, (state, action) => {
        state.checkLoading = false;
      })

      //UPDATECHECK WITH NEW CHECK
      .addCase(updateBuyerCheckWithNewAsync.pending, (state, action) => {
        state.checkLoading = true;
      })
      .addCase(updateBuyerCheckWithNewAsync.fulfilled, (state, action) => {
        state.checkLoading = false;
      })

      //MARK AS PAID CHECK
      .addCase(markAsPaidCheckAsync.pending, (state, action) => {
        state.checkLoading = true;
      })
      .addCase(markAsPaidCheckAsync.fulfilled, (state, action) => {
        state.checkLoading = false;
      })

      //GET ALL CHECKS DATA FOR PARTY
      .addCase(getAllChecksForPartyAsync.pending, (state, action) => {
        state.getBuyersChecksLoading = true;
      })
      .addCase(getAllChecksForPartyAsync.fulfilled, (state, action) => {
        state.getBuyersChecksLoading = false;
        state.BuyersChecks = action.payload;
      })
      .addCase(getAllChecksForPartyAsync.rejected, (state, action) => {
        state.getBuyersChecksLoading = false;
        state.BuyersChecks = [];
      })

      //DELETE CHECK
      .addCase(deleteCheckAsync.pending, (state, action) => {
        state.checkLoading = true;
      })
      .addCase(deleteCheckAsync.fulfilled, (state, action) => {
        state.checkLoading = false;
      })

      //MARK AS PAID ACCOUNT
      .addCase(markAsPaidAsync.pending, (state, action) => {
        state.markAsPaidLoading = true;
      })
      .addCase(markAsPaidAsync.fulfilled, (state, action) => {
        state.markAsPaidLoading = false;
      })
      .addCase(markAsPaidAsync.rejected, (state) => {
        state.markAsPaidLoading = false;
      })

      //APPLY DISCOUNT
      .addCase(applyBuyerDiscountAsync.pending, (state) => {
        state.discountLoading = true;
      })
      .addCase(applyBuyerDiscountAsync.fulfilled, (state) => {
        state.discountLoading = false;
      })
      .addCase(applyBuyerDiscountAsync.rejected, (state) => {
        state.discountLoading = false;
      })

      // GET BUYER FOR BRANCH
      .addCase(getBuyerForBranchAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBuyerForBranchAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.Buyers = action.payload;
      })

      // SEARCH BUYERS FOR BILL
      .addCase(searchBuyersForBillAsync.pending, (state, action) => {
        state.buyerBillSearchLoading = true;
        state.buyerBillSearchRequestId = action.meta.requestId;
      })
      .addCase(searchBuyersForBillAsync.fulfilled, (state, action) => {
        if (state.buyerBillSearchRequestId !== action.meta.requestId) return;

        state.buyerBillSearchLoading = false;
        state.buyerBillSearchResults = action.payload?.buyers || [];
        state.buyerBillSearchRequestId = null;
      })
      .addCase(searchBuyersForBillAsync.rejected, (state, action) => {
        if (state.buyerBillSearchRequestId !== action.meta.requestId) return;

        state.buyerBillSearchLoading = false;
        state.buyerBillSearchResults = [];
        state.buyerBillSearchRequestId = null;
      })

      // GET BUYER FOR BRANCH
      .addCase(getBuyerByIdAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBuyerByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.BuyerById = action.payload;
      })

      // GET BILL HISTORY LOADING
      .addCase(getBuyerBillsHistoryForBranchAsync.pending, (state) => {
        state.billHistoryLoading = true;
      })
      .addCase(
        getBuyerBillsHistoryForBranchAsync.fulfilled,
        (state, action) => {
          state.billHistoryLoading = false;
          state.BuyerBillHistory = action.payload;
        }
      )

      // GET BUYER BILL DETAILS
      .addCase(getBuyerBillDetailsAsync.pending, (state) => {
        state.buyerBillDetailsLoading = true;
        state.BuyerBillDetails = null;
      })
      .addCase(getBuyerBillDetailsAsync.fulfilled, (state, action) => {
        state.buyerBillDetailsLoading = false;
        state.BuyerBillDetails = action.payload;
      })
      .addCase(getBuyerBillDetailsAsync.rejected, (state) => {
        state.buyerBillDetailsLoading = false;
      })

      // GET RETURNABLE BILLS FOR BUYER
      .addCase(getReturnableBillsForBuyerAsync.pending, (state) => {
        state.returnableBillsLoading = true;
        state.ReturnableBills = [];
      })
      .addCase(getReturnableBillsForBuyerAsync.fulfilled, (state, action) => {
        state.returnableBillsLoading = false;
        state.ReturnableBills = action.payload;
      })
      .addCase(getReturnableBillsForBuyerAsync.rejected, (state) => {
        state.returnableBillsLoading = false;
      })

      //DELETE BUYER BILL
      .addCase(deleteBuyerBillAsync.pending, (state) => {
        state.deleteBillLoading = true;
      })
      .addCase(deleteBuyerBillAsync.fulfilled, (state) => {
        state.deleteBillLoading = false;
      })
       .addCase(deleteBuyerBillAsync.rejected, (state) => {
        state.deleteBillLoading = false;
      })
  },
});

export const { clearBuyerSearchResults } = BuyerSlice.actions;

export default BuyerSlice.reducer;
