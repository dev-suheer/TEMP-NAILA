import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
  createExpenseCategoryAsync,
  DeleteExpenseAsync,
  GetAllExpense,
  getExpenseCategoriesAsync,
  updateExpenseCategoryAsync,
} from "../../../features/InStockSlice";
import { IoAdd } from "react-icons/io5";
import { TbCategory } from "react-icons/tb";
import ExpenseModal from "../../bills/Modals/ExpenseModal";
import { MdOutlineDelete } from "react-icons/md";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import { MdOutlineModeEdit } from "react-icons/md";
import { IoStatsChart } from "react-icons/io5";
import AppSelect from "../../../Component/Common/select/AppSelect";
import Pagination from "../../../Component/Common/Pagination";
import { buildPaginationQuery, getPageLimit } from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const Expense = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const { Branches, deleteLodaing } = useSelector((state) => state.InStock);
  const {
    ExpenseLoading,
    Expense,
    ExpenseCategories,
    ExpenseUpdateLoading,
    ExpenseCategoryLoading,
  } = useSelector((state) => state.InStock);
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);
  const [expenseModal, setexpenseModal] = useState(false);
  const [categoriesModal, setCategoriesModal] = useState("");
  const [confirmationModal, setconfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [expenseCategoryData, setExpenseCategoryData] = useState({
    name: "",
    id: "",
    branches: [],
  });

  const handleTabClick = () => {
    setexpenseModal(!expenseModal);
  };

  useEffect(() => {
    let branchId = "";
    if (user?.user?.role === "superadmin" && Branches.length > 0) {
      branchId = Branches[0]?.id;
    } else {
      branchId = user?.user?.branchId;
    }
    setSelectedBranchId(branchId);
    dispatch(getExpenseCategoriesAsync()).then((res) => {
      const id = res?.payload?.filter((item) =>
        item?.branches?.includes(branchId)
      )[0]?.id;
      setSelectedCategory(id);
    });
  }, [Branches, user]);

  useEffect(() => {
    if (selectedBranchId && selectedCategory) {
      const payload = {
        page,
        limit,
        branchId: selectedBranchId,
        categoryId: selectedCategory,
      };
      dispatch(GetAllExpense(payload));
    }
  }, [dispatch, selectedBranchId, page, limit, selectedCategory]);

  const handleBranchClick = (branchId) => {
    setSelectedBranchId(branchId);
    const id = ExpenseCategories.filter((item) =>
      item?.branches?.includes(branchId)
    )[0]?.id;
    setSelectedCategory(id);
  };

  const closeConfirmationModal = () => {
    setconfirmationModal(false);
    setConfirmationAction(null);
  };

  const handleDeleteExpense = (id) => {
    setconfirmationModal(true);
    const confirmDeletion = () => {
      dispatch(DeleteExpenseAsync({ id })).then((res) => {
        if (res.payload.success) {
          dispatch(GetAllExpense({ branchId: selectedBranchId, page, limit, categoryId: selectedCategory }));
          closeConfirmationModal();
        }
      });
    };
    setConfirmationAction(() => confirmDeletion);
  };

  const openCategoryModal = (data) => {
    setCategoriesModal(data.type);
    if (data.type === "EditExpense") {
      setExpenseCategoryData((prev) => ({
        ...prev,
        name: data.category.name,
        id: data.category.id,
        branches: data.category.branches,
      }));
    }
  };

  const closeCategoryModal = () => {
    setCategoriesModal("");
    setExpenseCategoryData({
      name: "",
      id: "",
    });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (categoriesModal === "AddExpenseCategory") {
      const payload = {
        name: expenseCategoryData.name,
        branches: expenseCategoryData.branches,
      };
      dispatch(createExpenseCategoryAsync(payload)).then((res) => {
        if (res.payload.success) {
          closeCategoryModal();
           dispatch(getExpenseCategoriesAsync())
        }
      });
    } else {
      const payload = {
        name: expenseCategoryData.name,
        id: expenseCategoryData.id,
        branches: expenseCategoryData.branches,
      };
      dispatch(updateExpenseCategoryAsync(payload)).then((res) => {
        if (res.payload.success) {
          closeCategoryModal();
          dispatch(getExpenseCategoriesAsync())
          setExpenseCategoryData({
            name: "",
            id: "",
            branches: [],
          });
        }
      });
    }
  };

  const branchOptions = Branches.map((branch) => ({
    label: branch.branchName,
    value: branch.id,
  }));

  const getBranchName = (branchId) =>
    Branches?.find((branch) => branch.id === branchId)?.branchName || "Unknown";

  const renderBranchChips = (branches = []) => {
    if (!branches.length) {
      return (
        <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
          No branches
        </span>
      );
    }

    return (
      <div className="flex flex-wrap justify-start gap-1.5 md:justify-center">
        {branches.map((branchId) => (
          <span
            key={branchId}
            className="inline-flex max-w-[118px] items-center truncate rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold leading-4 text-gray-700 dark:bg-gray-800 dark:text-gray-200 lg:max-w-[140px]"
            title={getBranchName(branchId)}
          >
            {getBranchName(branchId)}
          </span>
        ))}
      </div>
    );
  };

  const filterdCategories = ExpenseCategories.filter((item) =>
    item?.branches?.includes(selectedBranchId)
  ).sort((a,b) => a.name.localeCompare(b.name));
  const selectedCategoryName =
    filterdCategories.find((category) => category?.id === selectedCategory)
      ?.name || "None";

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        <div className="tabs flex justify-between items-center ">
          <div className="tabs_button flex flex-wrap gap-1">
            {/* CHECK ONLY SUPERADMIN CAN SEE ALL */}
            {user?.user?.role === "superadmin" ? (
              <>
                {Branches?.map((branch) => (
                  <Link
                    to={`/dashboard/expense${buildPaginationQuery(searchParams, { page: 1, limit })}`}
                    key={branch?.id}
                    className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md ${
                      selectedBranchId === branch?.id
                        ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                        : ""
                    }`}
                    onClick={() => handleBranchClick(branch?.id)}
                  >
                    {branch?.branchName}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {/* THIS SHOWS TO ADMIN & USER */}
                {Branches?.map((branch) => (
                  <button
                    disabled
                    className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md cursor-default ${"dark:bg-white bg-gray-700 dark:text-black text-gray-100"}`}
                  >
                    {branch?.branchName}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Expense
          </h1>

          <div className="flex items-center gap-3">
            <Link
              to={"/dashboard/expense-stats"}
              className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
            >
              <IoStatsChart size={22} className="text-white" />
            </Link>
            {user?.user?.role === "superadmin" && (
              <button
                type="button"
                onClick={() => openCategoryModal({ type: "ViewCategories" })}
                className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
              >
                <TbCategory size={22} className="text-white" />
              </button>
            )}

            <button
              type="button"
              onClick={handleTabClick}
              className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
            >
              <IoAdd size={22} className="text-white" />
            </button>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        <>
          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">

            {filterdCategories?.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 rounded-md">
                  {filterdCategories?.map((category) => (
                    <Link
                      to={`/dashboard/expense${buildPaginationQuery(searchParams, { page: 1, limit })}`}
                      key={category?.id}
                      className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm ${
                        selectedCategory === category?.id
                          ? "border-gray-700 bg-gray-700 text-gray-100 dark:bg-white dark:text-black"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedCategory(category?.id)}
                    >
                      {category?.name}
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-4 text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                No categories available for this branch
              </div>
            )}
          </div>

          {/* -------------- TABLE -------------- */}
          {ExpenseLoading ? (
            <PageLoader />
          ) : (
            <div className="relative overflow-x-auto mt-5 ">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Serial No
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Payment Method
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Reason
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Amount
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Date
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Expense?.data?.length > 0 ? (
                    Expense?.data?.map((expense, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {expense?.serial_no}
                        </th>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{expense?.payment_Method}</td>
                        <td className="px-2 py-4 text-xs max-w-48">
                          {expense?.reason}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{expense?.rate}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{expense?.Date}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          <MdOutlineDelete
                            onClick={() => handleDeleteExpense(expense?.id)}
                            size={20}
                            className="cursor-pointer text-red-500"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-3 py-2 md:px-6 md:py-4 text-lg md:text-xl text-start">
                        No Data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      </section>

      <Pagination
        currentPage={page}
        totalPages={Expense?.totalPages}
        totalRecords={Expense?.totalRecords}
        pageSize={limit}
      />

      {/* ADD EXPENSE */}
      {expenseModal && (
        <ExpenseModal
          isOpen={expenseModal}
          closeModal={() => setexpenseModal(false)}
          ExpenseCategories={filterdCategories}
          selectedCategory={selectedCategory}
          branchId={selectedBranchId}
        />
      )}

      {/* CONFIRMATION MODAL */}
      {confirmationModal && (
        <ConfirmationModal
          onClose={closeConfirmationModal}
          onConfirm={confirmationAction}
          message={"Are You Sure Want To Delete This Expense."}
          title={"Delete Expense"}
          updateStitchingLoading={deleteLodaing}
        />
      )}

      {/* CATEGORIES MODAL */}
      {categoriesModal === "ViewCategories" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-gray-800 bg-opacity-50 p-3"
        >
          <div className="relative flex max-h-[70vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900">
            {/* ------------- HEADER ------------- */}
            <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between md:p-5">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Expense Categories
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">
                  Manage category names and assigned branches
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 md:justify-end">
                {user?.user?.role === "superadmin" && (
                  <button
                    type="button"
                    onClick={() =>
                      openCategoryModal({ type: "AddExpenseCategory" })
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-700 px-3 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-0"
                  >
                    <IoAdd size={18} className="text-white" />
                    New Category
                  </button>
                )}
                <button
                  onClick={closeCategoryModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3"
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

            {/* ------------- BODY ------------- */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
              {ExpenseCategoryLoading ? (
                <div className="flex min-h-[45vh] items-center justify-center">
                  <div
                    className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100"
                    role="status"
                    aria-label="loading"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : ExpenseCategories?.length > 0 ? (
                <>
                  <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 md:block">
                    <table className="min-w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                          <th className="w-16 whitespace-nowrap px-4 py-3">
                            #
                          </th>
                          <th className="whitespace-nowrap px-4 py-3">Name</th>
                          <th className="whitespace-nowrap px-3 py-3 text-center">
                            Branches
                          </th>
                          <th className="w-24 whitespace-nowrap px-4 py-3 text-right">
                            Update
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {ExpenseCategories?.map((data, index) => (
                          <tr
                            key={data?.id || index}
                            className="bg-white font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <td className="whitespace-nowrap px-4 py-4">
                              {index + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-white">
                              {data?.name}
                            </td>
                            <td className="px-3 py-3">
                              {renderBranchChips(data?.branches)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openCategoryModal({
                                    type: "EditExpense",
                                    category: data,
                                  })
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                aria-label={`Edit ${data?.name}`}
                              >
                                <MdOutlineModeEdit size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {ExpenseCategories?.map((data, index) => (
                      <div
                        key={data?.id || index}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase text-gray-400">
                              Category #{index + 1}
                            </p>
                            <h4 className="mt-1 truncate text-base font-semibold text-gray-900 dark:text-white">
                              {data?.name}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              openCategoryModal({
                                type: "EditExpense",
                                category: data,
                              })
                            }
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                            aria-label={`Edit ${data?.name}`}
                          >
                            <MdOutlineModeEdit size={20} />
                          </button>
                        </div>
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                            Branches
                          </p>
                          {renderBranchChips(data?.branches)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 text-center dark:border-gray-700">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    No expense categories found
                  </h4>
                  <p className="mt-2 max-w-sm text-sm font-medium text-gray-500 dark:text-gray-300">
                    Create a category to start organizing expense records by branch.
                  </p>
                  {user?.user?.role === "superadmin" && (
                    <button
                      type="button"
                      onClick={() =>
                        openCategoryModal({ type: "AddExpenseCategory" })
                      }
                      className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-700 px-4 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-0"
                    >
                      <IoAdd size={18} />
                      New Category
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD OR UPDATE CATEGORIES */}
      {(categoriesModal === "AddExpenseCategory" ||
        categoriesModal === "EditExpense") && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-3">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {categoriesModal === "AddExpenseCategory"
                ? "Add Expense Category"
                : "Edit Category"}
            </h2>
            <input
              type="text"
              value={expenseCategoryData.name}
              onChange={(e) =>
                setExpenseCategoryData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              placeholder="Enter category name"
            />
            <div className="mt-3 custom-reactSelect">
              <AppSelect className="w-full"
                isMulti
                options={branchOptions}
                placeholder="Select branch for category"
                onChange={(selectedOptions) => {
                  setExpenseCategoryData((prev) => ({
                    ...prev,
                    branches: selectedOptions.map((option) => option.value),
                  }));
                }}
                value={branchOptions.filter((option) =>
                  expenseCategoryData?.branches?.includes(option.value)
                )}
              />
            </div>
            <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button
                onClick={closeCategoryModal}
                className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                disabled={ExpenseUpdateLoading}
                onClick={handleCreateCategory}
                className={`inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium text-white transition dark:text-gray-800 
    ${
      ExpenseUpdateLoading
        ? "bg-gray-400 dark:bg-gray-300 cursor-not-allowed"
        : "bg-gray-900 dark:bg-gray-200 cursor-pointer hover:bg-[#3a3a3a]"
    }`}
              >
                {ExpenseUpdateLoading && <ButtonSpinner />}
                {categoriesModal === "AddExpenseCategory" ? "Add" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Expense;
