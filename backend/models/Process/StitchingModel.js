import mongoose from "mongoose";

const suit_schema = new mongoose.Schema(
  {
    category: {
      type: String,
    },
    color: {
      type: String,
    },
    quantity_in_no: {
      type: Number,
    },
    recieved: {
      type: Number,
      default: 0,
    },
    cost_price: {
      type: Number,
      default: 0,
    },
    sale_price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const dupatta_schema = new mongoose.Schema(
  {
    category: {
      type: String,
    },
    color: {
      type: String,
    },
    quantity_in_no: {
      type: Number,
    },
    recieved: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const stitchingSchema = new mongoose.Schema(
  {
    embroidery_Id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Embroidery Id required"],
    },
    source_step: {
      type: String,
      enum: ["Embroidery", "Calender", "Cutting", "Stone", "Stitching"],
      default: "Stone",
    },
    source_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    serial_No: {
      type: Number,
      required: [true, "Serial No required"],
    },
    Manual_No: {
      type: String,
    },
    Quantity: {
      type: Number,
      required: [true, "Quantity value required"],
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
    lace_quantity: {
      type: Number,
      default: 0
    },
    lace_category: {
      type: String,
      default: null
    },
    r_quantity: {
      type: Number,
      default: 0,
    },
    project_status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    suits_category: {
      type: [suit_schema],
      default: null,
    },
    dupatta_category: {
      type: [dupatta_schema],
      default: null,
    },
    bill_generated: {
      type: Boolean,
      default: false,
    },
    updated: {
      type: Boolean,
      default: false,
    },
    packed:{
      type: Boolean,
      default: false
    },
     additionalExpenditure: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

stitchingSchema.index({ project_status: 1, createdAt: -1 });
stitchingSchema.index({ partyName: 1, createdAt: -1 });
stitchingSchema.index({ date: -1 });
stitchingSchema.index({ embroidery_Id: 1 });
stitchingSchema.index({ design_no: 1, createdAt: -1 });
stitchingSchema.index({ Manual_No: 1, createdAt: -1 });
stitchingSchema.index({ embroidery_Id: 1, design_no: 1 });
stitchingSchema.index({ source_step: 1, source_id: 1, createdAt: -1 });

export const StitchingModel = mongoose.model("Stitchings", stitchingSchema);
