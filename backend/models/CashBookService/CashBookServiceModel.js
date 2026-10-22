import mongoose from "mongoose";
import { CashbookTransactionAccounts } from "../../enums/cashbookk.enum.js";

const cashBookServiceSchema = new mongoose.Schema(
  {
    pastDate: {
      type: String, 
      default:null,
    },
    pastTransaction: {
      type: Boolean,
      default:false,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Branch",
      required: [true,"Branch id is required"],
    },
    amount: {
      type: Number,
      required: [true,"Transaction amount is required"],
    },
    tranSactionType: {
      type: String, 
      required: [true,"Transaction type is required"],
    },
    transactionFrom: {
      type: String, 
      required: [true,"Transaction source is required"],
    },
    partyName: {
      type: String, 
      required: [true,"Party Name is required"],
    },
    payment_Method: {
      type: String,
      required: [true,"Payment Method name is required"],
    },
    currentDate:{
        type:String,
        default:null
    },
    transactionTime:{
        type: String,
        required: [true,"Transaction time is required"],  
    },
    sourceId: {
      type: mongoose.Types.ObjectId,
      default: null
    },
    category: {
      type:String,
      default:null,
      enum: {
        values: Object.values(CashbookTransactionAccounts),
        message: "Invalid cashbook transaction category"
      },
    }
  },
  { timestamps: true }
);

cashBookServiceSchema.index({ branchId: 1, currentDate: -1, createdAt: -1 });
cashBookServiceSchema.index({ branchId: 1, pastDate: -1, createdAt: -1 });
cashBookServiceSchema.index({ branchId: 1, payment_Method: 1, tranSactionType: 1 });

export const cashBookServiceModel = mongoose.model(
  "Cash Book",
  cashBookServiceSchema
);
