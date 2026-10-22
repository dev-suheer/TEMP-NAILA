import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const addStone = "/api/process/stone/addStone";
const UpdateStone = "/api/process/stone/updateStone";
const getAllStone = "/api/process/stone/getAllStone";
const getSingleStone = "/api/process/stone/getStoneById";
const generatePdf = "/api/processBillRouter/generateGatePassPdfFunction";
const generateProcessBillURL = "/api/processBillRouter/generateProcessBill";
const deleteStoneURL = "/api/process/stone/deleteStone";
const getStoneDataBypartyNameURL =
  "/api/process/stone/getStoneDataBypartyName";

//CREATE ASYNC THUNK
export const createStone = createAsyncThunk(
  "Stone/create",
  async (formData) => {
    try {
      const response = await axios.post(addStone, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);

    }
  }
);

// lOGIN ASYNC THUNK
export const UpdateStoneAsync = createAsyncThunk(
  "Stone/Update",
  async (formData) => {
    try {
      const response = await axios.post(UpdateStone, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {

      toast.error(error.response.data.error);
    }
  }
);

// VERIFY ASYNC THUNK
export const GetAllStone = createAsyncThunk("Stone/Get", async (data) => {
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
    const response = await axios.post(`${getAllStone}?${query}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);

  }
}
);


export const GetSingleStone = createAsyncThunk("Stone/GetSingle", async (id) => {
  try {
    const response = await axios.post(getSingleStone, id);
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

export const generateStoneGatePssPdfAsync = createAsyncThunk(
  "Stone/DownladPdf",
  async (data) => {
    try {
      const response = await axios.post(
        generatePdf,
        { data, category: "Stone" },
        { responseType: "arraybuffer" }
      );
      downloadPDF(response);
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error downloading PDF");
    }
  }
);

//CREATE BILL FOR STONE
export const generateStoneBillAsync = createAsyncThunk(
  "Stone/generateProcessBil",
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


// DELETE STONE ASYNC THUNK
export const deleteStoneAsync = createAsyncThunk(
  "Stone/deleteStone",
  async (data) => {
    try {
      const response = await axios.post(deleteStoneURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET STONE DATA BY PARTY NAME ASYNC THUNK
export const getStoneDataBypartyNameAsync = createAsyncThunk(
  "Stone/getStoneDataByPartyName",
  async (data) => {
    try {
      const response = await axios.post(getStoneDataBypartyNameURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  }
);




// INITIAL STATE
const initialState = {
  Stone: [],
  SingleStone: {},
  loading: false,
  StonerpdfLoading: false,
  StnoneBillLoading: false,
  previousDataByPartyName: [],
  deleteloadings: false,
};

const StoneSlice = createSlice({
  name: "StoneSlice",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder

       // DATA BY PARTY NAME
       .addCase(getStoneDataBypartyNameAsync.pending, (state) => {
        state.previousDataByPartyName = true;
      })
      .addCase(getStoneDataBypartyNameAsync.fulfilled, (state, action) => {
        state.previousDataByPartyName = action.payload;
      })

      // DELETE STONE
      .addCase(deleteStoneAsync.pending, (state) => {
        state.deleteloadings = true;
      })
      .addCase(deleteStoneAsync.fulfilled, (state) => {
        state.deleteloadings = false;
      })

    // STONE BILL
    .addCase(generateStoneBillAsync.pending, (state) => {
      state.StnoneBillLoading = true;
    })
    .addCase(generateStoneBillAsync.fulfilled, (state) => {
      state.StnoneBillLoading = false;
    })

    //DOWNLOAD PDF
    .addCase(generateStoneGatePssPdfAsync.pending, (state) => {
      state.StonerpdfLoading = true;
    })
    .addCase(generateStoneGatePssPdfAsync.fulfilled, (state) => {
      state.StonerpdfLoading = false;
    })

      
      .addCase(createStone.pending, (state) => {
        state.loading = true;
      })
      .addCase(createStone.fulfilled, (state) => {
        state.loading = false;

      })

      
      .addCase(GetAllStone.pending, (state) => {
        state.loading = true;
      })
      .addCase(GetAllStone.fulfilled, (state, action) => {
        state.loading = false;
        state.Stone = action.payload;
      })

      .addCase(GetSingleStone.pending, (state, action) => {
        state.loading = true;
        state.SingleStone = {};
        state.singleStoneRequestId = action.meta.requestId;
      })
      .addCase(GetSingleStone.fulfilled, (state, action) => {
        if (state.singleStoneRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.SingleStone = action.payload
      })

  },
});

export const { reset } = StoneSlice.actions;

export default StoneSlice.reducer;
