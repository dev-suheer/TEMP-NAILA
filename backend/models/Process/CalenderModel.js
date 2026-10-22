import mongoose from 'mongoose';

const calenderSchema = new mongoose.Schema({
  embroidery_Id:{
    type: mongoose.Types.ObjectId,
    required: [true, "Embroidery Id required"],
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
  r_quantity:{
    type:Number,
    default:null
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

calenderSchema.index({ project_status: 1, createdAt: -1 });
calenderSchema.index({ partyName: 1, createdAt: -1 });
calenderSchema.index({ date: -1 });
calenderSchema.index({ embroidery_Id: 1 });
calenderSchema.index({ design_no: 1, createdAt: -1 });
calenderSchema.index({ Manual_No: 1, createdAt: -1 });
calenderSchema.index({ embroidery_Id: 1, design_no: 1 });

export const CalenderModel = mongoose.model('Calender', calenderSchema);
