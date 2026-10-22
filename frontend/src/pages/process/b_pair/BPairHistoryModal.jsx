/* eslint-disable react/prop-types */
import { useSelector } from "react-redux";
import Chip from "../../../Component/Common/Chip";
import { formatReadableDate } from "../../../Utils/Common";

const BPairHistoryModal = ({ data, closeModal }) => {
  const { Branches } = useSelector((state) => state.InStock);

  const getBranchName = (branchId) =>
    Branches?.find((branch) => branch.id === branchId)?.branchName || "--";

  const records = data?.all_records?.slice().reverse() || [];

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4 px-3 w-[95%] max-w-7xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-start justify-between gap-4 p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              B Pair History
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              D# {data?.d_no} · {data?.category} · {data?.color} ·{" "}
              {data?.stitch_type} · Available{" "}
              {data?.quantity} · Sold {data?.sold_quantity}
            </p>
          </div>
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

        {/* ------------- BODY ------------- */}
        <div className="p-4 md:p-5">
          <div className="scrollable-content max-h-[60vh] overflow-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="sticky top-0 z-10 text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3 text-center">Quantity</th>
                  <th className="px-3 py-3 text-center">Sale Price</th>
                  <th className="px-3 py-3 text-center">Serial / Manual No</th>
                  <th className="px-3 py-3">Parties / Branch</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((record) => {
                    const isPacking = record.source === "Packing";
                    return (
                      <tr
                        key={record.id}
                        className="bg-white border-b text-sm font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          {formatReadableDate(record.date)}
                        </td>
                        <td className="px-3 py-3">
                          <Chip variant={isPacking ? "warning" : "primary"}>
                            {record.source}
                          </Chip>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {record.quantity}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {record.sale_price}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isPacking
                            ? `${record.serial_No ?? "-"} / ${record.Manual_No ?? "-"}`
                            : "--"}
                        </td>
                        <td className="px-3 py-3">
                          {isPacking ? (
                            record.parties?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {record.parties.map((party) => (
                                  <Chip key={`${party.process_step}-${party.process_id}`}>
                                    {party.process_step} · {party.partyName}
                                  </Chip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No party selected</span>
                            )
                          ) : (
                            getBranchName(record.branchId)
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="bg-white dark:bg-gray-800">
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-xl text-gray-500 dark:text-gray-300"
                    >
                      No Data Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BPairHistoryModal;
