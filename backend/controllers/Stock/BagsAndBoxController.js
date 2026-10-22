import { BagsAndBoxModel } from "../../models/Stock/BagsAndBoxModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams } from "../../utils/Common.js";

export const addBagsAndBoxInStock = async ({billId,name, bill_no, r_Date, quantity,session}) => {
  try {
    if (!name || !bill_no || !quantity || !r_Date)
      throw new Error("All Fields Required");
    // Ensure name is either 'Bags' or 'Box'
  if (name !== "Bags" && name !== "Box") {
    throw new Error("Name must be either 'Bags' or 'Box'");
  }
    const checkExistingStock = await BagsAndBoxModel.findOne({
      name: name,
    }).session(session);
    let recordData = { bill_no, name, quantity, date: r_Date, bill_id:billId };
    if (checkExistingStock) {
      const updatedTotalQuantity = checkExistingStock.totalQuantity + parseInt(quantity);
      checkExistingStock.recently = parseInt(quantity),
        checkExistingStock.r_Date = r_Date,
        checkExistingStock.bill_no = bill_no,
        checkExistingStock.totalQuantity = updatedTotalQuantity;
      checkExistingStock.all_Records.push(recordData);
      await checkExistingStock.save({session});
    } else {
      await BagsAndBoxModel.create([{
        name,
        bill_no,
        recently: parseInt(quantity),
        totalQuantity: quantity,
        r_Date,
        all_Records: [recordData],
      }],{session});
    }

    return { message: "Successfully Added" };
  } catch (error) {
    return { error: error.message };
  }
};

export const removeBagsAndBoxFromStock = async ({billId,name, bill_no, r_Date, quantity,session}) => {
  try {
    if (!name || !bill_no || !quantity || !r_Date)
      throw new Error("All Fields Required To Delete Stock");
    // Ensure name is either 'Bags' or 'Box'
  if (name !== "Bags" && name !== "Box") {
    throw new Error("Name must be either 'Bags' or 'Box'");
  }
    const checkExistingStock = await BagsAndBoxModel.findOne({
      name: name,
    }).session(session);
    if (checkExistingStock) {
      const updatedTotalQuantity = checkExistingStock.totalQuantity - parseInt(quantity);
      if(updatedTotalQuantity < 0){
        throw new Error(`Not Enough ${name} Quantity In Stock`);
      }
        checkExistingStock.totalQuantity = updatedTotalQuantity;
      checkExistingStock.all_Records = checkExistingStock.all_Records.filter((record) => record?.bill_id?.toString() !== billId)
      await checkExistingStock.save({session});
    } else {
      throw new Error("Bags/Box Stock Not Found")
    }

    return { message: "Stock Successfully Deleted" };
  } catch (error) {
    return { error: error.message };
  }
};

export const getAllBagsAndBox = async (req, res, next) => {
  try {
   

    const { page, limit } = getPaginationParams(req.query);
    let search = req.query.search || "";
 
    let query = {
      name: { $regex: search, $options: "i" },
      
    };
  
 
    const data = await BagsAndBoxModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

 
    const total = await BagsAndBoxModel.countDocuments(query);
 
    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totalBagBox:total,
      totalRecords: total,
      data
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
