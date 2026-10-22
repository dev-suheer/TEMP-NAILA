/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd, IoTrashOutline } from "react-icons/io5";
import { getBuyerBillDetailsAsync } from "../../../features/BuyerSlice";
import {
  exchangeBPairBillAsync,
  getBPairStockForBillAsync,
} from "../../../features/B_pairSlice";
import AppSelect from "../../../Component/Common/select/AppSelect";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import Chip from "../../../Component/Common/Chip";
import { getStockOptionLabel } from "../../../Utils/Common";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const emptyGiveRow = { d_no: "", bpair_id: "", quantity: "" };

const toQuantity = (value) => (value === "" ? 0 : Number(value));

const BPairExchange = ({ bill, closeModal, onExchanged }) => {
  const dispatch = useDispatch();
  const { BuyerBillDetails, buyerBillDetailsLoading } = useSelector(
    (state) => state.Buyer
  );
  const { bPairStockForBill, bPairStockForBillLoading, exchangeLoading } =
    useSelector((state) => state.B_Pair);

  const [takeBack, setTakeBack] = useState({});
  const [giveRows, setGiveRows] = useState([emptyGiveRow]);
  const [note, setNote] = useState("");

  useEffect(() => {
    dispatch(getBuyerBillDetailsAsync({ billId: bill.id }));
    dispatch(getBPairStockForBillAsync());
  }, [bill.id, dispatch]);

  const holdings = BuyerBillDetails?.holdings || [];

  const designOptions = Array.from(
    new Map(
      bPairStockForBill.map((item) => [
        item.d_no,
        { value: item.d_no, label: `${item.d_no} (${item.category})` },
      ])
    ).values()
  );

  const updateGiveRow = (index, values) => {
    setGiveRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...values } : row))
    );
  };

  const totalTakeBack = holdings.reduce(
    (total, holding) => total + toQuantity(takeBack[holding.bpair_id] ?? ""),
    0
  );
  const totalGive = giveRows.reduce(
    (total, row) => total + toQuantity(row.quantity),
    0
  );

  const takeBackInvalid = holdings.some((holding) => {
    const quantity = toQuantity(takeBack[holding.bpair_id] ?? "");
    return (
      !Number.isInteger(quantity) || quantity < 0 || quantity > holding.quantity
    );
  });
  const giveRowsInvalid = giveRows.some((row) => {
    const stock = bPairStockForBill.find((item) => item.id === row.bpair_id);
    const quantity = toQuantity(row.quantity);
    return (
      !stock ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > stock.quantity
    );
  });
  const hasOverlap = giveRows.some(
    (row) => toQuantity(takeBack[row.bpair_id] ?? "") > 0
  );
  const isBalanced = totalTakeBack > 0 && totalTakeBack === totalGive;
  const canSubmit =
    isBalanced && !takeBackInvalid && !giveRowsInvalid && !hasOverlap;

  const handleSubmit = () => {
    const payload = {
      bill_Id: bill.id,
      note,
      returned_items: holdings
        .filter((holding) => toQuantity(takeBack[holding.bpair_id] ?? "") > 0)
        .map((holding) => ({
          bpair_id: holding.bpair_id,
          quantity: toQuantity(takeBack[holding.bpair_id]),
        })),
      issued_items: giveRows.map((row) => ({
        bpair_id: row.bpair_id,
        quantity: toQuantity(row.quantity),
      })),
    };
    dispatch(exchangeBPairBillAsync(payload)).then((res) => {
      if (res.payload?.success) {
        onExchanged?.();
        closeModal();
      }
    });
  };

  const inputClass =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white";

  const loading = buyerBillDetailsLoading || bPairStockForBillLoading;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-start justify-between gap-4 p-5 border-b dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Exchange B-Pair Suits
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Bill {bill.serialNumber}-{bill.autoSN} · {bill.name}
              is involved, quantities must be equal
            </p>
          </div>
          <button
            onClick={closeModal}
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

        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <div
              className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2 text-gray-900 dark:text-gray-100">
            {/* ------------- TAKE BACK ------------- */}
            <div>
              <h4 className="mb-1 text-sm font-semibold">Take back from buyer</h4>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-300">
                Suits the buyer currently holds from this bill
              </p>
              <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-2">D#</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Color</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-center">Holds</th>
                      <th className="px-3 py-2">Take Back</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.length > 0 ? (
                      holdings.map((holding) => {
                        const value = takeBack[holding.bpair_id] ?? "";
                        const quantity = toQuantity(value);
                        const invalid =
                          !Number.isInteger(quantity) ||
                          quantity < 0 ||
                          quantity > holding.quantity;
                        return (
                          <tr
                            key={holding.bpair_id}
                            className="border-t border-gray-200 dark:border-gray-600"
                          >
                            <td className="px-3 py-2">{holding.d_no}</td>
                            <td className="px-3 py-2">{holding.category}</td>
                            <td className="px-3 py-2">{holding.color}</td>
                            <td className="px-3 py-2">{holding.stitch_type}</td>
                            <td className="px-3 py-2 text-center">
                              {holding.quantity}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                max={holding.quantity}
                                placeholder="0"
                                className={`${inputClass} w-20 ${
                                  invalid ? "!border-red-500" : ""
                                }`}
                                value={value}
                                onChange={(e) =>
                                  setTakeBack((prev) => ({
                                    ...prev,
                                    [holding.bpair_id]: e.target.value,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-6 text-center text-gray-500 dark:text-gray-300"
                        >
                          Buyer holds no suits from this bill
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ------------- GIVE ------------- */}
            <div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Give to buyer</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Any design, category or color from B-Pair stock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGiveRows((prev) => [...prev, emptyGiveRow])}
                  className="inline-block rounded-md border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800"
                >
                  <IoAdd size={18} className="text-white" />
                </button>
              </div>
              <div className="space-y-3">
                {giveRows.map((row, index) => {
                  const colorOptions = bPairStockForBill.filter(
                    (item) => item.d_no === row.d_no
                  );
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <AppSelect
                        className="w-40 shrink-0"
                        options={designOptions}
                        placeholder="Design No"
                        value={
                          designOptions.find(
                            (option) => option.value === row.d_no
                          ) || null
                        }
                        onChange={(option) =>
                          updateGiveRow(index, {
                            d_no: option?.value ?? "",
                            bpair_id: "",
                          })
                        }
                      />
                      <ThemedSelect
                        className="w-full"
                        value={row.bpair_id}
                        onChange={(e) =>
                          updateGiveRow(index, { bpair_id: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Color
                        </option>
                        {colorOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {getStockOptionLabel(item, item.quantity)}
                          </option>
                        ))}
                      </ThemedSelect>
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        className={`${inputClass} w-20 shrink-0`}
                        value={row.quantity}
                        onChange={(e) =>
                          updateGiveRow(index, { quantity: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        disabled={giveRows.length === 1}
                        onClick={() =>
                          setGiveRows((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="shrink-0 rounded-md border border-red-700 bg-red-700 p-1.5 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <IoTrashOutline size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ------------- NOTE ------------- */}
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-semibold">Note</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Reason for exchange (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ------------- FOOTER ------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 dark:border-gray-600">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span>
              Taking back <strong>{totalTakeBack}</strong> · Giving{" "}
              <strong>{totalGive}</strong>
            </span>
            <Chip variant={isBalanced ? "success" : "warning"}>
              {isBalanced ? "Balanced" : "Quantities must match"}
            </Chip>
            {hasOverlap && (
              <Chip variant="danger">
                Same suit cannot be taken back and given
              </Chip>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || exchangeLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded bg-[#252525] text-white disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-gray-200 dark:text-gray-800"
            >
              {exchangeLoading && <ButtonSpinner />}
              Confirm Exchange
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BPairExchange;
