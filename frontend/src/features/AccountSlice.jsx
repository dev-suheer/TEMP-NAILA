import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { buildQueryParams } from "../Utils/Common";

//API URL
const addEmployee = "/api/employ/addEmploye";
const ActiveEmployee = "/api/employ/getAllActiveEmploye";
const PastEmployee = "/api/employ/getAllPastEmploye";
const EmployeeByID = "/api/employ/getEmployeDataById";
const Update = "/api/employ/updateEmploye";
const Debitcredit = "/api/employ/creditDebitBalance";
const creditEmployeeeSalary = '/api/employ/creditSalaryForSingleEmploye'
const addLeaveUrl = '/api/employ/addLeave'
const updateOvertimeUrl = '/api/employ/updateOvertime'
const reverseSalaryeUrl = '/api/employ/reverseSalary'
const deleteCreditDebitEntryUrl = '/api/employ/deleteCreditDebitEntry'
const getAttendencedataUrl = '/api/employ/getAttendencedata';
const updateAttendanceDataUrl = '/api/employ/updateAttendanceData'
const updateBulkAttendanceDataUrl = '/api/employ/updateBulkAttendanceData'
const calculateSalaryUrl = '/api/employ/calculateSalary'


export const CreateEmployee = createAsyncThunk(
  "Employee/create",
  async (formData) => {
    try {
      const response = await axios.post(addEmployee, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }
);

export const GetEmployeeActive = createAsyncThunk("Employee/GetActiveEmployee", async (data) => {
  const searchQuery =
    data?.search !== undefined && data?.search !== null
      ? `&search=${data?.search}`
      : "";
  const limitQuery =
    data?.limit !== undefined && data?.limit !== null
      ? `&limit=${data?.limit}`
      : "";
  try {
    const response = await axios.post(`${ActiveEmployee}?&page=${data.page}${limitQuery}${searchQuery}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
}
)

export const GetEmployeePast = createAsyncThunk(
  "Employee/GetEmplpyeePast",
  async (data) => {
    const searchQuery =
      data?.search !== undefined && data?.search !== null
        ? `&search=${data?.search}`
        : "";
    const limitQuery =
      data?.limit !== undefined && data?.limit !== null
        ? `&limit=${data?.limit}`
        : "";
    try {
      const response = await axios.post(`${PastEmployee}?&page=${data.page}${limitQuery}${searchQuery}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
)

export const GetEmployeeById = createAsyncThunk(
  "Employee/SingleEmployee",
  async (id) => {
    try {
      const response = await axios.post(EmployeeByID, id);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const UpdateEmployee = createAsyncThunk(
  "Employee/Update",
  async (formData) => {
    try {
      const response = await axios.post(Update, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
);

export const AddCreditDebit = createAsyncThunk(
  "Employee/Debitcredit",
  async (formData) => {
    try {
      const response = await axios.post(Debitcredit, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
     toast.error(error.response.data.error);
    }
  }
);

export const CreditSalary = createAsyncThunk(
  "Employee/CreaditEmployeeSalary",
  async (formData) => {
    try {
      const response = await axios.post(creditEmployeeeSalary, formData);
      toast.success(response.data.message);
      
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const addLeaveAsync = createAsyncThunk(
  "Employee/markLeave",
  async (formData) => {
    try {
      const response = await axios.post(addLeaveUrl, formData);
      toast.success(response.data.message);
      
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const updateOvertimeHoursAsync = createAsyncThunk(
  "Employee/addOvertime",
  async (formData) => {
    try {
      const response = await axios.post(updateOvertimeUrl, formData);
      toast.success(response.data.message);
      
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const reverseSalaryAsync = createAsyncThunk(
  "Employee/reverseSalary",
  async (formData) => {
    try {
      const response = await axios.post(reverseSalaryeUrl, formData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const deleteCreditDebitEntryAsync = createAsyncThunk(
  "Employee/deleteCreditDebit",
  async (data) => {
    try {
      const response = await axios.post(`${deleteCreditDebitEntryUrl}/${data.employeId}/${data.recordId}`);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }
);

export const GetAttendencedataAsync = createAsyncThunk("Employee/GetAttendenceData", async (data) => {
      const queryParams = buildQueryParams({
      month: data.month
    });
  try {
    const response = await axios.get(`${getAttendencedataUrl}?${queryParams}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
}
)

export const UpdateAttendencedataAsync = createAsyncThunk("Employee/UpdateAttendanceData", async (data) => {
  try {
    const response = await axios.post(updateAttendanceDataUrl, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
}
)

export const UpdateBulkAttendencedataAsync = createAsyncThunk("Employee/UpdateBulkAttendanceData", async (data) => {
  try {
    const response = await axios.post(updateBulkAttendanceDataUrl, data);
    toast.success(response.data.message);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.error || "Unable to update bulk attendance");
    throw new Error(error.response?.data?.error || "Unable to update bulk attendance");
  }
}
)

export const CalculateSalaryAsync = createAsyncThunk("Employee/CalculateSalary", async (data) => {
  try {
    const response = await axios.post(calculateSalaryUrl, data);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.error || "Unable to calculate salary");
    throw new Error(error.response?.data?.error || "Unable to calculate salary");
  }
}
)

const initialState = {
  Employees: [],
  ActiveEmployees: [],
  PastEmployees: [],
  attendanceData: [],
  Employee: {},
  loading: false,
  employeEditLoading:false,
  getAttendaceLoading:false,
  updateAttendanceLoading:false,
  calculateSalaryLoading:false
};

const AccountSlice = createSlice({
  name: "Account",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      .addCase(CreateEmployee.pending, (state,) => {
        state.employeEditLoading = true;
      })
      .addCase(CreateEmployee.fulfilled, (state,) => {
        state.employeEditLoading = false;
      })
      .addCase(CreateEmployee.rejected, (state,) => {
        state.employeEditLoading = false;
      })

      
      .addCase(reverseSalaryAsync.pending, (state) => {
        state.employeEditLoading = true;
      })
      .addCase(reverseSalaryAsync.fulfilled, (state) => {
        state.employeEditLoading = false;
      })
      .addCase(reverseSalaryAsync.rejected, (state) => {
        state.employeEditLoading = false;
      })

      .addCase(deleteCreditDebitEntryAsync.pending, (state) => {
        state.employeEditLoading = true;
      })
      .addCase(deleteCreditDebitEntryAsync.fulfilled, (state) => {
        state.employeEditLoading = false;
      })
      .addCase(deleteCreditDebitEntryAsync.rejected, (state) => {
        state.employeEditLoading = false;
      })

      .addCase(addLeaveAsync.pending, (state, ) => {
        state.employeEditLoading = true;
      })
      .addCase(addLeaveAsync.fulfilled, (state, ) => {
        state.employeEditLoading = false;
      })

      .addCase(updateOvertimeHoursAsync.pending, (state,) => {
        state.employeEditLoading = true;
      })
      .addCase(updateOvertimeHoursAsync.fulfilled, (state,) => {
        state.employeEditLoading = false;
      })

      .addCase(GetEmployeeActive.pending, (state,) => {
        state.loading = true;
      })
      .addCase(GetEmployeeActive.fulfilled, (state,action ) => {
        state.loading = false;
        state.ActiveEmployees = action.payload
      })

      .addCase(GetEmployeePast.pending, (state, ) => {
        state.loading = true;
      })
      .addCase(GetEmployeePast.fulfilled, (state, action) => {
        state.loading = false;
        state.PastEmployees = action.payload
      })


      .addCase(GetEmployeeById.pending, (state, ) => {
        state.loading = true;
      })
      .addCase(GetEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.Employee = action.payload
      })


      .addCase(UpdateEmployee.pending, (state,) => {
        state.employeEditLoading = true;
      })
      .addCase(UpdateEmployee.fulfilled, (state,) => {
        state.employeEditLoading = false;
      })


      .addCase(AddCreditDebit.pending, (state) => {
        state.employeEditLoading = true;
      })
      .addCase(AddCreditDebit.fulfilled, (state) => {
        state.employeEditLoading = false;
      })


      .addCase(CreditSalary.pending, (state) => {
        state.employeEditLoading = true;
      })
      .addCase(CreditSalary.fulfilled, (state) => {
        state.employeEditLoading = false;
      })

      .addCase(GetAttendencedataAsync.pending, (state) => {
        state.getAttendaceLoading = true;
      })
      .addCase(GetAttendencedataAsync.fulfilled, (state, action) => {
        state.attendanceData = action.payload
        state.getAttendaceLoading = false;
      })
      .addCase(GetAttendencedataAsync.rejected, (state) => {
        state.getAttendaceLoading = false;
      })

      .addCase(UpdateAttendencedataAsync.pending, (state) => {
        state.updateAttendanceLoading = true;
      })
      .addCase(UpdateAttendencedataAsync.fulfilled, (state) => {
        state.updateAttendanceLoading = false;
      })
      .addCase(UpdateAttendencedataAsync.rejected, (state) => {
        state.updateAttendanceLoading = false;
      })

      .addCase(UpdateBulkAttendencedataAsync.pending, (state) => {
        state.updateAttendanceLoading = true;
      })
      .addCase(UpdateBulkAttendencedataAsync.fulfilled, (state) => {
        state.updateAttendanceLoading = false;
      })
      .addCase(UpdateBulkAttendencedataAsync.rejected, (state) => {
        state.updateAttendanceLoading = false;
      })

      .addCase(CalculateSalaryAsync.pending, (state) => {
        state.calculateSalaryLoading = true;
      })
      .addCase(CalculateSalaryAsync.fulfilled, (state) => {
        state.calculateSalaryLoading = false;
      })
      .addCase(CalculateSalaryAsync.rejected, (state) => {
        state.calculateSalaryLoading = false;
      })
  },
});

export const { reset } = AccountSlice.actions;

export default AccountSlice.reducer;
