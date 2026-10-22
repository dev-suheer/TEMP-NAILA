/* eslint-disable react/prop-types */
import Chip from "../../../../Component/Common/Chip";
import { formatAmount, formatReadableDate } from "../../../../Utils/Common";

const PackingViewModal = ({ packing, onClose }) => {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-start justify-between gap-4 p-5 border-b dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Packing · D# {packing.design_no}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip>{formatReadableDate(packing.createdAt)}</Chip>
              <Chip>
                S.N {packing.serial_No} / M.N {packing.Manual_No}
              </Chip>
              <Chip>
                {packing.packing_Id
                  ? `Stitching · ${packing.stitching_partyName}`
                  : "Direct"}
              </Chip>
              <Chip variant={packing.useBags ? "success" : "muted"}>
                Bags {packing.useBags ? "used" : "not used"}
              </Chip>
            </div>
          </div>
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

        <div className="space-y-5 p-5">
          {/* ------------- STOCK ------------- */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Stock added
            </h4>
            <div className="relative overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
                  <tr>
                    <th className="px-3 py-2">Color</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Received</th>
                    <th className="px-3 py-2">Main</th>
                    <th className="px-3 py-2">C.P</th>
                    <th className="px-3 py-2">S.P</th>
                    <th className="px-3 py-2">B-Pair</th>
                    <th className="px-3 py-2">B-Pair S.P</th>
                  </tr>
                </thead>
                <tbody>
                  {packing.rows.map((row, index) => (
                    <tr
                      key={`${row.color}-${index}`}
                      className="border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
                    >
                      <td className="px-3 py-2 font-medium">{row.color}</td>
                      <td className="px-3 py-2">{row.category}</td>
                      <td className="px-3 py-2">{row.stitch_type}</td>
                      <td className="px-3 py-2">{row.received}</td>
                      <td className="px-3 py-2">{row.main_quantity}</td>
                      <td className="px-3 py-2">{row.main_quantity > 0 ? row.cost_price : "--"}</td>
                      <td className="px-3 py-2">{row.main_quantity > 0 ? row.sale_price : "--"}</td>
                      <td className="px-3 py-2">{row.b_pair_quantity}</td>
                      <td className="px-3 py-2">
                        {row.b_pair_quantity > 0 ? row.b_pair_sale_price : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Main stock <strong>{packing.total_main}</strong> · B-Pair{" "}
              <strong>{packing.total_b_pair}</strong> · Received{" "}
              <strong>{packing.total_received}</strong>
            </p>
          </div>

          {/* ------------- PENALTIES ------------- */}
          {packing.penalties.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                B-Pair penalties
              </h4>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-600 dark:border-gray-600">
                {packing.penalties.map((penalty) => (
                  <li
                    key={`${penalty.process_step}:${penalty.process_id}`}
                    className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {penalty.partyName}
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-300">
                          · {penalty.process_step}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {penalty.quantity} × {penalty.rate} = {formatAmount(penalty.penalty_amount)}
                        {penalty.additional_cost > 0 &&
                          ` + ${formatAmount(penalty.additional_cost)} additional`}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(penalty.total_penalty)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-right text-sm font-semibold text-gray-900 dark:text-white">
                Total {formatAmount(packing.total_penalty)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingViewModal;
