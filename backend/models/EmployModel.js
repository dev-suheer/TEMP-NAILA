import mongoose, { mongo } from "mongoose";

const financeSchema = new mongoose.Schema({
  date: {
    type: String,
    default: null,
  },
  particular: {
    type: String,
    default: null,
  },
  balance: {
    type: Number,
    default: null,
  },
  debit: {
    type: Number,
    default: null,
  },
  credit: {
    type: Number,
    default: null,
  },
  salaryTransaction: {
    type: Boolean,
    default: false,
  },
  reversed: {
    type: Boolean,
    default: false,
  },
  payment_Method: {
    type: String,
    default: "",
  },
  over_time: {
    type: Number,
    default: 0,
  },
  leaves: {
    type: Number,
    default: 0,
  },
  branchId: {
    type:  String,
    default:null
  },
});

const employeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name required"],
      index:true
    },
    father_Name: {
      type: String,
      required: [true, "Father Name required"],
    },
    CNIC: {
      type: String,
      required: [true, "CNIC required"],
    },
    phone_number: {
      type: Number,
      required: [true, "phone number required"],
    },
    address: {
      type: String,
      required: [true, "address required"],
    },
    father_phone_number: {
      type: Number,
      required: [true, "father phone number required"],
    },
    last_work_place: {
      type: String,
      required: [true, "phone number required"],
    },
    designation: {
      type: String,
      required: [true, "designation required"],
    },
    salary: {
      type: Number,
      required: [true, "salary required"],
    },
    joininig_date: {
      type: String,
      required: [true, "joining date required"],
    },
    pastEmploye: {
      type: Boolean,
      default: false,
    },
    financeData: [financeSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

employeSchema.virtual('attendanceRecords',{
  ref: "EmployeAttendence",
  localField: "_id",
  foreignField: "employee_id"
});

employeSchema.index({ pastEmploye: 1, createdAt: -1 });

export const EmployeModel = mongoose.model("Employ", employeSchema);


///////

const attendanceSchema = new mongoose.Schema({
  employee_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employ", 
    required: true,
    index: true 
  },
  date: {
    type: Date,
    required: [true,"Date is required"],
  },
  status: {
    type: String,
    required: [true, "Employee status is required"],
    enum: ['present', 'absent', 'leave'],
    default: 'present'
  },
  check_in: {
    type: Date, 
    default: null
  },
  check_out: {
    type: Date, 
    default: null
  },
  overtime_hours: {
    type: Number,
    default: 0,
  },
  is_weekly_holiday: {
    type: Boolean,
    default: false
  },
  is_public_holiday: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    default: null
  }
}, { timestamps: true });

attendanceSchema.index({ employee_id: 1, date: -1 });

export const EmployeAttendenceModel = mongoose.model("EmployeAttendence", attendanceSchema);

///////

const SalarySchema = new mongoose.Schema({
  employee_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employ",
    required: true,
    index: true 
  },
  transaction_id : {
    type: mongoose.Schema.Types.ObjectId,
    required: [true,"Transaction id is required"],
  },
  for_month: {
    type: String,
    required: true
  },
  payment_date: {
    type: Date,
    required: [true,"Payment date is required"]
  },
}, { timestamps: true });

SalarySchema.index({ employee_id: 1, for_month: 1 });

export const EmployeSalaryRecordModel = mongoose.model("EmployeSalaryRecord", SalarySchema);
