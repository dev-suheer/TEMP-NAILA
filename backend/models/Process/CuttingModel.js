import mongoose from 'mongoose';

const categoryQuantitySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      default: "Front",
    },
    color: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    received: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const cuttingSchema = new mongoose.Schema({
    embroidery_Id:{
        type: mongoose.Types.ObjectId,
        required: [true, "Embroidery Id required"],
      },
      source_step: {
        type: String,
        enum: ["Embroidery", "Calender", "Cutting", "Stone", "Stitching"],
        default: "Embroidery",
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
      T_Quantity: {
        type: Number,
      },
      design_no: {
        type: String,
        required: [true, "Design no value required"],
      },
      date: {
        type: Date,
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
      r_quantity:{
        type:Number,
        default:null
      },
      category_quantity: {
        type: [categoryQuantitySchema],
        default: [],
      },
      project_status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending",
      },
      bill_generated : {
        type: Boolean,
        default: false
      },
      updated : {
        type: Boolean,
        default: false
      },
      additionalExpenditure: {
        type: Number,
        default: 0,
    },

}, { timestamps: true });

cuttingSchema.index({ project_status: 1, createdAt: -1 });
cuttingSchema.index({ partyName: 1, createdAt: -1 });
cuttingSchema.index({ date: -1 });
cuttingSchema.index({ embroidery_Id: 1 });
cuttingSchema.index({ design_no: 1, createdAt: -1 });
cuttingSchema.index({ Manual_No: 1, createdAt: -1 });
cuttingSchema.index({ embroidery_Id: 1, design_no: 1 });
cuttingSchema.index({ source_step: 1, source_id: 1, createdAt: -1 });

export const CuttingModel = mongoose.model('Cutting', cuttingSchema);


                           
