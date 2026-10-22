import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createPaymentMethodAsync,
  getAllPaymentMetodsAsync,
  updatePaymentMethodAsync,
} from "../../features/PaymentMethodsSlice";
import {
  IoAdd,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoClose,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { logoutUserAsync } from "../../features/authSlice";
import { useNavigate } from "react-router-dom";
import Icon from "../../Component/Common/Icons";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
      active
        ? "bg-emerald-50 text-[#009970] dark:bg-emerald-950/30"
        : "bg-red-50 text-red-600 dark:bg-red-950/30"
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full ${
        active ? "bg-[#009970]" : "bg-red-500"
      }`}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

const SummaryCard = ({ label, value, icon: Icon, tone }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone}`}
      >
        <Icon size={20} />
      </span>
    </div>
  </div>
);

const PaymentMethods = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    active: null,
    id:""
  });

  const { loading,updateLoading, AllPaymentMethods } = useSelector(
    (state) => state.PaymentMethods ,
  );

  const totalMethods = AllPaymentMethods?.length || 0;
  const activeMethods =
    AllPaymentMethods?.filter((method) => method?.active).length || 0;
  const inactiveMethods = totalMethods - activeMethods;

  useEffect(() => {
    dispatch(getAllPaymentMetodsAsync());
  }, []);

  const closeModal = () => {
    setOpenModal(null);
  };

  const handleEdit = (data) => {
    setSelectedPaymentMethod(data);
    setFormData({
      name: data.name,
      active: data.active,
      id:data.id
    });
    setOpenModal("update");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(createPaymentMethodAsync({ name: formData.name })).then((res) => {
      if (res.payload?.success) {
        dispatch(logoutUserAsync()).then((res) => {
          if (res.payload.success) {
            navigate("/");
          }
        });
        closeModal();
      }
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedFields = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== selectedPaymentMethod[key]) {
        updatedFields[key] = formData[key];
      }
    });
    if (Object.keys(updatedFields).length === 0) {
      return;
    }
    updatedFields.id = formData.id;
    dispatch(updatePaymentMethodAsync(updatedFields)).then((res) => {
      if (res.payload?.success) {
        dispatch(logoutUserAsync()).then((res) => {
          if (res.payload.success) {
            navigate("/");
          }
        });
        closeModal();
      }
    });
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <div>
            <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
              Payment Methods
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Manage payment accounts available across sales and expenses
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpenModal("create");
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-700 px-4 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none active:text-gray-100"
          >
            <IoAdd size={18} />
            New Payment Method
          </button>
        </div>

        <p className="w-full bg-gray-300 h-px my-5"></p>

        {loading ? (
          <PageLoader />
        ) : (
          <div className="space-y-5 px-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total Methods"
                value={totalMethods}
                icon={IoCardOutline}
                tone="bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
              />
              <SummaryCard
                label="Active"
                value={activeMethods}
                icon={IoCheckmarkCircleOutline}
                tone="bg-emerald-50 text-[#009970] dark:bg-emerald-950/30"
              />
              <SummaryCard
                label="Inactive"
                value={inactiveMethods}
                icon={IoCloseCircleOutline}
                tone="bg-red-50 text-red-600 dark:bg-red-950/30"
              />
            </div>

            {AllPaymentMethods && AllPaymentMethods.length > 0 ? (
              <>
                <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 md:block">
                  <table className="min-w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                      <tr>
                        <th scope="col" className="whitespace-nowrap px-4 py-3">
                          Payment Method
                        </th>
                        <th scope="col" className="whitespace-nowrap px-4 py-3">
                          Status
                        </th>
                        <th
                          scope="col"
                          className="w-24 whitespace-nowrap px-4 py-3 text-right"
                        >
                          Edit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                      {AllPaymentMethods?.map((data, index) => (
                        <tr
                          key={data?.id || index}
                          className="font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-white">
                            {data?.name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge active={data?.active} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleEdit(data)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                              aria-label={`Edit ${data?.name}`}
                            >
                              <Icon name="edit" size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {AllPaymentMethods?.map((data, index) => (
                    <div
                      key={data?.id || index}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-gray-400">
                            Payment Method
                          </p>
                          <h3 className="mt-1 truncate text-base font-semibold text-gray-900 dark:text-white">
                            {data?.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEdit(data)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                          aria-label={`Edit ${data?.name}`}
                        >
                          <Icon name="edit" size={20} />
                        </button>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
                          Status
                        </span>
                        <StatusBadge active={data?.active} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 text-center dark:border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <IoCardOutline size={22} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  No payment methods found
                </h3>
                <p className="mt-2 max-w-sm text-sm font-medium text-gray-500 dark:text-gray-300">
                  Add a payment method to make it available in billing and
                  expense workflows.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal("create");
                  }}
                  className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-700 px-4 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none"
                >
                  <IoAdd size={18} />
                  Add Payment Method
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {openModal === "update" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div
            className="fixed inset-0 bg-gray-800 opacity-75"
            onClick={closeModal}
          ></div>
          <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Update Payment Method
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">
                  Edit name or status for this payment method.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <IoClose size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label
                  htmlFor="updateName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="updateName"
                  placeholder="Enter payment method name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-gray-300 focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Status
                </label>
                <ThemedSelect className="w-full"
                  value={formData.active}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      active: e.target.value === "true",
                    })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </ThemedSelect>
              </div>

              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={updateLoading}
                  onClick={closeModal}
                  className={`h-10 rounded-md px-4 text-sm font-medium ${
                    updateLoading
                      ? "cursor-not-allowed bg-gray-200 text-gray-400"
                      : "cursor-pointer bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className={`inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium text-white ${
                    updateLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "cursor-pointer bg-gray-900 hover:bg-[#3a3a3a]"
                  }`}
                >
                  {updateLoading && <ButtonSpinner />}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openModal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div
            className="fixed inset-0 bg-gray-800 opacity-75"
            onClick={closeModal}
          ></div>
          <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New Payment Method
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">
                  New payment methods require users to sign in again.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <IoClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="branchName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter payment method name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-gray-300 focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                Warning: You will be logged out.
              </div>

              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={updateLoading}
                  onClick={closeModal}
                  className={`h-10 rounded-md px-4 text-sm font-medium ${
                    updateLoading
                      ? "cursor-not-allowed bg-gray-200 text-gray-400"
                      : "cursor-pointer bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className={`inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium text-white ${
                    updateLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "cursor-pointer bg-gray-900 hover:bg-[#3a3a3a]"
                  }`}
                >
                  {updateLoading && <ButtonSpinner />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentMethods;
