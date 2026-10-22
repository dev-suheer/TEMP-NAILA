import mongoose from "mongoose";
import { StitchType } from "../../enums/StitchType.js";

const branchStockSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: [true, "Branch id is required"],
  },
  lastUpdated: {
    type: String,
    required: [true, "Issue date is required"],
  },
  category: {
    type: String,
    required: [true, "Category required"],
  },
  color: {
    type: String,
    required: [true, "Color required"],
  },
  stitch_type: {
    type: String,
    enum: Object.values(StitchType),
    default: StitchType.UNSTITCHED,
  },
  sku: {
    type: String,
  },
  total_quantity: {
    type: Number,
    required: [true, "Quantity is required"],
  },
  sold_quantity: {
    type: Number,
    default:0,
  },
  cost_price: {
    type: Number,
    required: [true, "Cost price is required"],
  },
  sale_price: {
    type: Number,
    required: [true, "Sale price is required"],
  },
  d_no: {
    type: Number,
    required: [true, "Design number required"],
  },
  main_stock_Id: {
    type: mongoose.Types.ObjectId,
    required: [true, "Suit Id is Required"],
  },
},
{timestamps:true}
);

branchStockSchema.index({ branchId: 1, total_quantity: -1 });
branchStockSchema.index({ branchId: 1, d_no: 1, total_quantity: -1 });
branchStockSchema.index({ branchId: 1, category: 1, total_quantity: -1 });
branchStockSchema.index({ branchId: 1, d_no: 1, category: 1, color: 1 });

export const branchStockModel = mongoose.model(
  "Branch Stock",
  branchStockSchema
);

