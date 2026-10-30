/* eslint-disable react/prop-types */
import { CgShoppingBag } from "react-icons/cg";
import { AiOutlinePicture } from "react-icons/ai";
import { TbShirtOff } from "react-icons/tb";
import { formatAmount } from "../../../../Utils/Common";
import ButtonSpinner from "../../../../Component/Common/button/ButtonSpinner";
import { getPenaltyBreakdown } from "../packingUtils";

const CheckRow = ({ icon: Icon, label, active, activeClass, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800">
    <div className="flex items-center gap-3">
      <Icon size={22} className={active ? activeClass.icon : "text-red-500"} />
      <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
    </div>
    <span
      className={`rounded px-2.5 py-1 text-xs font-semibold ${
        active
          ? activeClass.badge
          : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {value}
    </span>
  </div>
);

const greenClass = {
  icon: "text-green-500",
  badge: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300",
};

const PackingConfirmModal = ({
  useBags,
  picturesOrder,
  totalBPairQuantity,
  penaltyRows,
  loading,
  onCancel,
  onConfirm,
}) => {
  const hasPenalties = penaltyRows.length > 0;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div
        className={`relative w-[95%] max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700 ${
          hasPenalties ? "max-w-4xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add In Stock
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Confirm these packing options before adding stock.
            </p>
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

        <div
          className={`grid items-start gap-4 p-5 ${hasPenalties ? "md:grid-cols-2" : ""}`}
        >
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Packing Checks
            </h4>
            <div className="space-y-2">
              <CheckRow
                icon={CgShoppingBag}
                label="Packing Bags"
                active={useBags}
                activeClass={greenClass}
                value={useBags ? "Selected" : "Not selected"}
              />
              <CheckRow
                icon={AiOutlinePicture}
                label="Pictures Order"
                active={picturesOrder}
                activeClass={greenClass}
                value={picturesOrder ? "Added" : "Not added"}
              />
              <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <TbShirtOff
                    size={22}
                    className={totalBPairQuantity > 0 ? "text-amber-500" : "text-gray-400"}
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    B-Pair
                  </span>
                </div>
                <span
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${
                    totalBPairQuantity > 0
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {totalBPairQuantity > 0
                    ? `${totalBPairQuantity} suits · ${penaltyRows.length} parties`
                    : "None"}
                </span>
              </div>
            </div>
          </div>

          {hasPenalties && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Penalties to party accounts
              </h4>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-600 dark:border-gray-600">
                {penaltyRows.map(({ party, quantity, labour_quantity, penalty_amount, additional_cost, total_penalty }) => (
                  <li
                    key={`${party.process_step}:${party.process_id}`}
                    className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {party.partyName}
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-300">
                          · {party.process_step}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {getPenaltyBreakdown({
                          quantity,
                          labour_quantity,
                          rate: party.rate,
                          penalty_amount,
                        })}
                        {additional_cost > 0 && ` + ${formatAmount(additional_cost)} additional`}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(total_penalty)}
                    </span>
                  </li>
                ))}
              </ul>
             
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t p-4 dark:border-gray-600">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
          >
            Cancel
          </button>
          {loading ? (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 cursor-not-allowed text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            >
              <ButtonSpinner />
              Add In Stock
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            >
              Add In Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingConfirmModal;
