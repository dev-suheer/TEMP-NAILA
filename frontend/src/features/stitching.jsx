import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const addStitching = "/api/process/Stitching/addStitching";
const UpdateStitching = "/api/process/Stitching/updateStitching";
const getAllStitching = "/api/process/Stitching/getAllStitching";
const getSingleStitching = "/api/process/Stitching/getStitchingById";
const getStitchingByEmbroideryId =
  "/api/process/stitching/getStitchingByEmbroideryId";
const generatePdf = "/api/processBillRouter/generateGatePassPdfFunction";
const generateProcessBillURL = "/api/processBillRouter/generateProcessBill";
const deleteStitchingURL = "/api/process/Stitching/deleteStitching";
const addInStockFromPackagingURL =
  "/api/process/Stitching/addInStockFromPackaging";
const getStitchingDataBypartyNameURL =
  "/api/process/Stitching/getStitchingDataBypartyName";

//CREATE ASYNC THUNK
export const createStitching = createAsyncThunk(
  "Stitching/create",
  async (formData) => {
    try {
      const response = await axios.post(addStitching, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// lOGIN ASYNC THUNK
export const UpdateStitchingAsync = createAsyncThunk(
  "Stitching/Update",
  async (formData) => {
    try {
      const response = await axios.post(UpdateStitching, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// VERIFY ASYNC THUNK
export const GetAllStitching = createAsyncThunk(
  "Stitching/Get",
  async (data) => {
    const filters = data?.filters ?? {};
         const query = buildQueryParams({
           Manual_No: filters.Manual_No,
           design_no: filters.Design_No,
           partyName: filters.partyName,
           project_status: filters.project_status,
           page: data.page,
           limit: data.limit,
         });
    try {
      const response = await axios.post(
        `${getAllStitching}?${query}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const GetSingleStitching = createAsyncThunk(
  "Stitching/GetSingle",
  async (id) => {
    try {
      const response = await axios.post(getSingleStitching, id);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const getStitchingByEmbroidery = createAsyncThunk(
  "getStitchingByEmbroidery/getStitchingByEmbroideryGetSingle",
  async (id) => {
    try {
      const response = await axios.post(getStitchingByEmbroideryId, id);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

// DOWNLOAD GATEPASS PDF file
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
    console.error("Invalid response format");
  }
};

export const generateStitchingGatePssPdfAsync = createAsyncThunk(
  "Stitching/DownladPdf",
  async (data) => {
    try {
      const response = await axios.post(
        generatePdf,
        { data, category: "Stitching" },
        { responseType: "arraybuffer" }
      );
      downloadPDF(response);
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error downloading PDF");
    }
  }
);

//CREATE BILL FOR STITCHING
export const generateStitchingBillAsync = createAsyncThunk(
  "Stitching/generateProcessBil",
  async (formData) => {
    try {
      const response = await axios.post(generateProcessBillURL, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// DELETE Stitching ASYNC THUNK
export const deleteStitchingAsync = createAsyncThunk(
  "Stitching/deleteStitching",
  async (data) => {
    try {
      const response = await axios.post(deleteStitchingURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET Stitching DATA BY PARTY NAME ASYNC THUNK
export const getStitchingDataBypartyNameAsync = createAsyncThunk(
  "Stitching/getStitchingDataByPartyName",
  async (data) => {
    try {
      const response = await axios.post(getStitchingDataBypartyNameURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
);

// ADD IN STOCK
export const addInStockFromPackagingAsync = createAsyncThunk(
  "Stitching/addInStockFromPackaging",
  async (formData) => {
    try {
      const response = await axios.post(addInStockFromPackagingURL, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// INITIAL STATE
const initialState = {
  Stitching: [],
  SingleStitching: {},
  stitchingEmbroidery: {},
  loading: false,
  updateStitchingLoading: false,
  StitchingpdfLoading: false,
  StitchingBillLoading: false,
  previousDataByPartyName: [],
  deleteloadings: false,
  addInStockLoading: false,
};

const StitchingSlice = createSlice({
  name: "StitchingSlice",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder

      // DATA BY PARTY NAME
      .addCase(getStitchingDataBypartyNameAsync.pending, (state, action) => {
        state.previousDataByPartyName = true;
      })
      .addCase(getStitchingDataBypartyNameAsync.fulfilled, (state, action) => {
        state.previousDataByPartyName = action.payload;
      })

      // ADD IN STOCK FROM STITCHING
      .addCase(addInStockFromPackagingAsync.pending, (state, action) => {
        state.addInStockLoading = true;
      })
      .addCase(addInStockFromPackagingAsync.fulfilled, (state, action) => {
        state.addInStockLoading = false;
      })

      // DELETE STITCHING
      .addCase(deleteStitchingAsync.pending, (state, action) => {
        state.deleteloadings = true;
      })
      .addCase(deleteStitchingAsync.fulfilled, (state, action) => {
        state.deleteloadings = false;
      })

      .addCase(generateStitchingBillAsync.pending, (state, action) => {
        state.StitchingBillLoading = true;
      })
      .addCase(generateStitchingBillAsync.fulfilled, (state, action) => {
        state.StitchingBillLoading = false;
      })

      .addCase(generateStitchingGatePssPdfAsync.pending, (state) => {
        state.StitchingpdfLoading = true;
      })
      .addCase(generateStitchingGatePssPdfAsync.fulfilled, (state, action) => {
        state.StitchingpdfLoading = false;
      })

      .addCase(createStitching.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(createStitching.fulfilled, (state, action) => {
        state.loading = false;
      })

      .addCase(GetAllStitching.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetAllStitching.fulfilled, (state, action) => {
        state.loading = false;
        state.Stitching = action.payload;
      })

      .addCase(UpdateStitchingAsync.pending, (state, action) => {
        state.updateStitchingLoading = true;
      })
      .addCase(UpdateStitchingAsync.fulfilled, (state, action) => {
        state.updateStitchingLoading = false;
      })

      .addCase(GetSingleStitching.pending, (state, action) => {
        state.loading = true;
        state.SingleStitching = {};
        state.singleStitchingRequestId = action.meta.requestId;
      })
      .addCase(GetSingleStitching.fulfilled, (state, action) => {
        if (state.singleStitchingRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.SingleStitching = action.payload;
      })

      .addCase(getStitchingByEmbroidery.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(getStitchingByEmbroidery.fulfilled, (state, action) => {
        state.loading = false;
        state.stitchingEmbroidery = action.payload;
      });
  },
});

export const { reset } = StitchingSlice.actions;

export default StitchingSlice.reducer;
