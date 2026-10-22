import { IoClose } from "react-icons/io5";
import { Button } from "../../Component/Common/button/Button";

const AccountDiscountModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  loading,
}) => {
  if (!isOpen) return null;

  const isSubmitDisabled =
    !Number(formData.amount) || !formData.reason.trim();

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4 px-3 w-[95%] max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Discount details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            type="button"
          >
            <IoClose size={22} />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <div className="p-4 md:p-5">
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <input
                name="amount"
                type="number"
                min="1"
                placeholder="Discount Amount"
                value={formData.amount}
                onChange={onChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
              />
              <input
                name="reason"
                type="text"
                placeholder="Discount Reason"
                value={formData.reason}
                onChange={onChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </div>

            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={isSubmitDisabled}
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountDiscountModal;
