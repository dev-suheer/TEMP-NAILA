import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  AddCreditDebit,
  CalculateSalaryAsync,
  CreditSalary,
  deleteCreditDebitEntryAsync,
  GetEmployeeById,
  reverseSalaryAsync,
} from "../../features/AccountSlice";
import toast from "react-hot-toast";
import "react-calendar/dist/Calendar.css";
import { GoPlus } from "react-icons/go";
import { PiHandDeposit, PiHandWithdraw } from "react-icons/pi";
import { MdOutlineDelete } from "react-icons/md";

import ConfirmationModal from "../../Component/Modal/ConfirmationModal";
import { formatReadableDate, getDateOnlyTime, getTodayDate } from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";


const EmployeeDetails = () => {
  const { id } = useParams();
  const { loading, Employee, employeEditLoading, calculateSalaryLoading } = useSelector(
    (state) => state.Account
  );
  const { Branches } = useSelector((state) => state.InStock);
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [deleteModal, setDeleteTransactionModal] = useState(false);
  const [afterConfirmation, setAfterConfirmation] = useState(null);
  const [salaryCalculationData, setSalaryCalculationData] = useState(null);

  const today = getTodayDate();
  const formatAmount = (value) => Number(value || 0).toLocaleString();

  const [formData, setFormData] = useState({
    date: today,
    particular: "",
    amount: "",
    type: "credit",
    payment_Method: "",
    over_time: "",
    salary: "",
    branchId: "",
    note: "",
    salaryMonth: null,
  });


  useEffect(() => {
    dispatch(GetEmployeeById({ id }));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "over_time" || name === "amount" || name === "salary"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      id,
      date: formData.date,
      particular: formData.particular,
      payment_Method: formData.payment_Method,
      branchId: formData.branchId,
      [formData.type]: formData.amount,
    };

    dispatch(AddCreditDebit(data)).then((res) => {
      if (res.payload.success === true) {
        closeModal();
        dispatch(GetEmployeeById({ id }));
        setFormData({
          particular: "",
          amount: "",
          type: "credit",
          payment_Method: "",
          branchId: "",
          date: today,
        });
      }
    });
  };

  const handleCreditSalary = (e) => {
    e.preventDefault();
    if (!formData.payment_Method) {
      return toast.error("Please Select Payment Method");
    }
    if (!formData.salaryMonth) {
      return toast.error("Please Select Salary Month");
    }
    const data = {
      id: id,
      salary: formData.salary,
      payment_Method: formData.payment_Method,
      over_time: salaryCalculationData?.overTime || 0,
      leaves: salaryCalculationData?.leaves || 0,
      branchId: formData.branchId,
      month: formData.salaryMonth,
      date: formData.date,
    };
    dispatch(CreditSalary(data)).then((res) => {
      if (res.payload.success === true) {
        closeConfirmationModal();
        dispatch(GetEmployeeById({ id }));
      }
    });
  };

  const handleCalculateSalary = () => {
    if (!formData.salaryMonth) {
      return toast.error("Please select salary month");
    }

    dispatch(
      CalculateSalaryAsync({
        employee_id: id,
        month: formData.salaryMonth,
      }),
    ).then((res) => {
      if (res.payload) {
        setSalaryCalculationData(res.payload);
        setFormData((prev) => ({
          ...prev,
          salary: res.payload.totalSalary,
          date: prev.date || today,
        }));
        openConfirmationModal();
      }
    });
  };

  const openModal = (type) => {
    setFormData((prevData) => ({ ...prevData, type }));
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    setFormData({
      particular: "",
      amount: "",
      type: "credit",
      payment_Method: "",
      branchId: "",
      date: today,
      note: "",
    });
    document.body.style.overflow = "auto";
  };

  const openConfirmationModal = () => {
    setIsConfirmationOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationOpen(false);
    setDeleteTransactionModal(false);
    setSalaryCalculationData(null);
    setFormData((prev) => ({
      ...prev,
      payment_Method: "",
      date: "",
      over_time: "",
      note: "",
      salaryMonth: null,
      salary: "",
      branchId: "",
    }));
  };

  const handleDeleteTransaction = (data) => {
    if(!data) return;
    setDeleteTransactionModal(true);
    const isSalaryTransaction = data.salaryTransaction;

    const onSuccess = () => {
      dispatch(GetEmployeeById({ id }));
      setDeleteTransactionModal(false);
    };

    const buildSalaryDeletePayload = {
        id,
        transactionId: data.id,
        amount: data.debit,
        payment_Method: data.payment_Method,
        branchId: data.branchId,
        leaves: data.leaves,
    };

    const buildCreditDebitDeletePayload = {
        employeId: id,
        recordId: data.id,
    };

    const runAndHandle = (action) => {
      dispatch(action).then((res) => {
        if(res?.payload?.success) {
          onSuccess()
        }
      })
    }

    const confirmAction = () => {
      if(isSalaryTransaction){
        runAndHandle(reverseSalaryAsync(buildSalaryDeletePayload));
        return;
      } else {
        runAndHandle(deleteCreditDebitEntryAsync(buildCreditDebitDeletePayload))
      }
    };

    setAfterConfirmation(() => confirmAction);

  };

  const acountHistory = Employee?.financeData ?? []

const sortTransactionsByDate = (transactions = []) =>
  transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => {
      const firstDate = getDateOnlyTime(a.transaction.date);
      const secondDate = getDateOnlyTime(b.transaction.date);

      if (firstDate === null && secondDate === null) return b.index - a.index;
      if (firstDate === null) return 1;
      if (secondDate === null) return -1;

      const dateDiff = secondDate - firstDate;

      if (dateDiff !== 0) return dateDiff;

      return b.index - a.index;
    })
    .map(({ transaction }) => transaction);

  const sortedTransactions = sortTransactionsByDate(acountHistory)

  
  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <div className="px-2 py-2 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-3 text-gray-900 dark:text-gray-100">
          <div className="box">
            <h3 className="pb-1 font-medium">Employee Name</h3>
            <h3>{Employee?.name}</h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Phone Number</h3>
            <h3>{Employee?.phone_number}</h3>
          </div>
          <div className="box">
            <h330242 className="pb-1 font-medium">CNIC</h330242>
            <h3>{Employee?.CNIC}</h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Address</h3>
            <h3 className="">{Employee?.address}</h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Last Work Place</h3>
            <h3>{Employee?.last_work_place}</h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Designation</h3>
            <h3>{Employee?.designation}</h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Joining Date</h3>
            <h3>
              {formatReadableDate(Employee?.joininig_date)}
            </h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Father's Phone Number</h3>
            <h3>{Employee?.father_phone_number}</h3>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {!Employee?.pastEmploye && (
          <div className="tabs my-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                onClick={() => openModal("debit")}
              >
                <div className="flex items-center gap-2">
                  {" "}
                  <PiHandDeposit />
                  Debit
                </div>
              </button>
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                onClick={() => openModal("credit")}
              >
                <div className="flex items-center gap-2">
                  <PiHandWithdraw />
                  Credit
                </div>
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <input
                type="month"
                name="salaryMonth"
                value={formData.salaryMonth || ""}
                onChange={handleChange}
                className="rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                className={`rounded px-4 py-2.5 text-sm text-white ${
                  !formData.salaryMonth || calculateSalaryLoading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-[#252525] hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-800"
                }`}
                onClick={handleCalculateSalary}
                disabled={!formData.salaryMonth || calculateSalaryLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  {calculateSalaryLoading ? <ButtonSpinner /> : <GoPlus />}
                  Credit Salary
                </div>
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Particular
                  </th>
                   <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Payment Method
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Credit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Debit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Balance
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions?.length > 0 ? (
                  sortedTransactions
                    .map((data, index) => (
                      <tr
                        key={index}
                        className={`${
                          data.reversed
                            ? "bg-red-500 text-white"
                            : "bg-white text-black"
                        } border-b text-md font-semibold dark:border-gray-700`}
                      >
                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                          <p>{formatReadableDate(data.date)}</p>
                        </th>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {data.particular}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {data.payment_Method || "-"}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {data.credit === 0 ? "-" : data.credit}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {data.debit === 0 ? "-" : data.debit}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {data.balance === 0 ? "-" : data.balance}
                        </td>                     
                          <td className=" px-6 py-4">
                            <MdOutlineDelete
                              onClick={() => handleDeleteTransaction(data)}
                              size={20}
                              className="cursor-pointer  text-red-500"
                            />
                          </td>
                      </tr>
                    ))
                ) : (
                  <tr className="w-full flex justify-center items-center">
                    <td className="text-xl mt-3">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      

        {/* CREDIT DEBIT MODAL */}
        {isOpen && (
          <div
            aria-hidden="true"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
          >
            <div className="relative py-4 px-3 w-96 max-w-3xl max-h-full bg-white rounded-md shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formData.type === "credit" ? "Credit" : "Debit"}
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

              <div className="p-4 md:p-5">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Particular"
                      name="particular"
                      id="particular"
                      value={formData.particular}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Amount"
                      name="amount"
                      id="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                  <ThemedSelect className="w-full"
                    id="payment-method"
                    name="payment_Method"
                    value={formData?.payment_Method}
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
                  <ThemedSelect className="w-full"
                    id="branches"
                    name="branchId"
                    value={formData?.branchId || ""}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      Select Branch
                    </option>
                    {Branches?.map((branch) => (
                      <option key={branch?.id} value={branch?.id}>
                        {branch?.branchName}
                      </option>
                    ))}
                  </ThemedSelect>
                  <div className="flex justify-center pt-2">
                    <button
                      disabled={employeEditLoading}
                      type="submit"
                      className={`inline-flex items-center justify-center gap-2 rounded ${
                        employeEditLoading && "cursor-not-allowed"
                      } border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring`}
                    >
                      {employeEditLoading && <ButtonSpinner />}
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* SALARY CONFIRM MODAL */}
        {isConfirmationOpen && (
          <div
            aria-hidden="true"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
          >
            <div className="relative py-4 px-3 max-w-4xl max-h-full bg-white rounded-md shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-2 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Credit Salary
                </h3>
                <button
                  onClick={closeConfirmationModal}
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

              <div className="p-4">
                <div className="w-full rounded-md border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          Salary Calculation
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formData.salaryMonth || "-"} 
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Calculated Total
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatAmount(salaryCalculationData?.totalSalary)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
                    {[
                      ["Overtime Hours", salaryCalculationData?.overTime || 0],
                      ["Absents", salaryCalculationData?.absents || 0],
                      ["Leaves", salaryCalculationData?.leaves || 0],
                      ["Weekly Holiday Worked", salaryCalculationData?.weeklyHolidayWorked || 0],
                      ["Public Holiday Worked", salaryCalculationData?.publicHolidaysWorked || 0],
                      ["Missing Attendance", salaryCalculationData?.missingAttendanceDates?.length || 0],
                      ["Base Salary", Employee?.salary || 0],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-gray-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{formatAmount(value)}</p>
                      </div>
                    ))}
                  </div>

                  {salaryCalculationData?.missingAttendanceDates?.length > 0 && (
                    <div className="mx-4 mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      <p className="font-semibold">Missing attendance dates</p>
                      <p className="mt-1">{salaryCalculationData.missingAttendanceDates.join(", ")}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 border-t border-gray-200 p-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="salary"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                      >
                        Total Salary
                      </label>
                      <input
                        id="salary"
                        name="salary"
                        type="number"
                        value={formData.salary}
                        onChange={handleChange}
                        className="block h-11 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-medium text-gray-900 shadow-sm transition focus:border-gray-500 focus:outline-none focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="salary-branch"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                      >
                        Branch
                      </label>
                      <ThemedSelect className="w-full"
                        id="salary-branch"
                        name="branchId"
                        value={formData?.branchId || ""}
                        onChange={handleChange}
                      >
                        <option value="" disabled>
                          Select Branch
                        </option>
                        {Branches?.map((branch) => (
                          <option key={branch?.id} value={branch?.id}>
                            {branch?.branchName}
                          </option>
                        ))}
                      </ThemedSelect>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="salary-payment-method"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                      >
                        Payment Method
                      </label>
                      <ThemedSelect className="w-full"
                        id="salary-payment-method"
                        name="payment_Method"
                        value={formData?.payment_Method}
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

                    <div className="space-y-1.5">
                      <label
                        htmlFor="salary-date"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                      >
                        Payment Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="salary-date"
                        value={formData.date}
                        onChange={handleChange}
                        className="block h-11 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-medium text-gray-900 shadow-sm transition focus:border-gray-500 focus:outline-none focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4 gap-3">
                  <button
                    disabled={employeEditLoading}
                    type="submit"
                    onClick={handleCreditSalary}
                    className={`inline-flex items-center justify-center gap-2 rounded ${
                      employeEditLoading && "cursor-not-allowed"
                    }  bg-green-500 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-green-400 hover:text-gray-100 focus:outline-none focus:ring`}
                  >
                    {employeEditLoading && <ButtonSpinner />}
                    Yes
                  </button>
                  <button
                    onClick={closeConfirmationModal}
                    className="inline-block rounded border border-gray-300 bg-gray-300 dark:bg-gray-400 px-10 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-400 focus:outline-none focus:ring"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* REVERSE SALARY CONFIRMATION */}
        {deleteModal && (
          <ConfirmationModal
            onClose={closeConfirmationModal}
            onConfirm={afterConfirmation}
            message={"Are you sure want to delete this transaction."}
            title={"Delete Transaction"}
            updateStitchingLoading={employeEditLoading}
          />
        )}
      </section>
    </>
  );
};

export default EmployeeDetails;
