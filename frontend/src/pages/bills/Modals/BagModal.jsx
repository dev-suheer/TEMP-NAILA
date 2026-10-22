import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AddOldSellerDetailsFromAsync, AddSellerDetailsFromAsync, getAllPurchasingHistoryAsync } from "../../../features/SellerSlice";
import { RxCross2 } from "react-icons/rx";
import { FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import StatusChip from "../../../Component/Common/StatusChip";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const FieldLabel = ({ label, children }) => (
  <label className="block w-full">
    <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
      {label}
    </span>
    {children}
  </label>
);

const BagModal = ({ isOpen, closeModal, sellerDetails }) => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { addSellerLoading } = useSelector((state) => state.Seller);
  const initialRow = { category: "", roleQuantity: "", measurement: 1, rate: "" };
  const [itemRows, setItemRows] = useState([initialRow]);


  // State variables to hold form data
  const [formData, setFormData] = useState({
    bill_no: "",
    date: "",
    name: "",
    phone: "",
    category: "",
    quantity: "",
    rate: "",
    total: "",
    subTotal: "",
    discountType: "RS",
    discount: "",
    seller_stock_category: "Bag/box",
  });

  useEffect(() => {
    if (!isOpen) {
      resetFormData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (sellerDetails) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        name: sellerDetails.name || "",
        phone: sellerDetails.phone || "",
      }));
    }
  }, [sellerDetails]);


  // Function to handle changes in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "rate" || name === "category") {
      setItemRows((prev) =>
        prev.map((row) => ({
          ...row,
          ...(name === "rate" &&
          (row.rate === "" || Number(row.rate) === Number(formData.rate))
            ? { rate: value }
            : {}),
          ...(name === "category" &&
          (row.category === "" || row.category === formData.category)
            ? { category: value }
            : {}),
        }))
      );
    }
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };




  const handleSubmit = (e) => {
    e.preventDefault();
    const rowsWithTotals = getRowsWithTotals(itemRows);

    const modifiedFormData = {
      ...formData,
      total: Number(formData.total),
      rate: Number(formData.rate),
      quantity: Number(formData.quantity),
      bill_no: Number(formData.bill_no),
      seller_stock_category: "Bag/box",
      measurementData: rowsWithTotals,
    };

    if (sellerDetails && sellerDetails?.id) {
      modifiedFormData.sellerId = sellerDetails?.id;
    }

    if (
      !areRowsComplete() ||
      modifiedFormData.quantity === 0 ||
      modifiedFormData.subTotal === 0 ||
      modifiedFormData.total === 0
    ) {
      return toast.error("Please Fill all required fields");
    }

    if (sellerDetails) {
      dispatch(AddOldSellerDetailsFromAsync(modifiedFormData)).then((res) => {
        if (res.payload.success === true) {
          dispatch(getAllPurchasingHistoryAsync({ category: 'Bag/box', page }));
          resetFormData();
          closeModal();
        }
      });
    } else {
      dispatch(AddSellerDetailsFromAsync(modifiedFormData)).then((res) => {
        if (res.payload.success === true) {
          dispatch(getAllPurchasingHistoryAsync({ category: 'Bag/box', page }));
          resetFormData();
          closeModal();
        }
      });
    }
  };

  const resetFormData = () => {
    setFormData({
      bill_no: "",
      date: "",
      name: "",
      phone: "",
      category: "",
      quantity: "",
      rate: "",
      total: "",
      subTotal: "",
      discountType: "RS",
      discount: "",
      seller_stock_category: "",
    });
    setItemRows([initialRow]);
  };

  const validateValue = (value) => {
    return value === undefined || value === null || isNaN(value) || value === ""
      ? 0
      : Number(value);
  };

  const getRowsWithTotals = (rows) =>
    rows.map((row) => {
      const roleQuantity = validateValue(row.roleQuantity);
      const measurement = 1;
      const rate = validateValue(row.rate);
      const rowQuantity = roleQuantity * measurement;
      const rowTotal = rowQuantity * rate;
      return { ...row, roleQuantity, measurement, rate, rowQuantity, rowTotal };
    });

  useEffect(() => {
    const rowsWithTotals = getRowsWithTotals(itemRows);
    const updatedQuantity = rowsWithTotals.reduce(
      (sum, row) => sum + row.rowQuantity,
      0
    );
    const updatedsubtotal = rowsWithTotals.reduce(
      (sum, row) => sum + row.rowTotal,
      0
    );
    const discount =
      formData.discountType === "%"
        ? (updatedsubtotal * validateValue(formData.discount)) / 100 || 0
        : validateValue(formData.discount) || 0;
    const total = updatedsubtotal - discount;
    setFormData((prevState) => ({
      ...prevState,
      quantity: updatedQuantity,
      subTotal: updatedsubtotal,
      total: total,
    }));
  }, [
    itemRows,
    formData.discount,
    formData.discountType,
  ]);

  const handleRowChange = (e, index) => {
    const { name, value } = e.target;
    setItemRows((prev) => {
      const updatedRows = [...prev];
      updatedRows[index] = {
        ...updatedRows[index],
        [name]:
          name === "roleQuantity" || name === "rate"
            ? value === ""
              ? ""
              : Number(value)
            : value,
      };
      return updatedRows;
    });
  };

  const addRow = () => {
    setItemRows((prev) => [
      ...prev,
      { ...initialRow, category: formData.category, rate: formData.rate },
    ]);
  };

  const deleteRow = (index) => {
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const areRowsComplete = () =>
    itemRows.length > 0 &&
    itemRows.every(
      (row) =>
        row.category?.trim() &&
        validateValue(row.roleQuantity) > 0 &&
        validateValue(row.rate) > 0
    );

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bag / Box
              </h3>
              <button
                onClick={closeModal}
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

               {/* ACCOUNT DATA */}
               <>
                  {sellerDetails && sellerDetails?.virtual_account && (
                    <div className=" px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 rounded-lg text-gray-900 dark:text-gray-100  dark:border-gray-600">
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal">Total Debit</h3>
                        <h3>{sellerDetails?.virtual_account?.total_debit || 0}</h3>
                      </div>
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal">Total Credit</h3>
                        <h3>{sellerDetails?.virtual_account?.total_credit || 0}</h3>
                      </div>
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal ">Total Balance</h3>
                        <h3>{sellerDetails?.virtual_account?.total_balance || 0}</h3>
                      </div>
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal ">Status</h3>
                        <h3>
                          <StatusChip status={sellerDetails?.virtual_account?.status} />
                        </h3>
                      </div>
                    </div>
                  )}
                </>
            

            {/* ------------- BODY ------------- */}
            <div className="p-4 md:p-5">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-x-4">

                  {/* BILL */}
                  <FieldLabel label="Bill No">
                    <input
                      name="bill_no"
                      type="text"
                      placeholder="Bill No"
                      value={formData.bill_no}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </FieldLabel>

                

                  {/* PARTY NAME */}
                  <FieldLabel label="Party Name">
                    <input
                      name="name"
                      type="text"
                      placeholder="Party Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                      readOnly={!!sellerDetails}
                    />
                  </FieldLabel>

                    {/* PHONE NUMBER */}
                    <FieldLabel label="Phone Number">
                    <input
                      name="phone"
                      type="number"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                      readOnly={!!sellerDetails}
                    />
                  </FieldLabel>

                  {/* CATEGORY */}
                  <FieldLabel label="Bags / Boxes">
                    <input
                      name="category"
                      type="text"
                      placeholder="Bags / Boxes"
                      value={formData.category}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </FieldLabel>

                  {/* RATE */}
                  <FieldLabel label="Rate">
                    <input
                      name="rate"
                      type="number"
                      placeholder="Rate"
                      value={formData.rate}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </FieldLabel>
                </div>

                <div className="mt-12 mb-4 relative py-4 gap-4 border-t border-b">
                  <button
                    type="button"
                    className="absolute -top-7 right-2 text-black"
                    onClick={addRow}
                  >
                    <FaPlus size={18} />
                  </button>

                  {itemRows.map((row, index) => (
                    <div key={index} className="grid py-2 grid-cols-3 gap-4">
                      <FieldLabel label="Category">
                        <input
                          name="category"
                          type="text"
                          placeholder="Category"
                          value={row.category}
                          onChange={(e) => handleRowChange(e, index)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                      </FieldLabel>
                      <FieldLabel label="Quantity">
                        <input
                          name="roleQuantity"
                          type="number"
                          placeholder="Quantity"
                          value={row.roleQuantity}
                          onChange={(e) => handleRowChange(e, index)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                      </FieldLabel>
                      <div className="flex items-center justify-center gap-4">
                        <FieldLabel label="Price">
                          <input
                            name="rate"
                            type="number"
                            placeholder="Price"
                            value={row.rate}
                            onChange={(e) => handleRowChange(e, index)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            required
                          />
                        </FieldLabel>
                        {itemRows.length > 1 && (
                          <button type="button" onClick={() => deleteRow(index)}>
                            <RxCross2
                              size={24}
                              className="text-red-500 flex-shrink-0"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-x-4">

               {/* DATE */}
                  <FieldLabel label="Date">
                    <input
                      name="date"
                      type="date"
                      placeholder="Date"
                      value={formData.date}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </FieldLabel> 

                  {/* QUANTITY */}
                  <FieldLabel label="Total Quantity">
                    <input
                      name="quantity"
                      type="number"
                      placeholder="Total Quantity"
                      value={formData.quantity}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                      readOnly
                    />
                  </FieldLabel>

                  {/* SUB-TOTAL */}
                  <FieldLabel label="Sub Total">
                    <input
                      name="subTotal"
                      type="number"
                      placeholder="SubTotal"
                      value={formData.subTotal}
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    />
                  </FieldLabel>

                  {/* Discount */}
                  <FieldLabel label="Discount">
                    <div className="flex-1">
                      <div className="flex">
                        <input
                          name="discount"
                          type="number"
                          placeholder="Discount"
                          value={formData.discount}
                          onChange={handleChange}
                          className="bg-gray-50 border rounded-tl-md rounded-bl-md border-gray-300 text-gray-900 text-sm  focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
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
                    </div>
                  </FieldLabel>

                  {/* TOTAL */}
                  <FieldLabel label="Total">
                    <input
                      name="total"
                      type="number"
                      placeholder={`Total`}
                      value={formData.total}
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    />
                  </FieldLabel>
                

                </div>

                <div className="flex justify-center mt-6">
                  {addSellerLoading ? (
                    <button disabled type="button" className="text-white cursor-not-allowed border-gray-600 bg-gray-600 focus:ring-0 focus:outline-none font-medium rounded text-sm px-5 py-3 text-center mr-2  inline-flex items-center gap-2">
                      <ButtonSpinner />
                      Submit
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-0 active:text-indgrayigo-500"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BagModal;
