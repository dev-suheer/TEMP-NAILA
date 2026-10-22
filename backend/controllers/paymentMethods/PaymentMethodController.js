import CustomError from "../../config/errors/CustomError.js";
import { verifyrequiredparams } from "../../middleware/Common.js";
import { PaymentMethodModel } from "../../models/PaymentMethods/PaymentMethodModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import {
  VirtalAccountModal,
} from "../../models/DashboardData/VirtalAccountsModal.js";
import { getTodayDate } from "../../utils/Common.js";
import { DailySaleModel } from "../../models/DailySaleModel.js";
import mongoose from "mongoose";
import { PaymentMethod } from "../../enums/PaymentMethod.js";

const today = getTodayDate();

export const createPaymentMethod = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
    const { name } = req.body;
    verifyrequiredparams(req.body,['name'])
    const existingCheck = await PaymentMethodModel.findOne({name:new RegExp(`^${name}$`,'i')}).session(session);
    if (existingCheck) {
     throw new CustomError('Payment method with this name already exists',404)
    };
    let virtualAccounts = await VirtalAccountModal.findOne().session(session);
    await PaymentMethodModel.create([{ name }], { session });

    await VirtalAccountModal.findByIdAndUpdate(
      virtualAccounts._id, 
      { $set: { [name]: 0 } },
      { new: true } 
    ).session(session);

    await DailySaleModel.updateMany(
      { date: today },
      { $set: { [`saleData.${name}`]: 0 } },
      { session }
    );

    return res.status(201).json({success:true,message:'Payment method created successfully'});
  })
  } catch (error) {
    next(error)
  } finally {
    session.endSession();
    }
};


export const getAllPaymentMethodsForSuperAdmin = async (req, res, next) => {
  try {
    const methods = await PaymentMethodModel.find({ name: { $ne: PaymentMethod.CASH } }).sort({ createdAt: -1 });
    setMongoose();
   return res.status(200).json(methods);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const getAllPaymentMethodsForTransaction = async (req, res, next) => {
    try {
      const data = await PaymentMethodModel.find({active:{$ne:false}});
      const methods = data.map((item) => {
        return {
            label:item.name,
            value:item.name
        }
      });
     return res.status(200).json(methods);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
};
  

export const updatePaymentMethod = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
    const id = req.params.id;
    const {name, active} = req.body;
    let oldMethodData = await PaymentMethodModel.findById(id).session(session);
    const oldName = oldMethodData.name;
    let updateQuery = {};
   
    if (name) {
         const existing = await PaymentMethodModel.findOne({
          name: { $regex: new RegExp(`^${name}$`, 'i') }
        }).session(session);
  
        if (existing) {
          throw new CustomError('Payment method name already exists',400);
      }
      updateQuery.name = name;

       //UPDATE VIRTUAL ACCOUNTS
     
       const updatedVirtualAccounts = await VirtalAccountModal.updateMany(
        { [oldName]: { $exists: true } },
        {
          $rename: {
            [oldName]: name,
          },
        },
        { session }
      );

      if(updatedVirtualAccounts.modifiedCount === 0){
        throw new CustomError(`Failed to rename ${oldName} to ${name} in accounts`,400)
      };

      //UPDATED DAILY SALES

      const updatedDailySales = await DailySaleModel.updateMany(
        {date : { $eq : today }},
        {
          $rename : {
            [`saleData.${oldName}`] : `saleData.${name}`
          }
        },
        {session}
      );


      if(updatedDailySales.modifiedCount === 0){
        throw new CustomError(`Failed to rename ${oldName} to ${name} in Daily Sales`,400)
      };

      
    };

    if(typeof active === 'boolean'){
        updateQuery = {...updateQuery, active}

        if(active === true){

        //UPDATED DAILY SALES

       const updatedDailySales = await DailySaleModel.updateMany(
          { date: today },
          { $set: { [`saleData.${name}`]: 0 } },
          { session }
        );

      if(updatedDailySales.modifiedCount === 0){
        throw new CustomError(`Failed to rename ${oldName} to ${name} in Daily Sales`,400)
      };

        }
    };

    //UPDATE IN PAYMENT METHOD MODAL
    const updatedpaymentMethod = await PaymentMethodModel.findByIdAndUpdate(
        id,
      updateQuery,
      { new: true, runValidators: true }
    ).session(session);

    if (!updatedpaymentMethod) throw new CustomError('Update failed', 404);

    setMongoose();
    return res.status(200).json({success:true,message:'Updated Successfully'});
    });
  } catch (error) {
    next(error)
  } finally {
    session.endSession();
  }
};

//IMPLEMENT OTHER SALE FUNCTIONALITY EVERYWHERE

