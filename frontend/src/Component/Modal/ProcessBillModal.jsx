import React, { useState } from "react";
import ButtonSpinner from "../Common/button/ButtonSpinner";

const ProcessBillModal = ({
  loading,
  closeModal,
  handleSubmit,
  processBillAmount,
  onDataChange,
  Manual_No,
}) => {
  // State variables to hold form data
  const [formData, setFormData] = useState({
    additionalExpenditure: "",
    Manual_No: Manual_No,
  });

  // Function to handle changes in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: name === "additionalExpenditure" ? parseInt(value) : value,
    };
    setFormData(updatedFormData);
    onDataChange(updatedFormData);
  };

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4 px-3 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Additional Process Bill Details
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-x-4">
              {/* Manual_No */}
              <div>
                <label
                  htmlFor="Manual_No"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Manual Number
                </label>
                <input
                  name="Manual_No"
                  type="text"
                  placeholder="Manual No"
                  value={formData.Manual_No}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  required
                  readOnly
                />
              </div>

              {/* Additional Expenditure */}
              <div>
                <label
                  htmlFor="Manual_No"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Additional Cost
                </label>
                <input
                  name="additionalExpenditure"
                  type="number"
                  placeholder="A.E"
                  value={formData.additionalExpenditure}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="Manual_No"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Bill Amount
                </label>
                <input
                  name="processBillAmount"
                  type="text"
                  value={processBillAmount}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  readOnly
                />
              </div>
            </div>

            <div className="flex justify-center mt-6">
              {loading ? (
                <button
                  disabled
                  type="button"
                  className="text-white cursor-not-allowed border-gray-600 bg-gray-600  focus:ring-0 focus:outline-none font-medium rounded text-sm px-5 py-2.5 text-center mr-2  inline-flex items-center gap-2"
                >
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
  );
};

export default ProcessBillModal;
