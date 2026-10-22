import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const addCalender = "/api/process/calender/addCalender";
const UpdateCalender = "/api/process/calender/updateCalender";
const deleteCalenderURL = "/api/process/calender/deleteCalender";
const getAllCalender = "/api/process/calender/getAllCalender";
const getSingleCalender = "/api/process/calender/getCalenderById";
const generatePdf = "/api/processBillRouter/generateGatePassPdfFunction";
const generateProcessBillURL = "/api/processBillRouter/generateProcessBill";
const calenderDataBypartyNameURL =
  "/api/process/calender/getCalenderDataBypartyName";

// CREATE CALENDER THUNK
export const createCalender = createAsyncThunk(
  "Shop/create",
  async (formData) => {
    try {
      const response = await axios.post(addCalender, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// UPDATE CALENDER THUNK
export const UpdateCalenderAsync = createAsyncThunk(
  "Calender/Update",
  async (formData) => {
    try {
      const response = await axios.post(UpdateCalender, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET ALL CALENDER THUNK
export const GetAllCalender = createAsyncThunk("Calender/Get", async (data) => {
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
      `${getAllCalender}?${query}`
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
});

// GET SINGLE CALENDER THUNK
export const GetSingleCalender = createAsyncThunk(
  "Calender/GetSingle",
  async (id) => {
    try {
      const response = await axios.post(getSingleCalender, id);

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

export const generateCalenderGatePssPdfAsync = createAsyncThunk(
  "Calender/DownladPdf",
  async (data) => {
    try {
      const response = await axios.post(
        generatePdf,
        { data, category: "Calender" },
        { responseType: "arraybuffer" }
      );
      downloadPDF(response);
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error downloading PDF");
    }
  }
);

//CREATE BILL FOR CALENDER
export const generateCalenderBillAsync = createAsyncThunk(
  "Embroidery/generateProcessBil",
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

// CREATE CALENDER THUNK
export const deleteCalenderAsync = createAsyncThunk(
  "Calender/DeleteCalender",
  async (data) => {
    try {
      const response = await axios.post(deleteCalenderURL, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

// GET SINGLE CALENDER THUNK
export const calenderDataBypartyNameAsync = createAsyncThunk(
  "Calender/GetCalenderDataByPartyName",
  async (data) => {
    try {
      const response = await axios.post(calenderDataBypartyNameURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

// INITIAL STATE
const initialState = {
  Calender: [],
  SingleCalender: {},
  loading: false,
  deleteLoading: false,
  CalenderpdfLoading: false,
  generateCAlenderBillLoading: false,
  previousDataByPartyName: [],
  previousDataLoading: false,
};

const CalenderSlice = createSlice({
  name: "CalenderSlice",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder

      // CALENDER BILL
      .addCase(generateCalenderBillAsync.pending, (state, action) => {
        state.generateCAlenderBillLoading = true;
      })
      .addCase(generateCalenderBillAsync.fulfilled, (state, action) => {
        state.generateCAlenderBillLoading = false;
      })

      // CALENDER DATA BY PARTY NAME
      .addCase(calenderDataBypartyNameAsync.pending, (state, action) => {
        state.previousDataLoading = false;
      })
      .addCase(calenderDataBypartyNameAsync.fulfilled, (state, action) => {
        state.previousDataByPartyName = action.payload;
        state.previousDataLoading = true;
      })

      //DELETE CALENDER BILL
      .addCase(deleteCalenderAsync.pending, (state, action) => {
        state.deleteLoading = true;
      })
      .addCase(deleteCalenderAsync.fulfilled, (state, action) => {
        state.deleteLoading = false;
      })

      //DOWNLOAD PDF
      .addCase(generateCalenderGatePssPdfAsync.pending, (state) => {
        state.CalenderpdfLoading = true;
      })
      .addCase(generateCalenderGatePssPdfAsync.fulfilled, (state, action) => {
        state.CalenderpdfLoading = false;
      })

     
      .addCase(createCalender.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(createCalender.fulfilled, (state, action) => {
        state.loading = false;
      })

    
      .addCase(GetAllCalender.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GetAllCalender.fulfilled, (state, action) => {
        state.loading = false;
        state.Calender = action.payload;
      })



      .addCase(GetSingleCalender.pending, (state, action) => {
        state.loading = true;
        state.SingleCalender = {};
        state.singleCalenderRequestId = action.meta.requestId;
      })
      .addCase(GetSingleCalender.fulfilled, (state, action) => {
        if (state.singleCalenderRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.SingleCalender = action.payload;
      });
  },
});

export const { reset } = CalenderSlice.actions;

export default CalenderSlice.reducer;
