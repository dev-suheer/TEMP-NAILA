import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import { IoArrowBack } from "react-icons/io5";
import {
  getBuyerByIdAsync,
  getReturnableBillsForBuyerAsync,
} from "../../features/BuyerSlice";
import { CreateReturnforBranch } from "../../features/ReturnSlice";
import PageLoader from "../../Component/Loader/PageLoader";
import Chip from "../../Component/Common/Chip";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";
import {
  formatAmount,
  formatReadableDate,
  getTodayDate,
} from "../../Utils/Common";

const inputClass =
  "w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-500 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800";

//PART OF THE RETURN TAKEN FROM WHAT THE BUYER OWES, REST IS PAYABLE TO THE BUYER
const splitReturnAmount = (balance, total) => {
  if (total <= 0) return { fromBalance: 0, payable: 0 };
  if (balance - total >= 0) return { fromBalance: total, payable: 0 };
  if (balance >= 0) return { fromBalance: balance, payable: total - balance };
  return { fromBalance: 0, payable: total };
};

const getBillLabel = (bill) => `S.N ${bill.serialNumber} · A.S.N ${bill.autoSN}`;

const getReturnableCount = (bill) =>
  bill.profitDataForHistory.reduce(
    (total, line) => total + (Number(line.quantity_for_return) || 0),
    0
  );

const BuyerReturn = () => {
  const { buyerId } = useParams();
  const [searchParams] = useSearchParams();
  const initialBillId = searchParams.get("bill");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const today = getTodayDate();
  const { user } = useSelector((state) => state.auth);
  const { BuyerById, loading, ReturnableBills, returnableBillsLoading } =
    useSelector((state) => state.Buyer);
  const { Returnloading } = useSelector((state) => state.Return);

  const [selectedIds, setSelectedIds] = useState(
    initialBillId ? [initialBillId] : []
  );
  const [entries, setEntries] = useState({});
  const [billSearch, setBillSearch] = useState("");
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [methodValue, setMethodValue] = useState("default-account");
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    dispatch(getBuyerByIdAsync({ id: buyerId }));
    dispatch(getReturnableBillsForBuyerAsync({ buyerId }));
  }, [buyerId, dispatch]);

  const buyerBalance = Number(BuyerById?.virtual_account?.total_balance) || 0;
  const visibleBills = ReturnableBills.filter((bill) =>
    `${bill.serialNumber} ${bill.autoSN} ${formatReadableDate(bill.date)}`
      .toLowerCase()
      .includes(billSearch.trim().toLowerCase())
  );
  const missingInitialBill =
    initialBillId && !ReturnableBills.some((bill) => bill.id === initialBillId);

  const returnBills = ReturnableBills.filter((bill) =>
    selectedIds.includes(bill.id)
  ).map((bill) => {
    const lines = bill.profitDataForHistory.map((line, index) => {
      const key = `${bill.id}:${index}`;
      const entry = entries[key] || { quantity: "", price: "" };
      const quantity = Number(entry.quantity) || 0;
      const price = Number(entry.price) || 0;
      return {
        key,
        line,
        entry,
        quantity,
        price,
        amount: quantity * price,
        missingPrice: quantity > 0 && price <= 0,
      };
    });
    return {
      bill,
      lines,
      amount: lines.reduce((total, line) => total + line.amount, 0),
    };
  });
  const billsToReturn = returnBills.filter(({ lines }) =>
    lines.some((line) => line.quantity > 0)
  );
  const totalReturnAmount = returnBills.reduce(
    (total, bill) => total + bill.amount,
    0
  );
  const hasMissingPrice = returnBills.some(({ lines }) =>
    lines.some((line) => line.missingPrice)
  );
  const { fromBalance, payable } = splitReturnAmount(
    buyerBalance,
    totalReturnAmount
  );
  const canSubmit =
    billsToReturn.length > 0 && !hasMissingPrice && totalReturnAmount > 0;

  const toggleBill = (billId) => {
    setSelectedIds((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    );
  };

  const updateEntry = (key, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [key]: { quantity: "", price: "", ...prev[key], [field]: value },
    }));
  };

  const handleQuantityChange = (key, value, maxQuantity) => {
    const quantity = parseInt(value, 10);
    updateEntry(
      key,
      "quantity",
      Number.isNaN(quantity) ? "" : Math.min(Math.max(quantity, 0), maxQuantity)
    );
  };

  const openConfirmationModal = () => {
    setMethodValue("default-account");
    setSelectedDate(today);
    setConfirmationModal(true);
    document.body.style.overflow = "hidden";
  };

  const closeConfirmationModal = () => {
    setConfirmationModal(false);
    document.body.style.overflow = "auto";
  };

  const handleSubmit = () => {
    const formData = {
      branchId: BuyerById?.branchId,
      buyerId: BuyerById?.id,
      partyName: BuyerById?.name,
      serialNumber: BuyerById?.serialNumber,
      phone: BuyerById?.phone,
      date: methodValue === "cash" ? selectedDate : today,
      T_Return_Amount: totalReturnAmount,
      Amount_From_Balance: fromBalance,
      Amount_Payable: payable,
      method: methodValue,
      bills: billsToReturn.map(({ bill, lines }) => ({
        bill_Id: bill.id,
        suits_data: lines
          .filter(({ quantity }) => quantity > 0)
          .map(({ line, quantity, price }) => ({
            id: line.suitId,
            quantity,
            d_no: line.d_no,
            color: line.color,
            category: line.category,
            price,
          })),
      })),
    };

    dispatch(CreateReturnforBranch(formData)).then((res) => {
      if (res.payload?.success) {
        closeConfirmationModal();
        navigate("/dashboard/naila-arts-buyer");
      }
    });
  };

  if (loading || returnableBillsLoading || BuyerById?.id !== buyerId) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        <PageLoader />
      </section>
    );
  }

  return (
    <>
      <section className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 pt-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 mx-2">
          <div>
            <h1 className="mt-1 text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
              Return Bills
            </h1>
          </div>
        </div>

        {/* -------------- BUYER -------------- */}
        <div className="text-center mt-5 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 sm:grid-cols-3 lg:grid-cols-6 dark:border-gray-600 dark:text-gray-100">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="text-red-500">S.N</span>-
              <span className="text-green-600">A.S.N</span>
            </p>
            <p className="font-medium">
              <span className="text-red-500">{BuyerById?.serialNumber}</span>-
              <span className="text-green-600">{BuyerById?.autoSN}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
            <p className="font-medium">{BuyerById?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
            <p className="font-medium">{BuyerById?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-red-500">Total Debit</p>
            <p className="font-medium text-red-500">
              {formatAmount(BuyerById?.virtual_account?.total_debit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Credit</p>
            <p className="font-medium">
              {formatAmount(BuyerById?.virtual_account?.total_credit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Balance</p>
            <p className="font-medium">{formatAmount(buyerBalance)}</p>
          </div>
        </div>

        {missingInitialBill && (
          <p className="mx-2 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            The bill you opened has nothing left to return. You can still pick
            another bill of this buyer.
          </p>
        )}

        <div className="mx-2 mt-5 grid grid-cols-1 gap-5 pb-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* -------------- BILLS -------------- */}
          <aside className="h-fit rounded-lg border border-gray-200 dark:border-gray-600 lg:sticky lg:top-20">
            <div className="border-b border-gray-200 p-3 dark:border-gray-600">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Bills with suits to return
                </h2>
                <Chip>{returnBills.length} selected</Chip>
              </div>
              <input
                type="text"
                placeholder="Search S.N, A.S.N or date"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-gray-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="max-h-[50vh] divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
              {visibleBills.length > 0 ? (
                visibleBills.map((bill) => {
                  const isSelected = selectedIds.includes(bill.id);
                  return (
                    <label
                      key={bill.id}
                      className={`flex cursor-pointer items-start gap-3 px-3 py-3 text-sm ${
                        isSelected
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBill(bill.id)}
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-gray-800 focus:ring-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-gray-900 dark:text-white">
                          {getBillLabel(bill)}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-300">
                          {formatReadableDate(bill.date)} · {formatAmount(bill.total)}
                        </span>
                      </span>
                      <Chip variant="primary">{getReturnableCount(bill)} left</Chip>
                    </label>
                  );
                })
              ) : (
                <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                  {ReturnableBills.length > 0
                    ? "No bill matches your search."
                    : "This buyer has no bills with suits left to return."}
                </p>
              )}
            </div>
          </aside>

          {/* -------------- SELECTED BILLS -------------- */}
          <div className="min-w-0 space-y-4">
            {returnBills.length > 0 ? (
              returnBills.map(({ bill, lines, amount }) => (
                <div
                  key={bill.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-600">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {getBillLabel(bill)}
                      </h3>
                      <Chip>{formatReadableDate(bill.date)}</Chip>
                      <Chip>Bill {formatAmount(bill.total)}</Chip>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        Returning <strong>{formatAmount(amount)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBill(bill.id)}
                        title={`Remove ${getBillLabel(bill)}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-gray-700"
                      >
                        <RxCross2 size={18} />
                        <span className="sr-only">Remove {getBillLabel(bill)}</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap text-left text-sm text-gray-600 dark:text-gray-300">
                      <thead className="bg-gray-100 text-xs uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                          <th className="px-3 py-2 font-semibold">D#</th>
                          <th className="px-3 py-2 font-semibold">Category</th>
                          <th className="px-3 py-2 font-semibold">Color</th>
                          <th className="px-3 py-2 font-semibold">Type</th>
                          <th className="px-3 py-2 font-semibold">SKU</th>
                          <th className="px-3 py-2 font-semibold">
                            <span className="text-green-600">Sold</span>/
                            <span className="text-red-500">Returnable</span>
                          </th>
                          <th className="px-3 py-2 font-semibold">Sale Price</th>
                          <th className="px-3 py-2 font-semibold">Return Qty</th>
                          <th className="px-3 py-2 font-semibold">Return Price</th>
                          <th className="px-3 py-2 font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map(({ key, line, entry, amount: lineAmount, missingPrice }) => {
                          const returnable = Number(line.quantity_for_return) || 0;
                          return (
                            <tr
                              key={key}
                              className={`border-t border-gray-200 dark:border-gray-700 ${
                                returnable === 0 ? "opacity-60" : ""
                              }`}
                            >
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{line.d_no}</td>
                              <td className="px-3 py-2">{line.category}</td>
                              <td className="px-3 py-2">{line.color}</td>
                              <td className="px-3 py-2">{line.stitch_type}</td>
                              <td className="px-3 py-2">{line.sku ?? "--"}</td>
                              <td className="px-3 py-2">
                                <span className="text-green-600">{line.quantity}</span>/
                                <span className="text-red-500">{returnable}</span>
                              </td>
                              <td className="px-3 py-2">{formatAmount(line.suitSalePrice)}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={returnable}
                                  placeholder="0"
                                  aria-label={`Return quantity for D# ${line.d_no} ${line.color}`}
                                  value={entry.quantity}
                                  disabled={returnable === 0}
                                  onChange={(e) =>
                                    handleQuantityChange(key, e.target.value, returnable)
                                  }
                                  className={inputClass}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  placeholder={line.suitSalePrice}
                                  aria-label={`Return price for D# ${line.d_no} ${line.color}`}
                                  value={entry.price}
                                  disabled={returnable === 0}
                                  onChange={(e) => updateEntry(key, "price", e.target.value)}
                                  className={`${inputClass} ${missingPrice ? "!border-red-500" : ""}`}
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                                {lineAmount > 0 ? formatAmount(lineAmount) : "--"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-300">
                Tick a bill on the left to start the return.
              </div>
            )}
          </div>
        </div>

        {/* -------------- TOTALS -------------- */}
        <div className="sticky bottom-0 -mx-2 flex flex-wrap items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-white px-4 py-3 md:-mx-4 lg:-mx-5 dark:border-gray-600 dark:bg-gray-900">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700 dark:text-gray-200">
            <p>
              Total Return Amount <strong>{formatAmount(totalReturnAmount)}</strong>
            </p>
            <p>
              Amount From Balance <strong>{formatAmount(fromBalance)}</strong>
            </p>
            <p>
              Amount Payable <strong>{formatAmount(payable)}</strong>
            </p>
            {hasMissingPrice && (
              <p className="text-red-500">Enter a return price for every suit coming back</p>
            )}
          </div>
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/naila-arts-buyer")}
              className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={openConfirmationModal}
              disabled={!canSubmit}
              className="px-4 py-2 text-sm rounded bg-[#252525] text-white disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-gray-200 dark:text-gray-800"
            >
              Return {billsToReturn.length > 1 ? `${billsToReturn.length} Bills` : "Bill"}
            </button>
          </div>
        </div>
      </section>

      {/* RETURN CONFIRMATION MODAL */}
      {confirmationModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative w-[95%] max-w-lg rounded-md bg-white shadow dark:bg-gray-700">
            <div className="border-b p-5 dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Confirm Return
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                {billsToReturn.length} {billsToReturn.length > 1 ? "bills" : "bill"} ·
                Total {formatAmount(totalReturnAmount)}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {payable <= 0
                  ? "Are you want to deduct this amount from buyers account ?"
                  : `Select a method for the payable amount of ${formatAmount(payable)}`}
              </p>

              {payable > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={methodValue === "account"}
                      onChange={() => setMethodValue("account")}
                      className="h-4 w-4 cursor-pointer text-gray-600"
                    />
                    Account
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={methodValue === "cash"}
                      onChange={() => setMethodValue("cash")}
                      className="h-4 w-4 cursor-pointer text-gray-600"
                    />
                    Cash
                  </label>

                  {methodValue === "cash" && user?.user?.role === "superadmin" && (
                    <input
                      name="Date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t p-4 dark:border-gray-600">
              <button
                type="button"
                onClick={closeConfirmationModal}
                className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={Returnloading || (payable > 0 && methodValue === "default-account")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded bg-[#252525] text-white disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-gray-200 dark:text-gray-800"
              >
                {Returnloading && <ButtonSpinner />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerReturn;
