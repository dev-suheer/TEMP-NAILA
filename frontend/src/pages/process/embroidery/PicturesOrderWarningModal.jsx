import { AiOutlinePicture } from "react-icons/ai";

const PicturesOrderWarningModal = ({ onProceed, onPlaceOrder, onCancel }) => {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative w-[95%] max-w-xl bg-white rounded-md shadow dark:bg-gray-700">
        <div className="flex items-start justify-between gap-4 p-5 border-b dark:border-gray-600">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300">
              <AiOutlinePicture size={24} />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pictures Order Not Found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                This embroidery does not have a pictures order yet.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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

        <div className="p-5">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
            You can add the pictures order now, or continue without
            it.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4 dark:border-gray-600">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onPlaceOrder}
            className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            type="button"
          >
            Add Pictures Order
          </button>
          <button
            onClick={onProceed}
           className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            type="button"
          >
            Proceed Without Pictures Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PicturesOrderWarningModal;
