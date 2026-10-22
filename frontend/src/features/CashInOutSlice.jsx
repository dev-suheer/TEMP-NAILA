import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

//API URL
const cashIn = "/api/cashInOut/cashIn";
const cashOut = "/api/cashInOut/cashOut";
const getTodayCashInOut = "/api/cashInOut/getTodaysCashInOut";
const validatePartyNameForMainBranch = "/api/cashInOut/validatePartyNameForMainBranch";
const validatePartyNameForOtherBranch = "/api/cashInOut/validatePartyNameForOtherBranches";
const validatePartyNameForAdmin = "/api/cashInOut/validatePartyNameForAdminBranch";

// CASH IN THUNK
export const cashInAsync = createAsyncThunk("cashInOut/cashIn", async (data) => {
    try {
        const response = await axios.post(cashIn, data);
        toast.success(response.data.message)
        return response.data;
    } catch (error) {
        toast.error(error.response.data.error);
    }
}
);

// CASH OUT THUNK
export const cashOutAsync = createAsyncThunk("cashInOut/cashOut", async (data) => {
    try {
        const response = await axios.post(cashOut, data);
        toast.success(response.data.message)
        return response.data;
    } catch (error) {
        toast.error(error.response.data.error);
    }
}
);

// GET TODAY CASH IN OUT THUNK
export const getTodayCashInOutAsync = createAsyncThunk("getToday/cashInOut", async (data) => {
    try {
        const response = await axios.post(getTodayCashInOut, data);
        return response.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error);
    }
}
);

// VALIDATE PARTY NAME FOR MAIN BRANCH THUNK
export const validatePartyNameForMainBranchAsync = createAsyncThunk("validate/mainBranch", async (data) => {
    try {
        const response = await axios.post(validatePartyNameForMainBranch, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.error);
    }
}
);

// VALIDATE PARTY NAME FOR ADMIN THUNK
export const validatePartyNameForAdminAsync = createAsyncThunk("validate/admin", async (data) => {
    try {
        const response = await axios.post(validatePartyNameForAdmin, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.error);
    }
}
);


// VALIDATE PARTY NAME FOR OTHER BRANCH THUNK
export const validatePartyNameForOtherBranchAsync = createAsyncThunk("validate/otherBranch", async (data) => {
    try {
        const response = await axios.post(validatePartyNameForOtherBranch, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.error);
    }
}
);


// INITIAL STATE
const initialState = {
    loading: false,
    cashInLoading: false,
    cashOutLoading: false,
    cashInResponse: [],
    cashOutResponse: [],
    TodayCashInOutData: [],
    mainBranchResponse: [],
    otherBranchResponse: [],
    valiDateLoading:false
};

const CashInOutSlice = createSlice({
    name: "CashInOutSlice",
    initialState,
    reducers : {
        resetValidatedResponse : (state) => {
            state.mainBranchResponse = [];
            state.otherBranchResponse = [];
        }
    },
    extraReducers: (builder) => {
        builder

            // CASH IN
            .addCase(cashInAsync.pending, (state) => {
                state.cashInLoading = true;
            })
            .addCase(cashInAsync.fulfilled, (state, action) => {
                state.cashInLoading = false;
                state.cashInResponse = action.payload
            })

            // CASH OUT
            .addCase(cashOutAsync.pending, (state) => {
                state.cashOutLoading = true;
            })
            .addCase(cashOutAsync.fulfilled, (state, action) => {
                state.cashOutLoading = false;
                state.cashOutResponse = action.payload
            })

            // GET TODAY CASH IN OUT
            .addCase(getTodayCashInOutAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(getTodayCashInOutAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.TodayCashInOutData = action.payload
            })

            // VALIDATE PARTY NAME FOR MAIN BRANCH
            .addCase(validatePartyNameForMainBranchAsync.pending, (state) => {
                state.valiDateLoading = true;
            })
            .addCase(validatePartyNameForMainBranchAsync.fulfilled, (state, action) => {
                state.valiDateLoading = false;
                state.mainBranchResponse = action.payload
            })

             // VALIDATE PARTY NAME FOR ADMIN BRANCH
             .addCase(validatePartyNameForAdminAsync.pending, (state) => {
                state.valiDateLoading = true;
            })
            .addCase(validatePartyNameForAdminAsync.fulfilled, (state, action) => {
                state.valiDateLoading = false;
                state.mainBranchResponse = action.payload
            })

            // VALIDATE PARTY NAME FOR OTHER BRANCH
            .addCase(validatePartyNameForOtherBranchAsync.pending, (state) => {
                state.valiDateLoading = true;
            })
            .addCase(validatePartyNameForOtherBranchAsync.fulfilled, (state, action) => {
                state.valiDateLoading = false;
                state.otherBranchResponse = action.payload
            })
    },
});

export const {resetValidatedResponse} = CashInOutSlice.actions;
export default CashInOutSlice.reducer;

