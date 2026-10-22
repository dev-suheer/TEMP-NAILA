import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPictureOrderByIdAsync,
  updatePictureOrderByIdIdAsync,
} from "../../../features/EmbroiderySlice";
import StatusChip from "../../../Component/Common/StatusChip";

const PicturesOrder = ({ closeModal, id }) => {
  const dispatch = useDispatch();
  const { createPictureOrderLoading, singlePictureOrder } = useSelector(
    (state) => state.Embroidery
  );

  useEffect(() => {
    dispatch(getPictureOrderByIdAsync({ id }));
  }, []);

  const handleMarkAsCompleted = () => {
    dispatch(
      updatePictureOrderByIdIdAsync({
        id: singlePictureOrder.id,
        status: "Completed",
      })
    ).then((res) => {
      if (res.payload.success) {
        closeModal();
      }
    });
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
      >
        {createPictureOrderLoading ? (
          <div className=" flex justify-center items-center">
            <div
              className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="relative py-4 px-3 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pictures Order
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-4">
                {/* DATE */}
                <div>
                  <input
                    name="date"
                    type="text"
                    placeholder="Date"
                    value={singlePictureOrder.date}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    readOnly
                  />
                </div>

                {/* PARTY NAME */}
                <div className="">
                  <input
                    name="name"
                    type="text"
                    placeholder="Party Name"
                    value={singlePictureOrder.partyName}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    readOnly
                  />
                </div>

                {/* QUANTITY */}
                <div>
                  <input
                    name="quantity"
                    type="number"
                    placeholder="Quantity"
                    value={singlePictureOrder.T_Quantity}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    readOnly
                  />
                </div>

                {/* RATE */}
                <div>
                  <input
                    name="rate"
                    type="number"
                    placeholder="Rate"
                    value={singlePictureOrder.rate}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    readOnly
                  />
                </div>

                <div>
                  <span className="font-medium ">Order Status : </span>{" "}
                  <StatusChip status={singlePictureOrder?.status} fallback="" />
                </div>
              </div>

              <div className="flex justify-center mt-6">
                {singlePictureOrder?.status !== "Completed" && (
                  <button
                    onClick={handleMarkAsCompleted}
                    className="inline-block rounded border  bg-green-600 px-12 py-2.5 text-sm font-medium text-white hover:bg-green-400 hover:text-gray-100 focus:outline-none focus:ring-0 active:text-indgrayigo-500"
                  >
                    Mark As Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PicturesOrder;
