import mongoose from "mongoose";
import { StitchType } from "../../enums/StitchType.js";

const measurement_details = new mongoose.Schema({
  design_no: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: "",
  },
  cost_price: {
    type: Number,
    default: 0,
  },
  sale_price: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  roleQuantity: {
    type: Number,
    default: 0,
  },
  measurement: {
    type: Number,
    default: 0,
  },
  colour: {
    type: String,
    default: "",
  },
  stitch_type: {
    type: String,
    enum: Object.values(StitchType),
  },
  rate: {
    type: Number,
    default: 0,
  },
  rowQuantity: {
    type: Number,
    default: 0,
  },
  rowTotal: {
    type: Number,
    default: 0,
  },
});

const purchasing_History_Schema = new mongoose.Schema({
  bill_no: {
    type: String,
    required: [true, "Bill Number is required"],
  },
  name: {
    type: String,
    required: [true, "Name Value is required"],
  },
  category: {
    type: String,
    required: [true, "category Value is required"],
  },
  date: {
    type: String,
    required: [true, "Date value is required"],
  },
  seller_stock_category : {
    type: String,
    required:[true,'Seller Stock Category Required'],
    enum:['Base','Lace','Bag/box','Accessories','Suits']
  },
  quantity: {
    type: Number,
    required: [true, "Quantity Value is required"],
  },
  rate: {
    type: Number,
    required: [true, "Rate Value is required"],
  },
  total: {
    type: Number,
    required: [true, "Numnber Value is required"],
  },
  measurementData: {
    type: [measurement_details],
    default: [],
  },
  toAddinStock: {
    type: Boolean,
    default: false,
  }
},
{timestamps:true});

purchasing_History_Schema.index({ seller_stock_category: 1, date: -1, createdAt: -1 });
purchasing_History_Schema.index({ seller_stock_category: 1, name: 1, date: -1 });

export const purchasing_History_model = mongoose.model("Purchasing History", purchasing_History_Schema);
