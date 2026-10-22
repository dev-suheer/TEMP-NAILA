import mongoose from "mongoose";

const financialDetails = new mongoose.Schema({
  total_debit: {
    type: Number,
    default: 0,
  },
  total_credit: {
    type: Number,
    default: 0,
  },
  total_balance: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Paid", "Unpaid", "Advance Paid"],
    default: "Unpaid",
  },
});

const transaction_details = new mongoose.Schema({
date: {
    type: String,
    required: [true, "Date is required"],
  },
  particular: {
    type: String,
    required: [true, "Particular is required"],
  },
  debit: {
    type: Number,
    default: 0,
  },
  credit: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    required: [true, "Balance value is required"],
  },
  orderId: {
    type: String,
  },
  bill_id: {
    type: mongoose.Types.ObjectId
  }
});

const picturesSchema = new mongoose.Schema(
  {
    embroidery_Id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Embroidery Id required"],
      ref: "Embroidery",
    },
    T_Quantity: {
      type: Number,
    },
    design_no: {
      type: String,
      required: [true, "Design no value required"],
    },
    date: {
      type: String,
      required: [true, "date required"],
    },
    partyName: {
      type: String,
      required: [true, "Party Name required"],
    },
    rate: {
      type: Number,
      required: [true, "Rate value required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

picturesSchema.index({ embroidery_Id: 1 });
picturesSchema.index({ status: 1, createdAt: -1 });
picturesSchema.index({ partyName: 1, createdAt: -1 });
picturesSchema.index({ date: -1 });

picturesSchema.set("toJSON", (doc, ret, options) => {
  const {
    embroidery_Id,
    T_Quantity,
    design_no,
    date,
    partyName,
    rate,
    status,
    _id: id,
  } = ret;
  return {
    embroidery_Id,
    T_Quantity,
    design_no,
    date,
    partyName,
    rate,
    status,
    _id: id,
  };
});

const picturesAccountsSchema = new mongoose.Schema(
  {
    partyName: {
      type: String,
      required: [true, "Party Name required"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    design_no: {
      type: String,
      required: [true, "Design_no is required"],
    },
    serial_No: {
      type: String,
      required: [true, "Serial_No is required"],
    },
    virtual_account: financialDetails,
    credit_debit_history: [transaction_details],
  },
  { timestamps: true }
);

picturesAccountsSchema.index({ "virtual_account.status": -1, createdAt: -1 });
picturesAccountsSchema.index({ partyName: 1, date: -1 });

export const PicruresModel = mongoose.model("EMB Pictures", picturesSchema);
export const PicruresAccountModel = mongoose.model(
  "Pictures Accounts",
  picturesAccountsSchema
);
