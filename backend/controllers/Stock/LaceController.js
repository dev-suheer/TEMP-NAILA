import { LaceModel } from "../../models/Stock/Lace.Model.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams } from "../../utils/Common.js";


export const addLaceInStock = async ({billId,bill_no,name,category,quantity,r_Date,session}) => {
  try {
    if (!category || !bill_no || !quantity || !r_Date || !name)
      throw new Error("All Fields Required");
    const checkExistingStock = await LaceModel.findOne({
      category: category,
    }).session(session);
    let recordData = {bill_no,name,category,quantity,date:r_Date,bill_id:billId};
    if (checkExistingStock) {
      const updatedTotalQuantity = checkExistingStock.totalQuantity + quantity;
          checkExistingStock.recently = quantity,
          checkExistingStock.r_Date = r_Date,
          checkExistingStock.totalQuantity = updatedTotalQuantity,
          checkExistingStock.bill_no = bill_no,
          checkExistingStock.all_Records.push(recordData)
          await checkExistingStock.save({session});     
    } else {
      await LaceModel.create([{
        bill_no,
        name,
        recently: quantity,
        r_Date,
        totalQuantity: quantity,
        category,
        all_Records:[recordData]
      }],{session});
    }

    return { message: "Successfully Added" };
  } catch (error) {
    throw error;
  }
};

export const removeLaceFromStock = async ({billId,bill_no,name,category,quantity,r_Date,session}) => {
  try {
    if (!category || !bill_no || !quantity || !r_Date || !name)
      throw new Error("All Fields Required To Delete Stock");
    const checkExistingStock = await LaceModel.findOne({
      category: category,
    }).session(session);
    if (checkExistingStock) {
      const updatedTotalQuantity = checkExistingStock.totalQuantity - quantity;
      if(updatedTotalQuantity < 0){
        throw new Error("Not Enough Lace Quantity In Stock");
      }
          checkExistingStock.totalQuantity = updatedTotalQuantity,
          checkExistingStock.all_Records = checkExistingStock.all_Records.filter((record) => record?.bill_id?.toString() !== billId)
          await checkExistingStock.save({session});     
    } else {
     throw new Error("Lace Stock Not Found")
    }

    return { message: "Stock Successfully Deleted" };
  } catch (error) {
    return { error: error.message };
  }
};

export const getAllLaceStock = async (req,res,next) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        let search = req.query.search || "";
     
        let query = {
          name: { $regex: search, $options: "i" },
          
        };
      
     
        const data = await LaceModel.find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 });
    
     
        const total = await LaceModel.countDocuments(query);
     
        const response = {
          totalPages: Math.ceil(total / limit),
          page,
          limit,
          Lace:total,
          totalRecords: total,
          data
        };
        setMongoose();
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getAllLaceForEmbroidery =  async (req,res,next) => {
  try {
    const baseData = await LaceModel.find({});
    setMongoose();
    return res.status(200).json(baseData);
  } catch (error) {
    return res.status(500).json({error:error.message})
  }
};
