
const DeleteModal = ({ onClose, onConfirm, message, title, Loading}) => {

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4 px-3 w-[95%] max-w-lg bg-white rounded-md shadow dark:bg-gray-700">
        <div className="flex items-center justify-center p-4 border-b dark:border-gray-600">
          <h3 className="text-xl font-semibold text-red-600">
            {title}
          </h3>
        </div>
        <div className="p-4">
          <p className="text-gray-700 text-center dark:text-gray-300">{message}</p>
        </div>
        <div className="flex justify-center p-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white mr-2"
          >
            Cancel
          </button>
        {Loading ? <button
           disabled
            className="px-4 py-2.5 cursor-not-allowed text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
          >
            Confirm
          </button> 
          :
           <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
          >
            Confirm
          </button>}
        </div>


        <div className="button_box absolute top-6 right-6">
          <button
            onClick={onClose}
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
      </div>
    </div>
  );
};

export default DeleteModal;
