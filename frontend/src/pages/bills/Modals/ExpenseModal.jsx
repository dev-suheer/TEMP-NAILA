import React, { useState } from "react";
import { CeateExpenseAsync } from "../../../features/PurchaseBillsSlice";
import { useDispatch, useSelector } from "react-redux";
import { GetAllExpense } from "../../../features/InStockSlice";
import moment from "moment-timezone";
import { useSearchParams } from "react-router-dom";
import { getPageLimit } from "../../../Utils/Common";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const ExpenseModal = ({ isOpen, closeModal, ExpenseCategories, selectedCategory, branchId}) => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const limit = getPageLimit(searchParams);
  const { user } = useSelector((state) => state.auth);
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const { expenseLoading } = useSelector((state) => state.PurchaseBills);
  const today = moment.tz("Asia/karachi").format("YYYY-MM-DD");

  // State variables to hold form data
  const [formData, setFormData] = useState({
    branchId: branchId,
    categoryId: "",
    rate: "",
    Date: today,
    reason: "",
    payment_Method: "",
  });

  // Function to handle changes in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const modifiedFormData = {
      ...formData,
      rate: Number(formData.rate),
      serial_no: Number(formData.serial_no),
    };

    dispatch(CeateExpenseAsync(modifiedFormData)).then((res) => {
      if (res.payload.success === true) {
        dispatch(
          GetAllExpense({ branchId: modifiedFormData.branchId, categoryId:selectedCategory, page: 1, limit })
        );
        setFormData({
          branchId: "",
          categoryId: "",
          rate: "",
          Date: today,
          reason: "",
          payment_Method: "",
        });
        closeModal();
      }
    });
  };


  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Expense
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

            {/* ------------- BODY ------------- */}
            <div className="p-4 md:p-5">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-4">
                  {/* NAME */}
                  <div>
                    <ThemedSelect className="w-full"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                    >
                      <option disabled value="">
                        Select a category
                      </option>
                      {ExpenseCategories.map((category) => (
                        <option value={category.id}>{category.name}</option>
                      ))}
                    </ThemedSelect>
                  </div>

                  {/* RATE */}
                  <div>
                    <input
                      name="rate"
                      type="number"
                      placeholder="Amount"
                      value={formData.rate}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* REASON */}
                  <div className="col-span-2">
                    <input
                      name="reason"
                      type="text"
                      placeholder="Reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* DATE */}
                  {user?.user?.role === "superadmin" ? (
                    <div>
                      <input
                        name="Date"
                        type="Date"
                        placeholder="Date"
                        value={formData.Date}
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        name="Date"
                        type="text"
                        placeholder="Date"
                        value={today}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                        readOnly
                      />
                    </div>
                  )}

                  {user?.user?.role === "superadmin" ? (
                    <div>
                      <ThemedSelect className="w-full"
                        id="payment-method"
                        name="payment_Method"
                        value={formData.payment_Method}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_Method: e.target.value,
                          })
                        }
                      >
                        <option value="" disabled>
                          Payment Method
                        </option>
                        {PaymentData?.map((item) => (
                          <option value={item.value} key={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </ThemedSelect>
                    </div>
                  ) : null}
               
                </div>

                <div className="flex justify-center mt-6">
                  {expenseLoading ? (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 rounded border border-gray-600 bg-gray-400 cursor-not-allowed px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                    >
                      <ButtonSpinner />
                      Submit
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
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

export default ExpenseModal;
