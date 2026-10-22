import  { useState, useEffect } from "react";
import AppSelect from "../Common/select/AppSelect";
import {
  CreateEmbroidery,
  GETEmbroidery,
} from "../../features/EmbroiderySlice";
import { FiPlus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { getPageLimit } from "../../Utils/Common";
import { RxCross2 } from "react-icons/rx";
import ButtonSpinner from "../Common/button/ButtonSpinner";

const Box = ({ formData1, setFormData1, closeModal, total, DNO_ategory,partyValue,D_NO }) => {
  const { loading, BaseforEmroidery } = useSelector((state) => state.InStock);
  const {createEmbroideryLoading} = useSelector((state) => state.Embroidery);

  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const limit = getPageLimit(searchParams);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [colorOptions2, setColorOptions2] = useState([]);
  const [colorOptions3, setColorOptions3] = useState([]);
  const [colorOptions4, setColorOptions4] = useState([]);

  useEffect(() => {
    if (!loading && BaseforEmroidery) {
      // Extract unique categories
      const categories = [
        ...new Set(BaseforEmroidery?.map((item) => item.category)),
      ];
      const categoryOptions = categories?.map((category) => ({
        value: category,
        label: category,
      }));
      setCategoryOptions(categoryOptions);
    }
  }, [loading, BaseforEmroidery]);

  const initialShirtRow = {
    category: "",
    color: "",
    quantity_in_no: 0,
    quantity_in_m: 0,
  };
  const initialDupattaRow = {
    category: "",
    color: "",
    quantity_in_no: 0,
    quantity_in_m: 0,
  };
  const initialTrouserRow = {
    category: "",
    color: "",
    quantity_in_no: 0,
    quantity_in_m: 0,
  };
  const initialTissueRow = { category: "", color: "", quantity_in_m: 0 };
  const [formData, setFormData] = useState({
    shirt: [initialShirtRow],
    duppata: [initialDupattaRow],
    trouser: [initialTrouserRow],
    tissue: [initialTissueRow],
  });

  const addNewRow = (field) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: [
        ...prevState[field],
        field === "shirt"
          ? initialShirtRow
          : field === "duppata"
          ? initialDupattaRow
          : field === "trouser"
          ? initialTrouserRow
          : initialTissueRow,
      ],
    }));
  };

  const deleteRow = (field, index) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: prevState[field].filter((_, idx) => idx !== index),
    }));
  };

  const duplicateRow = (field, index) => {
    setFormData((prevState) => {
      const currentRows = prevState[field] || [];
      const rowToDuplicate = currentRows[index];
      return {
        ...prevState,
        [field]: [
          ...currentRows.slice(0, index + 1),
          { ...rowToDuplicate },
          ...currentRows.slice(index + 1),
        ],
      };
    });
  };

  const renderRowActions = (field, index) => (
    <div className="flex items-center">
      <FiPlus
        onClick={() => duplicateRow(field, index)}
        className="text-gray-900 cursor-pointer"
        size={20}
      />

      {formData?.[field]?.length > 1 && (
        <div>
          <RxCross2
            onClick={() => deleteRow(field, index)}
            size={20}
            className="text-red-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );

  const handleInputChange = (e, index, type) => {
    const { name, value } = e.target;
    setFormData((prevState) => {
      const updatedArray = prevState[type]?.map((item, idx) =>
        idx === index
          ? { ...item, [name.split(".")[1]]: parseFloat(value) }
          : item
      );
      return { ...prevState, [type]: updatedArray };
    });
  };

  const handleshirtCategory = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      shirt: prevState.shirt?.map((item, idx) =>
        idx === index ? { ...item, category: newValue.value } : item
      ),
    }));

    // Perform a case-insensitive comparison
    const selectedCategory = BaseforEmroidery.filter(
      (item) => item.category.toLowerCase() === newValue.value.toLowerCase()
    );

    const selectedCategoryColors = selectedCategory?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));

    setColorOptions(selectedCategoryColors);
  };

  const handleshirtColor = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      shirt: prevState.shirt?.map((item, idx) =>
        idx === index ? { ...item, color: newValue.value } : item
      ),
    }));
  };

  const handleduppataCategorey = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      duppata: prevState.duppata?.map((item, idx) =>
        idx === index ? { ...item, category: newValue.value } : item
      ),
    }));
    const selectedCategory = BaseforEmroidery?.filter(
      (item) => item.category.toLowerCase() === newValue.value.toLowerCase()
    );

    const selectedCategoryColors = selectedCategory?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));

    setColorOptions2(selectedCategoryColors);
  };

  const handleduppataColor = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      duppata: prevState.duppata?.map((item, idx) =>
        idx === index ? { ...item, color: newValue.value } : item
      ),
    }));
  };

  const handleTrouserCategorey = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      trouser: prevState.trouser?.map((item, idx) =>
        idx === index ? { ...item, category: newValue.value } : item
      ),
    }));
    const selectedCategory = BaseforEmroidery?.filter(
      (item) => item.category.toLowerCase() === newValue.value.toLowerCase()
    );

    const selectedCategoryColors = selectedCategory?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));

    setColorOptions3(selectedCategoryColors);
  };

  const handleTrouserColor = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      trouser: prevState.trouser?.map((item, idx) =>
        idx === index ? { ...item, color: newValue.value } : item
      ),
    }));
  };

  const handletissueCategorey = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      tissue: prevState.tissue?.map((item, idx) =>
        idx === index ? { ...item, category: newValue.value } : item
      ),
    }));
    const selectedCategory = BaseforEmroidery?.filter(
      (item) => item.category.toLowerCase() === newValue.value.toLowerCase()
    );

    const selectedCategoryColors = selectedCategory?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));

    setColorOptions4(selectedCategoryColors);
  };

  const handletissueColor = (newValue, index) => {
    setFormData((prevState) => ({
      ...prevState,
      tissue: prevState.tissue?.map((item, idx) =>
        idx === index ? { ...item, color: newValue.value } : item
      ),
    }));
  };

  //REMOVE EIGHT FIELDS
  const validateEightFields = (data) => {
    for (let key in data) {
      if (data[key]?.head === 0 && data[key]?.value === 0) {
        delete data[key];
      }
    }
    return data;
  };

  //VALIDATE SUTIT DUPATTA TROUSER TISSUE DATA
  const validateData = (meregdata) => {
    const categories = ["shirt", "duppata", "trouser"];
    categories.forEach((category) => {
      if (meregdata[category] && meregdata[category].length >= 0) {
        meregdata[category] = meregdata[category].filter((item) => {
          return !(
            item.category === "" &&
            item.color === "" &&
            (item.quantity_in_m === 0 || isNaN(item.quantity_in_m)) &&
            (item.quantity_in_no === 0 || isNaN(item.quantity_in_no))
          );
        });
        if (meregdata[category].length === 0) {
          delete meregdata[category];
        }
      } else if (meregdata[category].length === 0) {
        delete meregdata[category];
      }
    });
  };

  //VALIDATE TISSUE DATA
  const validateTissueData = (meregdata) => {
    if (meregdata.tissue.length >= 0) {
      meregdata.tissue = meregdata.tissue.filter((item) => {
        return !(
          item.category === "" &&
          item.color === "" &&
          item.quantity_in_m === 0
        );
      });
      if (meregdata.tissue.length === 0) {
        delete meregdata.tissue;
      }
    } else if (meregdata.tissue.length === 0) {
      delete meregdata.tissue;
    }
  };

  const validateShirtCategories = (meregdata) => {
    if (meregdata.shirt && meregdata.shirt.length > 0) {
      const invalidCategory = meregdata.shirt.some(item => item.category !== DNO_ategory);
      if (invalidCategory) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setFormData1((prevState) => ({
      ...prevState,
      per_suit: total,
    }));

    //REMOVING FIELDS FROM TABLE WITH ZERO VALUES

    let updateFormData = { ...formData1 };
    updateFormData = validateEightFields(updateFormData);
    const { per_suit, ...restFormData1 } = updateFormData;

    const toValidNumber = (value) => {
      return isNaN(value) || value === undefined || value === null
        ? 0
        : Number(value);
    };

    const meregdata = {
      ...restFormData1,
      ...formData,
      partytype:partyValue,
      per_suit: Math.floor(total),
      T_Suit: formData.shirt.reduce(
        (total, item) => total + toValidNumber(item.quantity_in_no),
        0
      ),

      T_Quantity:
        formData.shirt.reduce(
          (total, item) => total + toValidNumber(item.quantity_in_no),
          0
        ) +
        formData.duppata.reduce(
          (total, item) => total + toValidNumber(item.quantity_in_no),
          0
        ) +
        formData.trouser.reduce(
          (total, item) => total + toValidNumber(item.quantity_in_no),
          0
        ),

      // Safely sum quantity_in_m for each category
      T_Quantity_In_m:
        formData.shirt.reduce(
          (total, item) => total + toValidNumber(item.quantity_in_m),
          0
        ) +
        formData.duppata.reduce(
          (total, item) => total + toValidNumber(item.quantity_in_m),
          0
        ) +
        formData.trouser.reduce(
          (total, item) => total + toValidNumber(item.quantity_in_m),
          0
        ),
    };

    validateData(meregdata);
    validateTissueData(meregdata);
    const hasValidShirt = meregdata.shirt?.some(
      (item) =>
        item.category &&
        item.color &&
        Number(item.quantity_in_no) > 0 &&
        Number(item.quantity_in_m) > 0
    );
    const suitFields = [meregdata.shirt, meregdata.duppata, meregdata.trouser];
    const stitchFields = [
      meregdata.Front_Stitch,
      meregdata.Bazo_Stitch,
      meregdata.Gala_Stitch,
      meregdata.Back_Stitch,
      meregdata.Pallu_Stitch,
      meregdata.Trouser_Stitch,
      meregdata.D_Patch_Stitch,
      meregdata.F_Patch_Stitch,
    ];
    if (!hasValidShirt) {
      toast.error("Please enter shirt category, color and quantity");
    } else if (
      suitFields.every((field) => !field) ||
      stitchFields.every((field) => !field)
    ) {
      toast.error(
        "Please Enter data for suit,duppata or trouser and one head and it's value"
      );
    } else {
      if(meregdata.design_no === D_NO){
        const result = validateShirtCategories(meregdata);
        if(!result) return toast.error("Invalid Shirt Category For Selected Design Number");
      };
      dispatch(CreateEmbroidery(meregdata)).then((res) => {
        if (res.payload.success === true) {
          dispatch(GETEmbroidery({ page: 1, limit }));
          closeModal();
        }
      });
    }
  };

  return (
    <div>
      <div className="box">
        <div className="header flex flex-wrap justify-between items-center gap-3">
          <p className="mt-3 text-gray-700  dark:text-white">
            Enter Shirt Colors And Quantity:{" "}
           {formData1.design_no === D_NO && <span className="text-red-500">{DNO_ategory}</span>}
          </p>
          <p onClick={() => addNewRow("shirt")}>
            <FiPlus size={24} className=" cursor-pointer dark:text-white" />
          </p>
        </div>
        {formData?.shirt?.map((shirt, index) => (
          <div
            className="mt-3 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
            key={index}
          >
            <div>
              <AppSelect className="w-full"
                options={categoryOptions}
                onChange={(newValue) => handleshirtCategory(newValue, index)}
                value={categoryOptions.find(
                  (item) => item.value === shirt.category
                )}
                placeholder="Select Category"
              />
            </div>
            <div>
              <AppSelect className="w-full"
                options={colorOptions}
                onChange={(newValue) => handleshirtColor(newValue, index)}
                value={colorOptions.find((item) => item.value === shirt.color)}
                placeholder="Select Color"
              />
            </div>
            <div>
              <input
                name="shirt.quantity_in_no"
                type="number"
                placeholder="Enter Quantity In No"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={shirt.quantity_in_no || ""}
                onChange={(e) => handleInputChange(e, index, "shirt")}
              />
            </div>
            <div className="flex items-center">
              <input
                name="shirt.quantity_in_m"
                type="number"
                placeholder="Enter Quantity In M"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={shirt.quantity_in_m || ""}
                onChange={(e) => handleInputChange(e, index, "shirt")}
              />
              {renderRowActions("shirt", index)}
            </div>
          </div>
        ))}

        <div className="header flex flex-wrap justify-between items-center gap-3">
          <p className="mt-3 text-gray-700  dark:text-white">
            Enter Duppta Colors And Quantity :
          </p>
          <p onClick={() => addNewRow("duppata")}>
            <FiPlus size={24} className=" cursor-pointer dark:text-white" />
          </p>
        </div>

        {formData?.duppata?.map((duppata, index) => (
          <div key={index} className="mt-3 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div>
              <AppSelect className="w-full"
                options={categoryOptions}
                onChange={(newValue) => handleduppataCategorey(newValue, index)}
                value={categoryOptions.find(
                  (item) => item.value === duppata.category
                )}
                placeholder="Select Color"
              />
            </div>
            <div>
              <AppSelect className="w-full"
                options={colorOptions2}
                onChange={(newValue) => handleduppataColor(newValue, index)}
                value={colorOptions2.find(
                  (item) => item.value === duppata.color
                )}
                placeholder="Select Color"
              />
            </div>
            <div>
              <input
                name="duppata.quantity_in_no"
                type="number"
                placeholder="Enter Quantity In No"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={duppata.quantity_in_no || ""}
                onChange={(e) => handleInputChange(e, index, "duppata")}
              />
            </div>
            <div className="flex items-center">
              <input
                name="duppata.quantity_in_m"
                type="number"
                placeholder="Enter Quantity In M"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={duppata.quantity_in_m || ""}
                onChange={(e) => handleInputChange(e, index, "duppata")}
              />
              {renderRowActions("duppata", index)}
            </div>
          </div>
        ))}

        <div className="header flex flex-wrap justify-between items-center gap-3">
          <p className="mt-3 text-gray-700  dark:text-white">
            {" "}
            Enter Trousers Colors And Quantity :
          </p>
          <p onClick={() => addNewRow("trouser")}>
            <FiPlus size={24} className=" cursor-pointer dark:text-white" />
          </p>
        </div>

        {formData?.trouser?.map((trouser, index) => (
          <div key={index} className="mt-3 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div>
              <AppSelect className="w-full"
                options={categoryOptions}
                onChange={(newValue) => handleTrouserCategorey(newValue, index)}
                value={categoryOptions.find(
                  (item) => item.value === trouser.category
                )}
                placeholder="Select Category"
              />
            </div>
            <div>
              <AppSelect className="w-full"
                options={colorOptions3}
                onChange={(newValue) => handleTrouserColor(newValue, index)}
                value={colorOptions3.find(
                  (item) => item.value === trouser.color
                )}
                placeholder="Select Color"
              />
            </div>
            <div>
              <input
                name="trouser.quantity_in_no"
                type="number"
                placeholder="Enter Quantity In No"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={trouser.quantity_in_no || ""}
                onChange={(e) => handleInputChange(e, index, "trouser")}
              />
            </div>
            <div className="flex items-center">
              <input
                name="trouser.quantity_in_m"
                type="number"
                placeholder="Enter Quantity In M"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={trouser.quantity_in_m || ""}
                onChange={(e) => handleInputChange(e, index, "trouser")}
              />

              {renderRowActions("trouser", index)}
            </div>
          </div>
        ))}

        <div className="header flex flex-wrap justify-between items-center gap-3">
          <p className="mt-3 text-gray-700  dark:text-white">
            {" "}
            Enter Tissue Colors And Quantity :
          </p>

          <p onClick={() => addNewRow("tissue")}>
            <FiPlus size={24} className=" cursor-pointer dark:text-white" />
          </p>
        </div>

        {formData?.tissue?.map((tissue, index) => (
          <div
            key={index}
            className="mt-3 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          >
            <div>
              <AppSelect className="w-full"
                options={categoryOptions}
                onChange={(newValue) => handletissueCategorey(newValue, index)}
                value={categoryOptions.find(
                  (option) => option.value === tissue.category
                )}
                placeholder="Select Category"
              />
            </div>
            <div>
              <AppSelect className="w-full"
                options={colorOptions4}
                onChange={(newValue) => handletissueColor(newValue, index)}
                value={colorOptions4.find(
                  (option) => option.value === tissue.color
                )}
                placeholder="Select Color"
              />
            </div>

            <div className="flex items-center">
              <input
                name="tissue.quantity_in_m"
                type="number"
                required
                placeholder="Quantity In M"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                value={tissue.quantity_in_m || ""}
                onChange={(e) => handleInputChange(e, index, "tissue")}
              />
              {renderRowActions("tissue", index)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-6">
        {createEmbroideryLoading ? (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 cursor-progress rounded border border-gray-600 bg-gray-400 px-10 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring active:text-indgrayigo-500"
          >
            <ButtonSpinner />
            Submit
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default Box;
