import { useState } from "react";
import { useEffect } from "react";
import Loading from "../Loader/Loading";
import { BILL_TYPES, formatAmount, formatReadableDate } from "../../Utils/Common";
import { IoChevronDown, IoChevronUp, IoClose } from "react-icons/io5";
import Chip from "../Common/Chip";

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <span className="font-semibold text-gray-900 dark:text-gray-100">
      {label}:{" "}
    </span>
    <span className="break-words text-gray-900 dark:text-gray-100">
      {value ?? "--"}
    </span>
  </div>
);

const SuitDetailsTable = ({ rows = [], showPrice = true, showReturnable = true }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
        <tr>
          <th className="px-3 py-2 font-medium">D # No</th>
          <th className="px-3 py-2 font-medium">Category</th>
          <th className="px-3 py-2 font-medium">Color</th>
          <th className="px-3 py-2 font-medium">Type</th>
          <th className="px-3 py-2 font-medium">SKU</th>
          <th className="px-3 py-2 font-medium">Quantity</th>
          {showPrice && <th className="px-3 py-2 font-medium">Sale Price</th>}
          {showPrice && showReturnable && (
            <th className="px-3 py-2 font-medium">Returnable</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr
              key={row?._id || `${row?.d_no}-${row?.color}-${index}`}
              className="border-b bg-white text-sm font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <td className="px-3 py-2">{row?.d_no ?? "--"}</td>
              <td className="px-3 py-2">{row?.category ?? "--"}</td>
              <td className="px-3 py-2">{row?.color ?? "--"}</td>
              <td className="px-3 py-2">{row?.stitch_type ?? "--"}</td>
              <td className="px-3 py-2">{row?.sku ?? "--"}</td>
              <td className="px-3 py-2">{row?.quantity ?? 0}</td>
              {showPrice && (
                <td className="px-3 py-2">{formatAmount(row?.suitSalePrice)}</td>
              )}
              {showPrice && showReturnable && (
                <td className="px-3 py-2">{row?.quantity_for_return ?? 0}</td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={showPrice ? (showReturnable ? 8 : 7) : 6}
              className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-300"
            >
              No suit details available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const BuyerBillDetailsModal = ({
  isOpen,
  onClose,
  loading,
  details,
  title = "Bill And Returns Details",
  showBillDetails = true,
  showSuitDetails = true,
}) => {
  const [expandedReturnIds, setExpandedReturnIds] = useState({});

  useEffect(() => {
    if (isOpen) {
      setExpandedReturnIds({});
    }
  }, [isOpen, details?.bill?._id]);

  if (!isOpen) return null;

  const bill = details?.bill;
  const returnBills = details?.returnBills || [];
  const exchanges = details?.exchanges || [];
  const holdings = details?.holdings || [];
  const isBPairBill = bill?.bill_type === BILL_TYPES.B_PAIR;

  const toggleReturnBill = (returnBillId) => {
    setExpandedReturnIds((prev) => ({
      ...prev,
      [returnBillId]: !prev[returnBillId],
    }));
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-gray-800 bg-opacity-50 px-2 py-4"
    >
      <div className="relative flex max-h-[90vh] w-[95%] max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow dark:bg-gray-700">
        <div className="flex items-center justify-between border-b p-4 md:p-5 dark:border-gray-600">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
            {title}
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

        <div className="scrollable-content overflow-y-auto p-4 md:p-5">
          {loading ? (
            <div className="flex min-h-[45vh] items-center justify-center">
              <Loading />
            </div>
          ) : bill ? (
            <div className="space-y-5">
              {showBillDetails && (
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-md border border-gray-300 bg-[#F7F7F7] p-4 text-sm md:grid-cols-2 md:p-5 lg:grid-cols-5 dark:border-gray-500 dark:bg-gray-800">
                  <DetailItem label="S.N / A.S.N" value={`${bill.serialNumber} / ${bill.autoSN}`} />
                  <DetailItem label="Party Name" value={bill.name} />
                  <DetailItem label="City" value={bill.city} />
                  <DetailItem label="Phone" value={bill.phone} />
                  <DetailItem label="Date" value={formatReadableDate(bill.date)} />
                  <DetailItem label="Payment Method" value={bill.payment_Method} />
                  <DetailItem label="Total" value={formatAmount(bill.total)} />
                  <DetailItem label="Paid" value={formatAmount(bill.paid)} />
                  <DetailItem label="Remaining" value={formatAmount(bill.remaining)} />
                </div>
              )}

              {showBillDetails && bill?.packaging?.quantity > 0 && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Packaging
                  </h4>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-md border border-gray-300 bg-[#F7F7F7] p-4 text-sm md:grid-cols-3 dark:border-gray-500 dark:bg-gray-800">
                    <DetailItem label="Quantity" value={bill.packaging.quantity} />
                    <DetailItem
                      label="Packaging ID"
                      value={bill.packaging.packaging_type || "--"}
                    />
                  </div>
                </div>
              )}

              {showBillDetails && bill?.other_Bill_Data && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Other Bill
                  </h4>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-md border border-gray-300 bg-[#F7F7F7] p-4 text-sm md:grid-cols-3 dark:border-gray-500 dark:bg-gray-800">
                    <DetailItem
                      label="Quantity"
                      value={bill.other_Bill_Data.o_b_quantity}
                    />
                    <DetailItem
                      label="Amount"
                      value={formatAmount(bill.other_Bill_Data.o_b_amount)}
                    />
                    <DetailItem label="Note" value={bill.other_Bill_Data.o_b_note} />
                  </div>
                </div>
              )}

              {showSuitDetails && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    Suit Details
                    {isBPairBill && <Chip variant="warning">B-Pair</Chip>}
                  </h4>
                  <SuitDetailsTable
                    rows={bill.profitDataForHistory || []}
                    showReturnable={!isBPairBill}
                  />
                </div>
              )}

              {isBPairBill && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Currently Held By Buyer
                  </h4>
                  <SuitDetailsTable rows={holdings} showPrice={false} />
                </div>
              )}

              {isBPairBill && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Exchanges
                    </h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-300">
                      {exchanges.length} found
                    </span>
                  </div>

                  {exchanges.length > 0 ? (
                    <div className="space-y-3">
                      {exchanges.map((exchange) => {
                        const isExpanded = Boolean(expandedReturnIds[exchange.id]);
                        const exchangedQuantity = exchange.returned_items.reduce(
                          (total, item) => total + item.quantity,
                          0
                        );

                        return (
                          <div
                            key={exchange.id}
                            className="rounded-md border border-gray-200 dark:border-gray-600"
                          >
                            <button
                              type="button"
                              onClick={() => toggleReturnBill(exchange.id)}
                              aria-expanded={isExpanded}
                              className="flex w-full flex-wrap items-center justify-between gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatReadableDate(exchange.date)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                {exchange.note || "No note"}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {exchangedQuantity} suits
                              </span>
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-300">
                                {isExpanded ? (
                                  <IoChevronUp size={20} />
                                ) : (
                                  <IoChevronDown size={20} />
                                )}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="grid grid-cols-1 gap-4 border-t p-3 lg:grid-cols-2 dark:border-gray-600">
                                <div>
                                  <h5 className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                                    Taken Back
                                  </h5>
                                  <SuitDetailsTable
                                    rows={exchange.returned_items}
                                    showPrice={false}
                                  />
                                </div>
                                <div>
                                  <h5 className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300">
                                    Given
                                  </h5>
                                  <SuitDetailsTable
                                    rows={exchange.issued_items}
                                    showPrice={false}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-md border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-300">
                      No exchanges for this bill.
                    </p>
                  )}
                </div>
              )}

              {!isBPairBill && (
              <div className="border-t pt-4 dark:border-gray-600">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Return Bills
                  </h4>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-300">
                    {returnBills.length} found
                  </span>
                </div>

                {returnBills.length > 0 ? (
                  <div className="space-y-3">
                    {returnBills.map((returnBill, index) => {
                      const returnBillId = returnBill.id || returnBill._id || index;
                      const isExpanded = Boolean(expandedReturnIds[returnBillId]);

                      return (
                        <div
                          key={returnBillId}
                          className="rounded-md border border-gray-200 dark:border-gray-600"
                        >
                          <button
                            type="button"
                            onClick={() => toggleReturnBill(returnBillId)}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? "Collapse return bill details"
                                : "Expand return bill details"
                            }
                            className="flex w-full flex-wrap items-center justify-between gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Return S.N {returnBill.serialNumber}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              {formatReadableDate(returnBill.date)}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatAmount(returnBill.T_Return_Amount)}
                            </span>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-300">
                              {isExpanded ? (
                                <IoChevronUp size={20} />
                              ) : (
                                <IoChevronDown size={20} />
                              )}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="border-t p-3 dark:border-gray-600">
                              <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-5 rounded-md border border-gray-300 bg-[#F7F7F7] p-4 text-sm md:grid-cols-3 dark:border-gray-500 dark:bg-gray-800">
                                <DetailItem
                                  label="Amount From Balance"
                                  value={formatAmount(returnBill.Amount_From_Balance)}
                                />
                                <DetailItem
                                  label="Amount From Total Cash"
                                  value={formatAmount(returnBill.Amount_Payable)}
                                />
                                <DetailItem
                                  label="Returned Items"
                                  value={returnBill.suits_data?.length || 0}
                                />
                              </div>
                              <SuitDetailsTable
                                rows={returnBill.suits_data || []}
                                showPrice={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-md border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-300">
                    No return bills for this bill.
                  </p>
                )}
              </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-500 dark:text-gray-300">
              No bill details available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
