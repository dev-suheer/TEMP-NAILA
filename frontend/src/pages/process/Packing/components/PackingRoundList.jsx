/* eslint-disable react/prop-types */
import { useState } from "react";
import { IoChevronForward } from "react-icons/io5";
import { formatReadableDate } from "../../../../Utils/Common";

const headClass = "px-3 py-2 whitespace-nowrap";
const cellClass = "px-3 py-2 whitespace-nowrap";

//E.G. "48 main · 2 B-Pair"
const describeQuantities = (main, bPair) =>
  [`${main} main`, bPair > 0 && `${bPair} B-Pair`].filter(Boolean).join(" · ");

//PACKING ROUNDS, EACH OPENS IN PLACE TO SHOW WHAT IT ADDED PER COLOR
const PackingRoundList = ({ packings, getLabel }) => {
  const [openId, setOpenId] = useState(null);

  return (
    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-600 dark:border-gray-600">
      {packings.map((packing) => {
        const isOpen = openId === packing.id;
        return (
          <li key={packing.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : packing.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <IoChevronForward
                size={14}
                className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
              <span>
                <strong className="text-gray-900 dark:text-white">{getLabel(packing)}</strong>
                {" · "}
                {formatReadableDate(packing.createdAt)} ·{" "}
                {describeQuantities(packing.total_main, packing.total_b_pair)}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/60">
                <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
                  <table className="w-full bg-white text-left dark:bg-gray-700">
                    <thead className="bg-gray-100 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <tr>
                        <th className={headClass}>Color</th>
                        <th className={headClass}>Type</th>
                        <th className={headClass}>Main</th>
                        <th className={headClass}>B-Pair</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packing.rows.map((row, index) => (
                        <tr
                          key={`${row.color}-${index}`}
                          className="border-t border-gray-200 dark:border-gray-600"
                        >
                          <td className={`${cellClass} font-medium`}>{row.color}</td>
                          <td className={cellClass}>{row.stitch_type}</td>
                          <td className={cellClass}>{row.main_quantity}</td>
                          <td className={cellClass}>{row.b_pair_quantity || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default PackingRoundList;
