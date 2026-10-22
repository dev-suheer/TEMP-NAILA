import { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { MdDeleteOutline } from "react-icons/md";
import { STITCH_TYPES } from "../../../Utils/Common";

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isInteger(number) ? number : Number(number.toFixed(3));
};

const getColumns = (category) => {
  if (category === "Base") {
    return [
      { key: "colour", label: "Color", render: (row) => row.colour || "--" },
      { key: "roleQuantity", label: "Qty", render: (row) => formatNumber(row.roleQuantity) },
      { key: "measurement", label: "Measurement", render: (row) => formatNumber(row.measurement) },
      { key: "rate", label: "Price", render: (row) => formatNumber(row.rate) },
      { key: "rowTotal", label: "Total", render: (row) => formatNumber(row.rowTotal) },
    ];
  }

  if (category === "Lace") {
    return [
      { key: "roleQuantity", label: "Qty", render: (row) => formatNumber(row.roleQuantity) },
      { key: "measurement", label: "Measurement", render: (row) => formatNumber(row.measurement) },
      { key: "rate", label: "Price", render: (row) => formatNumber(row.rate) },
      { key: "rowQuantity", label: "Row Qty", render: (row) => `${formatNumber(row.rowQuantity)} m` },
      { key: "rowTotal", label: "Total", render: (row) => formatNumber(row.rowTotal) },
    ];
  }

  if (category === "Suits") {
    return [
      { key: "design_no", label: "D# No", render: (row) => row.design_no || "--" },
      { key: "category", label: "Category", render: (row) => row.category || "--" },
      { key: "color", label: "Color", render: (row) => row.colour || "--" },
      {
        key: "stitch_type",
        label: "Type",
        render: (row) => row.stitch_type || STITCH_TYPES.UNSTITCHED,
      },
      { key: "quantity", label: "Qty", render: (row) => formatNumber(row.quantity) },
      { key: "cost_price", label: "Cost", render: (row) => formatNumber(row.cost_price) },
      { key: "sale_price", label: "Sale", render: (row) => formatNumber(row.sale_price) },
      { key: "rowTotal", label: "Total", render: (row) => formatNumber(row.rowTotal) },
    ];
  }

  return [
    { key: "category", label: "Category", render: (row) => row.category || "--" },
    { key: "roleQuantity", label: "Qty", render: (row) => formatNumber(row.roleQuantity) },
    { key: "rate", label: "Price", render: (row) => formatNumber(row.rate) },
    { key: "rowTotal", label: "Total", render: (row) => formatNumber(row.rowTotal) },
  ];
};

const PurchaseBillRowsModal = ({
  isOpen,
  onClose,
  bill,
  category,
  onDeletePart,
  onPartialDeleteColor,
}) => {
  const [colorDeleteRow, setColorDeleteRow] = useState(null);
  const [colorDeleteMode, setColorDeleteMode] = useState("full");
  const [partialQuantity, setPartialQuantity] = useState("");

  if (!isOpen) return null;

  const rows = bill?.measurementData || [];
  const columns = getColumns(category);
  const suitCategories = [...new Set(rows.map((row) => row.category).filter(Boolean))];
  const canDeleteColorRows =
    ["Suits", "Base"].includes(category) &&
    onDeletePart &&
    onPartialDeleteColor &&
    rows.length > 1;
  const canDeleteSuitParts =
    category === "Suits" &&
    onDeletePart &&
    !(rows.length === 1 && suitCategories.length === 1);
  const selectedRowQuantity = Number(
    category === "Base"
      ? colorDeleteRow?.roleQuantity
      : colorDeleteRow?.quantity || 0
  );

  const openColorDeleteModal = (row) => {
    setColorDeleteRow(row);
    setColorDeleteMode("full");
    setPartialQuantity("");
  };

  const closeColorDeleteModal = () => {
    setColorDeleteRow(null);
    setColorDeleteMode("full");
    setPartialQuantity("");
  };

  const isPartialDeleteQuantityValid = Number(partialQuantity || 0) < selectedRowQuantity;

  const confirmColorDelete = (event) => {
    event.preventDefault();
    if (!colorDeleteRow) return;

    const payload = {
      billId: bill?.id,
      rowId: colorDeleteRow.id,
      scope: "color",
    };

    if (colorDeleteMode === "partial") {
      const deleteQuantity = Number(partialQuantity);
      if (!deleteQuantity || deleteQuantity <= 0) return;
      if (!isPartialDeleteQuantityValid) return;
      closeColorDeleteModal();
      onPartialDeleteColor({
        billId: bill?.id,
        rowId: colorDeleteRow.id,
        quantity: deleteQuantity,
      });
      return;
    }

    closeColorDeleteModal();
    onDeletePart(payload);
  };

  const isSubmitDisabled = colorDeleteMode === "partial" &&
                  (!Number(partialQuantity) ||
                    Number(partialQuantity) <= 0 ||
                    !isPartialDeleteQuantityValid);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4 px-3 w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {category} Details
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
              Bill No {bill?.bill_no || "--"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            type="button"
          >
            <RxCross2 size={18} />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <div className="p-4 md:p-5">
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              {canDeleteSuitParts && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {suitCategories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        onDeletePart({
                          billId: bill?.id,
                          category: item,
                          scope: "category",
                        })
                      }
                      className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <MdDeleteOutline size={16} />
                      {item}
                    </button>
                  ))}
                </div>
              )}
              <table className="w-full text-sm text-center text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="px-3 py-3 text-center">
                        {column.label}
                      </th>
                    ))}
                    {canDeleteColorRows && (
                      <th className="px-3 py-3 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={`${category}-${bill?.bill_no || "bill"}-${index}`}
                      className="border-b bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-3 py-3 text-center font-medium text-gray-900 dark:text-white"
                        >
                          {column.render(row)}
                        </td>
                      ))}
                      {canDeleteColorRows && (
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => openColorDeleteModal(row)}
                            title="Delete color"
                          >
                            <MdDeleteOutline
                              size={22}
                              className="cursor-pointer text-red-500"
                            />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              No row details available.
            </p>
          )}
        </div>
      </div>
      {colorDeleteRow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
          <form
            onSubmit={confirmColorDelete}
            className="w-full max-w-md rounded-md bg-white p-5 shadow-lg dark:bg-gray-700"
          >
            <div className="flex items-start justify-between border-b pb-3 dark:border-gray-600">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete {category} Color
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  {colorDeleteRow.colour || "--"} - Available Qty {formatNumber(selectedRowQuantity)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeColorDeleteModal}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <RxCross2 size={20} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setColorDeleteMode("full");
                  setPartialQuantity("");
                }}
                className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                  colorDeleteMode === "full"
                    ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                Full Delete
              </button>
              <button
                disabled={selectedRowQuantity <= 1}
                type="button"
                onClick={() => setColorDeleteMode("partial")}
                className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                  colorDeleteMode === "partial"
                    ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                Partial Delete
              </button>
            </div>

            {colorDeleteMode === "partial" && (
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {category === "Base" ? "Qty To Delete" : "Quantity To Delete"}
                </span>
                <input
                  type="number"
                  min={category === "Base" ? "0.001" : "1"}
                  step={category === "Base" ? "any" : "1"}
                  max={selectedRowQuantity}
                  value={partialQuantity}
                  onChange={(event) => setPartialQuantity(event.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-gray-300 focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </label>
            )}

            {colorDeleteMode === "partial" &&
              !isPartialDeleteQuantityValid && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  Invalid quantity.
                </p>
              )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeColorDeleteModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PurchaseBillRowsModal;
