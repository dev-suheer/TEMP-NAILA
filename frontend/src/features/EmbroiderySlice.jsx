import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from '../Utils/Common';

//API URL
const AddEmbroidery = "/api/process/embriodery/addEmbriodery";
const getEmbroidery = "/api/process/embriodery/getAllEmbroidery";
const getEmbroiderydetails = "/api/process/embriodery/getEmbroideryById";
const editEmbroidery = "/api/process/embriodery/updateEmbroidery";
const deleteEmbroideryUrl = "/api/process/embriodery/deleteEmbroiderybyId";
const replaceEmbroideryDataUrl = "/api/process/embriodery/replaceEmroideryData";
const generatePdf = "/api/processBillRouter/generateGatePassPdfFunction";
const generateProcessBillURL = "/api/processBillRouter/generateProcessBill";
const getAllDesignNumbersURL = "/api/process/embriodery/getAllDesignNumbers";
const getHeadDataByDesignNoURL =
  "/api/process/embriodery/getHeadDataByDesignNo";
const getPreviousDataBypartyNameURL =
  "/api/process/embriodery/getPreviousDataBypartyName";
const getProcessFiltersDataURL =
  "/api/process/embriodery/getProcessFiltersData";
const searchAccountByPartyNameURL =
  "/api/process/pictures/searchAccountByPartyName";
const createPictureOrderURL = "/api/process/pictures/createPictureOrder";
const getPicturesOrderByIdURL = "/api/process/pictures/getPictureOrderById";
const updatePictureOrderByIdURL = "/api/process/pictures/updatePictureOrderById";
const markEmbroideryAsVerifiedUrl = "/api/process/embriodery/updateVerificationStatus";


//GET SINGLE PICTURE BU ID
export const getPictureOrderByIdAsync = createAsyncThunk(
  "Pictures/getPicturesbyId",
  async (data) => {
    try {
      const response = await axios.post(getPicturesOrderByIdURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

//UPDATE PICTURE BU ID
export const updatePictureOrderByIdIdAsync = createAsyncThunk(
  "Pictures/updatePictureOrderById",
  async (data) => {
    try {
      const response = await axios.post(updatePictureOrderByIdURL, data);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);


//CREATE ASYNC THUNK
export const CreateEmbroidery = createAsyncThunk(
  "Embroidery/create",
  async (formData) => {
    try {
      const response = await axios.post(AddEmbroidery, formData);
      toast.success(response.data.message);

      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const GETEmbroidery = createAsyncThunk(
  "Embroidery/GET",
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
        `${getEmbroidery}?${query}`
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const GETEmbroiderySIngle = createAsyncThunk(
  "EmbroideryDetails/GET",
  async (id) => {
    try {
      const response = await axios.post(getEmbroiderydetails, id);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const UpdateEmbroidery = createAsyncThunk(
  "Embroidery/Update",
  async (formData) => {
    try {
      const response = await axios.post(editEmbroidery, formData);
      toast.success(response.data.message);

      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
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

export const generateEmbroideryGatePssPdfAsync = createAsyncThunk(
  "Embroidery/DownladPdf",
  async (data) => {
    try {
      const response = await axios.post(
        generatePdf,
        { data, category: "Embroidery" },
        { responseType: "arraybuffer" }
      );
      downloadPDF(response);
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error downloading PDF");
    }
  }
);

//CREATE BILL FOR EMBROIDERY
export const generateEmbroideryBillAsync = createAsyncThunk(
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

//GET ALL DESIGN NUMBERS
export const getAllDesignNumbersAsync = createAsyncThunk(
  "Embroider/getDesignNumbers",
  async () => {
    try {
      const response = await axios.post(getAllDesignNumbersURL);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
);

//GET HEAD AND STITCH DATA
export const getHeadDataByDesignNoAsync = createAsyncThunk(
  "Embroider/getHeadData",
  async (data) => {
    try {
      const response = await axios.post(getHeadDataByDesignNoURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
);

//GET DATA FOR Old PARTY BY NAME
export const getPreviousDataBypartyNameAsync = createAsyncThunk(
  "Embroider/getPreviousData",
  async (data) => {
    try {
      const response = await axios.post(getPreviousDataBypartyNameURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
);

//GET PROCESS FILTER OPTIONS
export const getProcessFiltersDataAsync = createAsyncThunk(
  "Embroider/getProcessFiltersData",
  async (category) => {
    try {
      const response = await axios.get(`${getProcessFiltersDataURL}/${category}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }
);

//GET ACCOUNT DATA FOR PICTURES ORDER
export const getaccountDataForPicturesAsync = createAsyncThunk(
  "Pictures/getAccountsData",
  async (data) => {
    try {
      const response = await axios.post(searchAccountByPartyNameURL, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
);

//GET ACCOUNT DATA FOR PICTURES ORDER
export const createPictureOrderAsync = createAsyncThunk(
  "Pictures/createPictureOrder",
  async (data) => {
    try {
      const response = await axios.post(createPictureOrderURL, data);
      toast.success(response.data.message);

      return response.data;
    } catch (error) {
      console.log("error", error);
      toast.error(error.response.data);
    }
  }
);

//Delete Embroidery
export const deleteEmbroideryAsync = createAsyncThunk(
  "Embroidery/deleteEmbroidery",
  async (data) => {
    try {
      const response = await axios.post(deleteEmbroideryUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);

//Replace Embroidery Data
export const replaceEmbroideryDataAsync = createAsyncThunk(
  "Embroidery/replaceEmbroideryData",
  async (data) => {
    try {
      const response = await axios.post(replaceEmbroideryDataUrl, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

//Mark Embroidery as verified
export const markEmbroideryAsVerifiedAsync = createAsyncThunk(
  "Embroidery/markEmbroideryAsVerified",
  async (id) => {
    try {
      const response = await axios.put(`${markEmbroideryAsVerifiedUrl}/${id}`);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data);
    }
  }
);


// INITIAL STATE
const initialState = {
  embroidery: [],
  SingleEmbroidery: null,
  loading: false,
  oldDataLoading: false,
  UpdatEmbroideryloading: false,
  markVerifiedLoading: false,
  EmroiderypdfLoading: false,
  createEmbroideryLoading: false,
  generateBillLoading: false,
  designNumbers: [],
  headStitchData: [],
  previousDataByPartyName: [],
  processFiltersData: {
    partyNames: [],
    designNumbers: [],
  },
  processFiltersLoading: false,
  picturesLoading: false,
  createPictureOrderLoading: false,
  accountDataForPictures: [],
  deleteLoadings: false,
  designNumberLoading:false,
  singlePictureOrder: [],
};

const EmbroiderySlice = createSlice({
  name: "EmbroiderySlice",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder

      // Embroidery Add ADD CASE
      .addCase(CreateEmbroidery.pending, (state, action) => {
        state.createEmbroideryLoading = true;
      })
      .addCase(CreateEmbroidery.fulfilled, (state, action) => {
        state.createEmbroideryLoading = false;
      })

      // PICTURES ORDER Add ADD CASE
      .addCase(createPictureOrderAsync.pending, (state, action) => {
        state.createPictureOrderLoading = true;
      })
      .addCase(createPictureOrderAsync.fulfilled, (state, action) => {
        state.createPictureOrderLoading = false;
      })
      .addCase(createPictureOrderAsync.rejected, (state, action) => {
        state.createPictureOrderLoading = false;
      })

      // PICTURES ORDER BY ID ADD CASE
      .addCase(getPictureOrderByIdAsync.pending, (state, action) => {
        state.createPictureOrderLoading = true;
      })
      .addCase(getPictureOrderByIdAsync.fulfilled, (state, action) => {
        state.singlePictureOrder = action.payload;
        state.createPictureOrderLoading = false;
      })

      // GET DESIGN NUMBERS CASES
      .addCase(getAllDesignNumbersAsync.pending, (state, action) => {
        state.designNumberLoading = true
      })
      .addCase(getAllDesignNumbersAsync.fulfilled, (state, action) => {
        state.designNumberLoading = false
        state.designNumbers = action.payload;
      })
      .addCase(getAllDesignNumbersAsync.rejected, (state, action) => {
          state.designNumberLoading = false
      })

      // GET PREVIOUS DATA BY PARTY NAME
      .addCase(getPreviousDataBypartyNameAsync.pending, (state, action) => {
        state.oldDataLoading = true;
      })
      .addCase(getPreviousDataBypartyNameAsync.fulfilled, (state, action) => {
        state.oldDataLoading = false;
        state.previousDataByPartyName = action.payload;
      })
      .addCase(getPreviousDataBypartyNameAsync.rejected, (state, action) => {
        state.oldDataLoading = false;
      })

      // GET PROCESS FILTER OPTIONS
      .addCase(getProcessFiltersDataAsync.pending, (state) => {
        state.processFiltersLoading = true;
      })
      .addCase(getProcessFiltersDataAsync.fulfilled, (state, action) => {
        state.processFiltersLoading = false;
        state.processFiltersData = action.payload || {
          partyNames: [],
          designNumbers: [],
        };
      })
      .addCase(getProcessFiltersDataAsync.rejected, (state) => {
        state.processFiltersLoading = false;
        state.processFiltersData = {
          partyNames: [],
          designNumbers: [],
        };
      })

      // GET ACCOUNTS DATA BY PARTY NAME
      .addCase(getaccountDataForPicturesAsync.pending, (state, action) => {
        state.picturesLoading = true;
      })
      .addCase(getaccountDataForPicturesAsync.fulfilled, (state, action) => {
        state.picturesLoading = false;
        state.accountDataForPictures = action.payload;
      })
      .addCase(getaccountDataForPicturesAsync.rejected, (state, action) => {
        state.picturesLoading = false;
      })

      // GET HEAD STITCH DATA
      .addCase(getHeadDataByDesignNoAsync.pending, (state, action) => {
      })
      .addCase(getHeadDataByDesignNoAsync.fulfilled, (state, action) => {
        state.headStitchData = action.payload;
      })
      .addCase(getHeadDataByDesignNoAsync.rejected, (state, action) => {
        state.headStitchData = []
      })

      // EMBROIDERY BILL
      .addCase(generateEmbroideryBillAsync.pending, (state) => {
        state.generateBillLoading = true;
      })
      .addCase(generateEmbroideryBillAsync.fulfilled, (state) => {
        state.generateBillLoading = false;
      })
        .addCase(generateEmbroideryBillAsync.rejected, (state) => {
        state.generateBillLoading = false;
      })


      .addCase(GETEmbroidery.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(GETEmbroidery.fulfilled, (state, action) => {
        state.loading = false;
        state.embroidery = action.payload;
      })

      .addCase(GETEmbroiderySIngle.pending, (state, action) => {
        state.loading = true;
        state.SingleEmbroidery = null;
        state.singleEmbroideryRequestId = action.meta.requestId;
      })
      .addCase(GETEmbroiderySIngle.fulfilled, (state, action) => {
        if (state.singleEmbroideryRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.SingleEmbroidery = action.payload;
      })
       .addCase(GETEmbroiderySIngle.rejected, (state, action) => {
        if (state.singleEmbroideryRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.SingleEmbroidery = null;
      })

      .addCase(UpdateEmbroidery.pending, (state, action) => {
        state.UpdatEmbroideryloading = true;
      })
      .addCase(UpdateEmbroidery.fulfilled, (state, action) => {
        state.UpdatEmbroideryloading = false;
      })

      //DELETE EMBROIDERY
      .addCase(deleteEmbroideryAsync.pending, (state, action) => {
        state.deleteLoadings = true;
      })
      .addCase(deleteEmbroideryAsync.fulfilled, (state, action) => {
        state.deleteLoadings = false;
      })
       
      //REPLACE EMBROIDERY
      .addCase(replaceEmbroideryDataAsync.pending, (state, action) => {
        state.UpdatEmbroideryloading = true;
      })
      .addCase(replaceEmbroideryDataAsync.fulfilled, (state, action) => {
        state.UpdatEmbroideryloading = false;
      })
      .addCase(replaceEmbroideryDataAsync.rejected, (state, action) => {
        state.UpdatEmbroideryloading = false;
      })

        //MARK EMBROIDERY AS VERIFIED
      .addCase(markEmbroideryAsVerifiedAsync.pending, (state) => {
        state.markVerifiedLoading = true;
      })
      .addCase(markEmbroideryAsVerifiedAsync.fulfilled, (state) => {
        state.markVerifiedLoading = false;
      })
      .addCase(markEmbroideryAsVerifiedAsync.rejected, (state) => {
        state.markVerifiedLoading = false;
      })

      //DOWNLOAD PDF
      .addCase(generateEmbroideryGatePssPdfAsync.pending, (state) => {
        state.EmroiderypdfLoading = true;
      })
      .addCase(generateEmbroideryGatePssPdfAsync.fulfilled, (state, action) => {
        state.EmroiderypdfLoading = false;
      });
  },
});

export const { reset } = EmbroiderySlice.actions;

export default EmbroiderySlice.reducer;
