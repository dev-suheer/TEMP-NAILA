/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import { getColorLimitError } from "../../../../Utils/Common";
import { getNextRound, getSkipPackingRows } from "../packingUtils";

const inputClass =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-400 block w-full p-2 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white";

const SkipToPackingModal = ({ embroidery, sourceStep, sourceRecord, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const availability = sourceRecord?.processAvailability;
  //STITCHING IS PACKED FROM ITS OWN ROWS (WITH THEIR PRICES), THE OTHER STEPS FROM THE ORDER'S SHIRT COLORS
  const isStitching = sourceStep === "Stitching";
  const round = getNextRound(availability);
  const [rows, setRows] = useState(() =>
    getSkipPackingRows(
      availability,
      (isStitching
        ? sourceRecord?.suits_category?.length
          ? sourceRecord.suits_category
          : sourceRecord?.dupatta_category
        : embroidery?.shirt) || []
    )
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleReceivedChange = (index, value) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, received: parseInt(value, 10) || 0 } : row
      )
    );
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const requestedQuantity = rows.reduce(
    (total, row) => total + (Number(row.received) || 0),
    0
  );
  const availableQuantity = Number(availability?.available || 0);
  const quantityError =
    getColorLimitError(availability, rows, "received") ||
    (requestedQuantity > availableQuantity
      ? `Invalid quantity. Available quantity is ${availableQuantity}`
      : "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isStitching) {
      navigate(`/dashboard/packing-details/${sourceRecord.id}`, {
        state: {
          from: location.pathname,
          pack_rows: rows.map((row) => ({ color: row.color, quantity: row.received })),
        },
      });
      return;
    }
    navigate("/dashboard/packing-details/null", {
      state: {
        embroidery_Id: sourceRecord.embroidery_Id || sourceRecord.id,
        design_no: sourceRecord.design_no,
        serial_No: sourceRecord.serial_No,
        Manual_No: embroidery.Manual_No,
        from: location.pathname,
        suits_category: rows,
        source_step: sourceStep,
        source_id: sourceRecord.id,
        round,
      },
    });
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50 px-2 py-4"
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[92vh] w-[95%] max-w-xl flex-col overflow-hidden rounded-md bg-white shadow dark:bg-gray-700"
      >
        {/* ------------- HEADER ------------- */}
        <div className="flex items-start justify-between gap-4 border-b p-5 dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Move To Packing
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Round {round.no} · {round.available} of {round.capacity} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex shrink-0 justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
        <div className="flex-1 space-y-4 overflow-y-auto p-5">

          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_2rem] sm:grid-cols-[minmax(0,1fr)_7rem_2rem] items-center gap-3 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <span>Color</span>
              <span>Qty to pack</span>
              <span className="sr-only">Remove</span>
            </div>

            {rows.map((row, index) => {
              const overLimit =
                row.available !== undefined && row.received > row.available;
              return (
                <div
                  key={row.color}
                  className="grid grid-cols-[minmax(0,1fr)_5.5rem_2rem] sm:grid-cols-[minmax(0,1fr)_7rem_2rem] items-center gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-600"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {row.color}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {[                      
                        row.available !== undefined && `${row.available} available`,
                      ]
                        .filter(Boolean)}
                    </p>
                  </div>

                  <input
                    type="number"
                    min={1}
                    max={row.available}
                    placeholder="0"
                    aria-label={`Quantity to pack for ${row.color}`}
                    value={row.received || ""}
                    onChange={(e) => handleReceivedChange(index, e.target.value)}
                    className={`${inputClass} ${overLimit ? "!border-red-500" : ""}`}
                    required
                  />

                  {rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      title={`Remove ${row.color}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-gray-600"
                    >
                      <RxCross2 size={18} />
                      <span className="sr-only">Remove {row.color}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------- FOOTER ------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 dark:border-gray-600">
       
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!quantityError || requestedQuantity <= 0}
              className="px-4 py-2 text-sm rounded bg-[#252525] text-white disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-gray-200 dark:text-gray-800"
            >
              Move To Packing
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SkipToPackingModal;
