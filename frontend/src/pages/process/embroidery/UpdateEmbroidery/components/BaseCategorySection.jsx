import { useState, useEffect } from "react";
import AppSelect from "../../../../../Component/Common/select/AppSelect";
import { FiPlus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  GETEmbroiderySIngle,
  markEmbroideryAsVerifiedAsync,
  replaceEmbroideryDataAsync,
} from "../../../../../features/EmbroiderySlice";
import { Button } from "../../../../../Component/Common/button/Button";

const BaseCategorySection = ({
  designNumberSectionData,
  DNO_ategory,
  D_NO,
}) => {
  const dispatch = useDispatch();
  const { loading, BaseforEmroidery } = useSelector((state) => state.InStock);
  const { UpdatEmbroideryloading,markVerifiedLoading } = useSelector((state) => state.Embroidery);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [colorOptions2, setColorOptions2] = useState([]);
  const [colorOptions3, setColorOptions3] = useState([]);
  const [colorOptions4, setColorOptions4] = useState([]);
  const total = designNumberSectionData?.total;

  useEffect(() => {
    if (!loading && BaseforEmroidery) {
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

  useEffect(() => {
    setFormData(() => ({
      shirt: designNumberSectionData?.shirt,
      duppata: designNumberSectionData?.duppata,
      trouser: designNumberSectionData?.trouser,
      tissue: designNumberSectionData?.tissueData,
    }));

    //SET SHIRT COLORS
    const selectedCategory = BaseforEmroidery.filter(
      (item) => item.category.toLowerCase() === DNO_ategory.toLowerCase()
    );
    const selectedCategoryColors = selectedCategory?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));
    setColorOptions(selectedCategoryColors);

    
    //SET DUPATTA COLORS
     if (designNumberSectionData?.duppata?.length > 0) {
    const selectedCategoryForDupatta = BaseforEmroidery.filter(
      (item) => item.category.toLowerCase() === designNumberSectionData?.duppata[0]?.category?.toLowerCase()
    );
    const selectedCategoryColorsForDupatta = selectedCategoryForDupatta?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));
    setColorOptions2(selectedCategoryColorsForDupatta);
      }

    //SET TROUSER COLORS
     if (designNumberSectionData?.trouser?.length > 0) {
    const selectedCategoryForTrouser = BaseforEmroidery.filter(
      (item) => item.category.toLowerCase() === designNumberSectionData?.trouser[0]?.category?.toLowerCase()
    );
    const selectedCategoryColorsForTrouser = selectedCategoryForTrouser?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));
    setColorOptions3(selectedCategoryColorsForTrouser);
      }

    //SET TISSUE COLORS
     if (designNumberSectionData?.tissueData?.length > 0) {
    const selectedcategoryForTissue = BaseforEmroidery.filter(
      (item) => item.category.toLowerCase() === designNumberSectionData?.tissueData[0]?.category?.toLowerCase()
    );
    const selectedCategoryColorsForTissue = selectedcategoryForTissue?.map((item) => ({
      value: item.colors,
      label: item.colors,
    }));
    setColorOptions4(selectedCategoryColorsForTissue);
      }
    
  }, [designNumberSectionData,BaseforEmroidery]);

 
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
        idx === index ? { ...item, category: newValue.value, color: "" } : item
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
        idx === index ? { ...item, category: newValue.value, color: "" } : item
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
        idx === index ? { ...item, category: newValue.value, color: "" } : item
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
        idx === index ? { ...item, category: newValue.value, color: "" } : item
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
      const invalidCategory = meregdata.shirt.some(
        (item) => item.category !== DNO_ategory
      );
      if (invalidCategory) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    //REMOVING FIELDS FROM TABLE WITH ZERO VALUES

    let updateFormData = { ...designNumberSectionData };
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
      partytype: designNumberSectionData.partytype,
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
    if (
      suitFields.every((field) => !field) ||
      stitchFields.every((field) => !field)
    ) {
      toast.error(
        "Please Enter data for suit,duppata or trouser and one head and it's value"
      );
    } else {
      if (meregdata.design_no === D_NO) {
        const result = validateShirtCategories(meregdata);
        if (!result)
          return toast.error(
            "Invalid Shirt Category For Selected Design Number"
          );
      }

      dispatch(replaceEmbroideryDataAsync(meregdata)).then((res) => {
        if (res.payload?.success === true) {
          dispatch(GETEmbroiderySIngle({ id:designNumberSectionData.id }));
        }
      });
    }
  };

    const handleMarkEmbroideryAsVerified = (e) => {
    e.preventDefault();
    dispatch(markEmbroideryAsVerifiedAsync(designNumberSectionData.id)).then((res) => {
      if(res.payload.success) {
         dispatch(GETEmbroiderySIngle({ id:designNumberSectionData.id }));
      }
    })
  }

  return (
    <div>
      <div className="box">
        <div className="header flex flex-wrap justify-between items-center gap-3">
          <p className="mt-3 text-gray-700  dark:text-white">
            Enter Shirt Colors And Quantity:{" "}
            {designNumberSectionData?.design_no === D_NO && (
              <span className="text-red-500">{DNO_ategory}</span>
            )}
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
                key={`${shirt.category}-${index}`}
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
            
                <button
                  onClick={() => deleteRow("shirt", index)}
                  className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 14 14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
            
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
          <div className="mt-3 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
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
                key={`${duppata.category}-${index}`}
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
           
                <button
                  onClick={() => deleteRow("duppata", index)}
                  className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 14 14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              
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
          <div className="mt-3 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
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
                key={`${trouser.category}-${index}`}
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

             
                <button
                  onClick={() => deleteRow("trouser", index)}
                  className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 14 14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              
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
                key={`${tissue.category}-${index}`}
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
            
                <button
                  onClick={() => deleteRow("tissue", index)}
                  className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 14 14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-6">
           <Button onClick={handleSubmit} loading={UpdatEmbroideryloading} className="ml-4" size="lg">
            Update
          </Button>
          <Button  onClick={handleMarkEmbroideryAsVerified} loading={markVerifiedLoading} className="ml-4" size="lg">
                Update Verification Status
          </Button>
      </div>
    </div>
  );
};

export default BaseCategorySection;
