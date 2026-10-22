import { AccssoriesModel } from "../../models/Stock/AccssoriesModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams } from "../../utils/Common.js";

export const addAccesoriesInStock = async ({billId,serial_No, name, r_Date, quantity,session,category}) => {
  try {
    if (!serial_No || !quantity || !r_Date || !name || !category)
      throw new Error("All Fields Required");
    const checkExistingStock = await AccssoriesModel.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") },
    }).session(session);
    let recordData = { serial_No, name: category, quantity, date: r_Date, bill_id:billId };
    if (checkExistingStock) {
      const updatedTotalQuantity = checkExistingStock.totalQuantity + quantity;
      (checkExistingStock.recently = quantity),
        (checkExistingStock.r_Date = r_Date),
        (checkExistingStock.totalQuantity = updatedTotalQuantity),
        (checkExistingStock.serial_No = serial_No),
        checkExistingStock.all_Records.push(recordData);
      await checkExistingStock.save({session});
    } else {
      await AccssoriesModel.create([{
        serial_No,
        name: category,
        recently: quantity,
        r_Date,
        totalQuantity: quantity,
        all_Records: [recordData],
      }],{session});
    }
    return { message: "Successfully Added" };
  } catch (error) {
    return { error: error.message };
  }
};

export const removeAccesoriesFromStock = async ({billId,serial_No, name, r_Date, quantity,session,category}) => {
  try {
    if (!serial_No || !quantity || !r_Date || !name || !category)
      throw new Error("All Fields Required To Delete Stock");
    const checkExistingStock = await AccssoriesModel.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") },
    }).session(session);
    if (checkExistingStock) {
      const updatedTotalQuantity = checkExistingStock.totalQuantity - quantity;
      if(updatedTotalQuantity < 0){
        throw new Error(`Not Enough ${category}  In Stock`);
      }
        (checkExistingStock.totalQuantity = updatedTotalQuantity),
        checkExistingStock.all_Records = checkExistingStock.all_Records.filter((record) => record?.bill_id?.toString() !== billId)
      await checkExistingStock.save({session});
    } else {
      throw new Error("Accessories Stock Not Found")
    }
    return { message: "Stock Successfully Deleted" };
  } catch (error) {
    return { error: error.message };
  }
};

export const getAllAccesoriesInStock = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let search = req.query.search || "";
 
    let query = {
      name: { $regex: search, $options: "i" },
      
    };
  
 
    const data = await AccssoriesModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

  
 
    const total = await AccssoriesModel.countDocuments(query);
 
    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totatAccssories:total,
      totalRecords: total,
      data
    };
    setMongoose();
    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateAllAccesoriesInStock = async (req, res, next) => {
  try {
    const { id, quantity, date, note } = req.body;
    if (!id) throw new Error("Id required");
    const record = await AccssoriesModel.findById(id);
    if (!record) throw new Error("Record not found");
    if(record.totalQuantity <= 0 || quantity > record.totalQuantity ) throw new Error("Stock Amount Error")
    const updatedTotalQuantity = record.totalQuantity - quantity;
    await AccssoriesModel.updateOne(
      { _id: id },
      { totalQuantity: updatedTotalQuantity }
    );

    let Data = { note, quantityRemoved: quantity, date, name:record.name };
    record.accessoriesUsed_Records.push(Data);
    await record.save();
    return res.status(200).json({ message: "Update Successfull" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
