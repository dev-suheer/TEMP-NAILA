import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GetAllaccessories, UpdateUsedAccessories } from "../../../features/InStockSlice";
import { useSearchParams } from "react-router-dom";
import { getPageLimit } from "../../../Utils/Common";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const UsedAccessoriesModal = ({ isOpen, closeModal, selectedUsedAccessories }) => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const limit = getPageLimit(searchParams);

    const { UsedAccessoriesLoading } = useSelector((state) => state.InStock);


    const [formData, setFormData] = useState({
        id: selectedUsedAccessories,
        note: "",
        quantity: "",
        date: "",
    });



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        const modifiedFormData = {
            ...formData,
            quantity: Number(formData.quantity),
        };

        dispatch(UpdateUsedAccessories(modifiedFormData)).then((res) => {
            if (res.payload.message === "Update Successfull") {
                dispatch(GetAllaccessories({ page: 1, limit }));
                setFormData({
                    id: "",
                    note: "",
                    quantity: "",
                    date: "",
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
                                Update Used Accessories
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

                                    {/* QUANTITY */}
                                    <div>
                                        <input
                                            name="quantity"
                                            type="number"
                                            placeholder="Quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                            required
                                        />
                                    </div>

                                    {/* DATE */}
                                    <div>
                                        <input
                                            name="date"
                                            type="date"
                                            placeholder="Date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                            required
                                        />
                                    </div>


                                    {/* REASON */}
                                    <div className="col-span-2">
                                        <input
                                            name="note"
                                            type="text"
                                            placeholder="Note"
                                            value={formData.note}
                                            onChange={handleChange}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center mt-6">
                                    {UsedAccessoriesLoading ? (
                                        <button disabled type="button" className="text-white cursor-not-allowed border-gray-300 bg-gray-600 focus:ring-0 focus:outline-none font-medium rounded text-sm px-5 py-3 text-center mr-2  inline-flex items-center gap-2">
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

export default UsedAccessoriesModal;
