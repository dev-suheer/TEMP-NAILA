import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

//API URL
const generateBuyerBillUrl = "/api/buyers/generateBuyersBillandAddBuyer";
const generateOldBuyerBillUrl = "/api/buyers/generateBillForOldbuyer";
const getSuitFromDesignUrl = "/api/buyers/validateD_NoAndGetSuitData";
const validateOldBuyerUrl = "/api/buyers/validateAndGetOldBuyerData";
const generatePdf = "/api/buyers/generatePdfFunction";

// GENERATE BUYER BILL THUNK
export const generateBuyerBillAsync = createAsyncThunk(
  "buyerBill/generate",
  async (billData) => {
    try {
      const response = await axios.post(generateBuyerBillUrl, billData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GENERATE BILL FOR OLDER BUYER THUNK
export const generateBillForOlderBuyerAsync = createAsyncThunk(
  "OldbuyerBill/generate",
  async (billData) => {
    try {
      const response = await axios.post(generateOldBuyerBillUrl, billData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET SUIT FROM DESIGN NO THUNK
export const getSuitFromDesignAsync = createAsyncThunk(
  "buyerBill/getSuit",
  async (data) => {
    try {
      if (data.branchId) {
        const response = await axios.post(getSuitFromDesignUrl, data);
        return response.data;
      } else {
        toast.error("Please Select Branch First");
      }
    } catch (error) {
      throw new Error(error)
    }
  }
);

// GET OLD BUYER DATA THUNK
export const validateOldBuyerAsync = createAsyncThunk(
  "buyer/validate",
  async (name) => {
    try {
      const response = await axios.post(validateOldBuyerUrl, name);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// DOWNLOAD PDF file
const downloadPDF = (response) => {
  if (response.headers && response.data) {
    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const contentDisposition = response.headers["content-disposition"];
    const filenameMatch =
      contentDisposition && contentDisposition.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : "invoice.pdf";

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    throw new Errorr("Invalid response format");
  }
};

export const generatePdfAsync = createAsyncThunk(
  "buyers/pdf",
  async (modifiedBillData) => {
    try {
      const response = await axios.post(
        generatePdf,
        { modifiedBillData },
        { responseType: "arraybuffer" }
      );
      downloadPDF(response);
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error downloading PDF");
    }
  }
);

// INITIAL STATE
const initialState = {
  BuyerBill: [],
  OldBuyerBilData: [],
  SuitFromDesign: [],
  OldBuyerData: [],
  getBuyerLoading: false,
  loading: false,
  pdfLoading: false,
  generateBillloading: false,
};

const GenerateBillSlice = createSlice({
  name: "GenerateBillSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // GENERATE BUYER BILL
      .addCase(generateBuyerBillAsync.pending, (state) => {
        state.generateBillloading = true;
      })
      .addCase(generateBuyerBillAsync.fulfilled, (state, action) => {
        state.generateBillloading = false;
        state.BuyerBill = action.payload;
      })

      // GENERATE BILL FOR OLDER BUYER
      .addCase(generateBillForOlderBuyerAsync.pending, (state) => {
        state.generateBillloading = true;
      })
      .addCase(generateBillForOlderBuyerAsync.fulfilled, (state, action) => {
        state.generateBillloading = false;
        state.OldBuyerBilData = action.payload;
      })

      // GET SUIT FROM DESIGN NO
      .addCase(getSuitFromDesignAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSuitFromDesignAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.SuitFromDesign = action.payload;
      })

      // GET OLD BUYER DATA
      .addCase(validateOldBuyerAsync.pending, (state) => {
        state.getBuyerLoading = true;
      })
      .addCase(validateOldBuyerAsync.fulfilled, (state, action) => {
        state.getBuyerLoading = false;
        state.OldBuyerData = action.payload;
      })

      //DOWNLOAD PDF
      .addCase(generatePdfAsync.pending, (state) => {
        state.pdfLoading = true;
      })
      .addCase(generatePdfAsync.fulfilled, (state, action) => {
        state.pdfLoading = false;
      });
  },
});

export default GenerateBillSlice.reducer;
