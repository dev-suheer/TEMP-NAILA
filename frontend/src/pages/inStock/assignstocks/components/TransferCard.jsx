/* eslint-disable react/prop-types */
import { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import Chip from "../../../../Component/Common/Chip";
import StatusChip from "../../../../Component/Common/StatusChip";
import { formatReadableDate } from "../../../../Utils/Common";

const sumQuantity = (items = []) =>
  items.reduce((total, item) => total + Number(item?.quantity || 0), 0);

const MetaItem = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
      {value}
    </p>
  </div>
);

const AllocationChips = ({ item }) => {
  const allocation = item.allocation;
  if (!allocation) return <span className="text-gray-400">--</span>;

  const redirected =
    allocation.main_Item_Id && allocation.main_Item_Id !== item.Item_Id;

  return (
    <div className="flex flex-wrap gap-1">
      {allocation.main_quantity > 0 && (
        <Chip variant={redirected ? "primary" : "success"}>
          Main {allocation.main_quantity}
          {redirected &&
            ` → D# ${allocation.main_d_no} · ${allocation.main_category} · ${allocation.main_color}`}
        </Chip>
      )}
      {allocation.b_pair_quantity > 0 && (
        <Chip variant="warning">
          B-Pair {allocation.b_pair_quantity} @{" "}
          {Number(allocation.b_pair_sale_price).toLocaleString()}
        </Chip>
      )}
    </div>
  );
};

const TransferCard = ({
  transfer,
  branchName,
  onReview,
  onReject,
  actionLoading,
}) => {
  const isReturn = transfer.transferType === "RETURN_TO_MAIN";
  const isPendingReturn = isReturn && transfer.bundleStatus === "Pending";
  const showAllocation = isReturn && transfer.bundleStatus === "Approved";
  const [expanded, setExpanded] = useState(isPendingReturn);

  const bundles = transfer.bundles || [];
  const totalQuantity = sumQuantity(bundles.flat());

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* ------------- HEADER ------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
              isReturn
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
            }`}
          >
            {isReturn ? <FaArrowLeft size={11} /> : <FaArrowRight size={11} />}
            {isReturn ? "Returned to Main" : "Sent to Branch"}
          </span>
          <StatusChip status={transfer.bundleStatus} />
          {branchName && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {branchName}
            </span>
          )}
        </div>

        {isPendingReturn && (
          <div className="flex items-center gap-2">
            <button
              disabled={actionLoading}
              onClick={() => onReject(transfer)}
              className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
            >
              Reject
            </button>
            <button
              disabled={actionLoading}
              onClick={() => onReview(transfer)}
              className="rounded bg-[#252525] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-200 dark:text-gray-900"
            >
              Review & Receive
            </button>
          </div>
        )}
      </div>

      {/* ------------- META ------------- */}
      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 px-4 py-3 sm:grid-cols-4 dark:border-gray-700">
        <MetaItem label="Issued" value={formatReadableDate(transfer.issueDate)} />
        <MetaItem
          label="Updated"
          value={transfer.updatedOn ? formatReadableDate(transfer.updatedOn) : "--"}
        />
        <MetaItem label="Total Suits" value={totalQuantity} />
        <MetaItem label="Bundles" value={bundles.length} />
      </div>

      {transfer.note && (
        <p className="border-t border-gray-100 px-4 py-2.5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-gray-100">Note: </span>
          {transfer.note}
        </p>
      )}

      {/* ------------- BUNDLES ------------- */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700/50"
      >
        {expanded ? "Hide bundles" : `Show bundles (${bundles.length})`}
        {expanded ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 p-4 dark:border-gray-700">
          {bundles.map((bundle, bundleIndex) => (
            <div
              key={bundleIndex}
              className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                <span>Bundle {bundleIndex + 1}</span>
                <span>{sumQuantity(bundle)} suits</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                  <thead className="text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">D#</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Color</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Cost</th>
                      <th className="px-3 py-2 font-medium">Sale</th>
                      {showAllocation && (
                        <th className="px-3 py-2 font-medium">Received As</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.map((item, itemIndex) => (
                      <tr
                        key={item.id || itemIndex}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">
                          {item.d_no}
                        </td>
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">{item.color}</td>
                        <td className="px-3 py-2">{item.stitch_type}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{item.cost_price}</td>
                        <td className="px-3 py-2">{item.sale_price}</td>
                        {showAllocation && (
                          <td className="px-3 py-2">
                            <AllocationChips item={item} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransferCard;
