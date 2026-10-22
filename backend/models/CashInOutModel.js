

import mongoose from "mongoose";

const cashInOutSchema = new mongoose.Schema({
    branchId:{
        type:mongoose.Types.ObjectId,
        required: [true,'Branch Id required']
    },
    date:{
        type:String,
        required: [true,'Date required']
    },
    todayCashIn : {
        type: Number,
        required: [true,'Today Cash In required']
    },
    todayCashOut : {
        type: Number,
        required: [true,'Today Cash Out required']
    }
},{timestamps:true});

cashInOutSchema.index({ branchId: 1, date: 1 });

export const CashInOutModel = mongoose.model('Cash In Out',cashInOutSchema);
