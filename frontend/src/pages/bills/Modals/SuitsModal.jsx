import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import toast from "react-hot-toast";
import {
  AddOldSellerDetailsFromAsync,
  AddSellerDetailsFromAsync,
  getAllPurchasingHistoryAsync,
} from "../../../features/SellerSlice";
import StatusChip from "../../../Component/Common/StatusChip";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import { STITCH_TYPES } from "../../../Utils/Common";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const emptyDesign = {
  design_no: "",
  category: "",
  colors: [
    {
      color: "",
      stitch_type: STITCH_TYPES.UNSTITCHED,
      quantity: "",
      cost_price: "",
      sale_price: "",
    },
  ],
};

const numberValue = (value) =>
  value === "" || value === null || value === undefined || Number.isNaN(Number(value))
    ? 0
    : Number(value);

const titleCase = (value) => {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const SuitsModal = ({ isOpen, closeModal, sellerDetails }) => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { addSellerLoading } = useSelector((state) => state.Seller);

  const [formData, setFormData] = useState({
    bill_no: "",
    date: "",
    name: "",
    phone: "",
    quantity: 0,
    rate: 0,
    subTotal: 0,
    discountType: "RS",
    discount: "",
    total: 0,
    seller_stock_category: "Suits",
  });
  const [designs, setDesigns] = useState([{ ...emptyDesign }]);

  const rows = useMemo(
    () =>
      designs.flatMap((design) =>
        design.colors.map((item) => {
          const quantity = numberValue(item.quantity);
          const cost_price = numberValue(item.cost_price);
          const sale_price = numberValue(item.sale_price);
          return {
            design_no: numberValue(design.design_no),
            category: titleCase(design.category),
            color: titleCase(item.color),
            stitch_type: item.stitch_type,
            quantity,
            cost_price,
            sale_price,
            rowTotal: quantity * cost_price,
          };
        })
      ),
    [designs]
  );

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    if (sellerDetails) {
      setFormData((prev) => ({
        ...prev,
        name: sellerDetails.name || "",
        phone: sellerDetails.phone || "",
      }));
    }
  }, [sellerDetails]);

  useEffect(() => {
    const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    const subTotal = rows.reduce((sum, row) => sum + row.rowTotal, 0);
    const discount =
      formData.discountType === "%"
        ? (subTotal * numberValue(formData.discount)) / 100 || 0
        : numberValue(formData.discount) || 0;
    const total = Math.max(subTotal - discount, 0);
    setFormData((prev) => ({
      ...prev,
      quantity,
      subTotal,
      total,
      rate: 0,
    }));
  }, [rows, formData.discount, formData.discountType]);

  const resetForm = () => {
    setFormData({
      bill_no: "",
      date: "",
      name: "",
      phone: "",
      quantity: 0,
      rate: 0,
      subTotal: 0,
      discountType: "RS",
      discount: "",
      total: 0,
      seller_stock_category: "Suits",
    });
    setDesigns([{ ...emptyDesign, colors: [{ ...emptyDesign.colors[0] }] }]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateDesign = (index, key, value) => {
    setDesigns((prev) =>
      prev.map((design, designIndex) =>
        designIndex === index ? { ...design, [key]: value } : design
      )
    );
  };

  const updateColor = (designIndex, colorIndex, key, value) => {
    setDesigns((prev) =>
      prev.map((design, currentDesignIndex) => {
        if (currentDesignIndex !== designIndex) return design;
        return {
          ...design,
          colors: design.colors.map((colorRow, currentColorIndex) =>
            currentColorIndex === colorIndex
              ? { ...colorRow, [key]: value }
              : colorRow
          ),
        };
      })
    );
  };

  const addDesign = () => {
    setDesigns((prev) => [
      ...prev,
      { ...emptyDesign, colors: [{ ...emptyDesign.colors[0] }] },
    ]);
  };

  const removeDesign = (index) => {
    setDesigns((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const duplicateColor = (designIndex, colorIndex) => {
    setDesigns((prev) =>
      prev.map((design, currentIndex) => {
        if (currentIndex !== designIndex) return design;
        const sourceRow = design.colors[colorIndex] || emptyDesign.colors[0];
        const duplicateRow = {
          ...sourceRow,
          color: "",
        };
        const updatedColors = [...design.colors];
        updatedColors.splice(colorIndex + 1, 0, duplicateRow);
        return { ...design, colors: updatedColors };
      })
    );
  };

  const removeColor = (designIndex, colorIndex) => {
    setDesigns((prev) =>
      prev.map((design, currentIndex) =>
        currentIndex === designIndex
          ? {
              ...design,
              colors: design.colors.filter((_, index) => index !== colorIndex),
            }
          : design
      )
    );
  };

  const isValid = () => {
    console.log('formData', formData)
    if (!formData.bill_no || !formData.date || !formData.name || !formData.phone) {
      return false;
    }
    const designCategories = new Map();
    return rows.every((row) => {
      if (
        !row.design_no ||
        !row.category ||
        !row.color ||
        row.quantity <= 0 ||
        row.cost_price <= 0 ||
        row.sale_price <= 0
      ) {
        return false;
      }

      const previousCategory = designCategories.get(row.design_no);
      if (previousCategory && previousCategory !== row.category.toLowerCase()) {
        return false;
      }
      designCategories.set(row.design_no, row.category.toLowerCase());
      return true;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid() || formData.total <= 0) {
      return toast.error("Please fill all required suit fields");
    }

    const modifiedFormData = {
      ...formData,
      bill_no: Number(formData.bill_no),
      quantity: Number(formData.quantity),
      rate: 0,
      total: Number(formData.total),
      subTotal: Number(formData.subTotal),
      discount: Number(formData.discount || 0),
      category: "Suits",
      seller_stock_category: "Suits",
      measurementData: rows,
    };

    if (sellerDetails?.id) {
      modifiedFormData.sellerId = sellerDetails.id;
    }

    const action = sellerDetails
      ? AddOldSellerDetailsFromAsync
      : AddSellerDetailsFromAsync;

    dispatch(action(modifiedFormData)).then((res) => {
      if (res.payload?.success === true) {
        dispatch(getAllPurchasingHistoryAsync({ category: "Suits", page }));
        resetForm();
        closeModal();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4 px-3 w-[96%] max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Suits
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            type="button"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        {sellerDetails?.virtual_account && (
          <div className="mx-4 mt-4 px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 rounded-lg text-gray-900 dark:text-gray-100 dark:border-gray-600">
            <div className="box text-center">
              <h3 className="pb-1 font-normal">Total Debit</h3>
              <h3>{sellerDetails.virtual_account.total_debit || 0}</h3>
            </div>
            <div className="box text-center">
              <h3 className="pb-1 font-normal">Total Credit</h3>
              <h3>{sellerDetails.virtual_account.total_credit || 0}</h3>
            </div>
            <div className="box text-center">
              <h3 className="pb-1 font-normal">Total Balance</h3>
              <h3>{sellerDetails.virtual_account.total_balance || 0}</h3>
            </div>
            <div className="box text-center">
              <h3 className="pb-1 font-normal">Status</h3>
              <h3>
                <StatusChip status={sellerDetails.virtual_account.status} />
              </h3>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Bill No
              </span>
              <input
                name="bill_no"
                type="number"
                placeholder="Bill No"
                value={formData.bill_no}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Date
              </span>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Party Name
              </span>
              <input
                name="name"
                type="text"
                placeholder="Party Name"
                value={formData.name}
                onChange={handleChange}
                readOnly={!!sellerDetails}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Phone Number
              </span>
              <input
                name="phone"
                type="number"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                readOnly={!!sellerDetails}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Total Cost
              </span>
              <input
                type="number"
                placeholder="Total Cost"
                value={formData.total}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-8 space-y-5">
            {designs.map((design, designIndex) => (
              <div
                key={`design-${designIndex}`}
                className="border border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                      Design Number
                    </span>
                    <input
                      type="number"
                      placeholder="Design Number"
                      value={design.design_no}
                      onChange={(e) =>
                        updateDesign(designIndex, "design_no", e.target.value)
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                      Category
                    </span>
                    <input
                      type="text"
                      placeholder="Category"
                      value={design.category}
                      onChange={(e) =>
                        updateDesign(designIndex, "category", e.target.value)
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </label>
                  {designs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDesign(designIndex)}
                      title="Remove design"
                    >
                      <RxCross2 size={24} className="text-red-500" />
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {design.colors.map((colorRow, colorIndex) => (
                    <div
                      key={`color-${designIndex}-${colorIndex}`}
                      className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_0.9fr_0.8fr_0.9fr_0.9fr_auto]"
                    >
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                          Color
                        </span>
                        <input
                          type="text"
                          placeholder="Color"
                          value={colorRow.color}
                          onChange={(e) =>
                            updateColor(designIndex, colorIndex, "color", e.target.value)
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                          Type
                        </span>
                        <ThemedSelect
                          className="w-full"
                          value={colorRow.stitch_type}
                          onChange={(e) =>
                            updateColor(designIndex, colorIndex, "stitch_type", e.target.value)
                          }
                        >
                          {Object.values(STITCH_TYPES).map((stitchType) => (
                            <option key={stitchType} value={stitchType}>
                              {stitchType}
                            </option>
                          ))}
                        </ThemedSelect>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                          Quantity
                        </span>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={colorRow.quantity}
                          onChange={(e) =>
                            updateColor(designIndex, colorIndex, "quantity", e.target.value)
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                          Cost Price
                        </span>
                        <input
                          type="number"
                          placeholder="Cost Price"
                          value={colorRow.cost_price}
                          onChange={(e) =>
                            updateColor(designIndex, colorIndex, "cost_price", e.target.value)
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                          Sale Price
                        </span>
                        <input
                          type="number"
                          placeholder="Sale Price"
                          value={colorRow.sale_price}
                          onChange={(e) =>
                            updateColor(designIndex, colorIndex, "sale_price", e.target.value)
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                      </label>
                      <div className="mt-5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateColor(designIndex, colorIndex)}
                          title="Duplicate row"
                        >
                          <FaPlus size={14} />
                        </button>
                        {design.colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColor(designIndex, colorIndex)}
                            title="Remove row"
                          >
                            <RxCross2 size={20} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Total Quantity
              </span>
              <input
                type="number"
                placeholder="Total Quantity"
                value={formData.quantity}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Sub Total
              </span>
              <input
                type="number"
                placeholder="Sub Total"
                value={formData.subTotal}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Discount
              </span>
              <div className="flex">
                <input
                  name="discount"
                  type="number"
                  placeholder="Discount"
                  value={formData.discount}
                  onChange={handleChange}
                  className="bg-gray-50 border rounded-tl-md rounded-bl-md border-gray-300 text-gray-900 text-sm focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                />
                <ThemedSelect variant="suffix" className="w-20 shrink-0"
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                >
                  <option value="RS">RS</option>
                  <option value="%">%</option>
                </ThemedSelect>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-200">
                Total
              </span>
              <input
                type="number"
                placeholder="Total"
                value={formData.total}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </label>
            <button
              type="button"
              onClick={addDesign}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded border border-gray-600 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
            >
              <FaPlus size={12} />
              Design
            </button>
          </div>

          <div className="flex justify-center mt-6">
            <button
              disabled={addSellerLoading}
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded border border-gray-600 bg-gray-600 px-12 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
            >
              {addSellerLoading && <ButtonSpinner />}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuitsModal;
