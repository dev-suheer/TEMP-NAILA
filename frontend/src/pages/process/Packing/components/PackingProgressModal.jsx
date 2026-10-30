/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getOrderPackingProgressAsync,
  getPackingProgressAsync,
} from "../../../../features/PackingSlice";
import Loading from "../../../../Component/Loader/Loading";
import PackingProgressContent from "./PackingProgressContent";
import OrderPackingProgressContent from "./OrderPackingProgressContent";

//PACKING DETAILS OF ONE STEP RECORD (source: { step, id }) OR A WHOLE ORDER (orderId), LOADED WHEN OPENED
const PackingProgressModal = ({ title, source, orderId, onClose }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const request = orderId
      ? getOrderPackingProgressAsync({ embroidery_Id: orderId })
      : getPackingProgressAsync({ source_step: source?.step, source_id: source?.id });
    dispatch(request).then((res) => {
      setData(res.error ? null : res.payload);
      setLoading(false);
    });
  }, [dispatch, orderId, source?.step, source?.id]);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-start justify-between gap-4 p-5 border-b dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Packing</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex shrink-0 justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : !data ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Packing details could not be loaded.
            </p>
          ) : orderId ? (
            <OrderPackingProgressContent progress={data} />
          ) : (
            <PackingProgressContent availability={data} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingProgressModal;
