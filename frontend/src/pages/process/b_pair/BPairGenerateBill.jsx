import { useEffect, useState } from "react";
import { IoAdd, IoTrashOutline } from "react-icons/io5";
import { Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { GetAllBags } from "../../../features/InStockSlice";
import {
  generateBillForOlderBuyerAsync,
  generateBuyerBillAsync,
} from "../../../features/GenerateBillSlice";
import {
  clearBuyerSearchResults,
  getBuyerByIdAsync,
  searchBuyersForBillAsync,
} from "../../../features/BuyerSlice";
import { getBPairStockForBillAsync } from "../../../features/B_pairSlice";
import {
  BILL_TYPES,
  getStatusVariant,
  getStockOptionLabel,
  getTodayDate,
} from "../../../Utils/Common";
import AppSelect from "../../../Component/Common/select/AppSelect";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import Chip from "../../../Component/Common/Chip";
import PageLoader from "../../../Component/Loader/PageLoader";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const emptySuitRow = { id: "", d_no: "", color: "", quantity: "", price: "" };
const emptyOtherBill = {
  o_b_quantity: "",
  o_b_amount: "",
  o_b_note: "",
  show: false,
};

const toNumber = (value) => Number(value) || 0;

const inputClass =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-gray-500";

const BPairGenerateBill = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: buyerId } = useParams();
  const isExistingBuyer = Boolean(buyerId);
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const { user } = useSelector((state) => state.auth);
  const { Branches } = useSelector((state) => state.InStock);
  const PackagingData = useSelector((state) => state.InStock?.Bags);
  const { generateBillloading } = useSelector((state) => state.BuyerBills);
  const { BuyerById, buyerBillSearchLoading, buyerBillSearchResults } =
    useSelector((state) => state.Buyer);
  const { bPairStockForBill } = useSelector((state) => state.B_Pair);
  const Bags = PackagingData?.data?.filter((item) => item.name !== "Bags");
  const isSuperAdmin = user?.user?.role === "superadmin";
  const today = getTodayDate()

  const [form, setForm] = useState({
    branchId: isSuperAdmin ? "" : user?.user?.branchId,
    serialNumber: "",
    name: "",
    city: "",
    cargo: "",
    phone: "",
    date: today,
    bill_by: "",
    payment_Method: "",
    discount: "",
    discountType: "RS",
    paid: "",
    packaging: { id: "", quantity: "" },
  });
  const [suits, setSuits] = useState([emptySuitRow]);
  const [otherBill, setOtherBill] = useState(emptyOtherBill);
  const [pastBill, setPastBill] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState("");
  const [submittedBuyerSearch, setSubmittedBuyerSearch] = useState("");

  useEffect(() => {
    dispatch(getBPairStockForBillAsync());
    dispatch(GetAllBags());
  }, [dispatch]);

  useEffect(() => {
    if (buyerId) dispatch(getBuyerByIdAsync({ id: buyerId }));
  }, [buyerId, dispatch]);

  useEffect(() => {
    const name = buyerSearch.trim();
    let searchRequest;

    dispatch(clearBuyerSearchResults());
    setSubmittedBuyerSearch("");
    if (!name) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSubmittedBuyerSearch(name);
      searchRequest = dispatch(searchBuyersForBillAsync(name));
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      searchRequest?.abort();
    };
  }, [buyerSearch, dispatch]);

  //BILL DATA (TOTALS ARE DERIVED, NEVER STORED)
  const buyer = isExistingBuyer
    ? {
        buyerId,
        name: BuyerById?.name || "",
        city: BuyerById?.city || "",
        phone: BuyerById?.phone || "",
      }
    : { name: form.name, city: form.city, phone: form.phone };
  const subTotal = suits.reduce(
    (total, suit) => total + toNumber(suit.price) * toNumber(suit.quantity),
    0
  );
  const discountAmount =
    form.discountType === "%"
      ? (subTotal * toNumber(form.discount)) / 100
      : toNumber(form.discount);
  const otherBillAmount = otherBill.show ? toNumber(otherBill.o_b_amount) : 0;
  const total = subTotal - discountAmount + otherBillAmount;
  const remaining = total - toNumber(form.paid);
  const billData = {
    ...form,
    ...buyer,
    subTotal,
    total,
    remaining,
    suits_data: suits,
  };

  const designOptions = Array.from(
    new Map(
      bPairStockForBill.map((item) => [
        item.d_no,
        { value: item.d_no, label: `${item.d_no} (${item.category})` },
      ])
    ).values()
  );

  const openExistingBuyerBill = (id) => {
    setBuyerSearch("");
    navigate(`/dashboard/bpair-bill/${id}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updatePackaging = (values) => {
    setForm((prev) => ({
      ...prev,
      packaging: { ...prev.packaging, ...values },
    }));
  };

  const handlePastBillChange = (e) => {
    const { checked } = e.target;
    setPastBill(checked);
    if (!checked) setForm((prev) => ({ ...prev, date: today }));
  };

  const handleOtherBillChange = (e) => {
    const { name, value } = e.target;
    setOtherBill((prev) => ({ ...prev, [name]: value }));
  };

  const updateSuit = (index, values) => {
    setSuits((prev) =>
      prev.map((suit, i) => (i === index ? { ...suit, ...values } : suit))
    );
  };

  const handleColorChange = (index, bPairId) => {
    const stock = bPairStockForBill.find((item) => item.id === bPairId);
    updateSuit(index, {
      id: bPairId,
      color: stock?.color || "",
      price: stock?.sale_price ?? "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.branchId) {
      toast.error("Please Select Branch");
      return;
    }

    const { packaging, ...details } = billData;
    const packagingQuantity = toNumber(packaging.quantity);
    const payload = {
      ...details,
      discount: toNumber(details.discount),
      paid: toNumber(details.paid),
      suits_data: suits.map((suit) => ({
        ...suit,
        d_no: Number(suit.d_no),
        quantity: Number(suit.quantity),
        price: Number(suit.price),
      })),
      pastBill,
      bill_type: BILL_TYPES.B_PAIR,
      ...(packaging.id &&
        packagingQuantity > 0 && {
          packaging: { id: packaging.id, quantity: packagingQuantity },
        }),
      ...(otherBill.show && {
        other_Bill_Data: {
          ...otherBill,
          o_b_amount: toNumber(otherBill.o_b_amount),
          o_b_quantity: toNumber(otherBill.o_b_quantity),
        },
      }),
    };

    const generateBill = isExistingBuyer
      ? generateBillForOlderBuyerAsync
      : generateBuyerBillAsync;
    dispatch(generateBill(payload)).then((res) => {
      if (res.payload?.succes) navigate("/dashboard/bpair");
    });
  };

  if (isExistingBuyer && BuyerById?.id !== buyerId) return <PageLoader />;

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 overflow-y-auto min-h-screen rounded-lg">
      <div className="header pt-3 pb-5 w-full border-b">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-center text-gray-900 dark:text-white">
          Generate B-Pair Bill
        </h2>
      </div>

      {/* -------------- BUYER SUMMARY / BUYER SEARCH -------------- */}
      {isExistingBuyer ? (
        <div className="mt-6 px-2 py-2 grid grid-cols-1 gap-4 border-2 rounded-lg lg:grid-cols-6 lg:gap-4 text-gray-900 dark:text-gray-100 dark:border-gray-600">
          <div className="box text-center">
            <div className="pb-1 font-normal">
              <span className="text-red-500">S.N</span>-
              <span className="text-green-600">A.S.N</span>
            </div>
            <span className="text-red-500">{BuyerById?.serialNumber}</span>-
            <span className="text-green-600">{BuyerById?.autoSN}</span>
          </div>
          <div className="box text-center">
            <h3 className="pb-1 font-normal">Phone Number</h3>
            <h3>{BuyerById?.phone}</h3>
          </div>
          <div className="box text-center">
            <h3 className="pb-1 font-normal">Name</h3>
            <h3>{BuyerById?.name}</h3>
          </div>
          <div className="box text-center">
            <h3 className="pb-1 font-normal text-red-500">Total Debit</h3>
            <h3 className="font-normal text-red-500">
              {BuyerById?.virtual_account?.total_debit}
            </h3>
          </div>
          <div className="box text-center">
            <h3 className="pb-1 font-normal">Total Credit</h3>
            <h3>{BuyerById?.virtual_account?.total_credit}</h3>
          </div>
          <div className="box text-center">
            <h3 className="pb-1 font-normal">Total Balance</h3>
            <h3>{BuyerById?.virtual_account?.total_balance}</h3>
          </div>
        </div>
      ) : (
        <section className="mt-6 border-b border-gray-200 pb-6 dark:border-gray-700">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Find buyer account
          </h3>

          <div className="relative max-w-2xl">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="search"
              aria-label="Search buyer by name"
              placeholder="Search buyer by name"
              className="h-11 w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
              value={buyerSearch}
              onChange={(e) => setBuyerSearch(e.target.value)}
            />
          </div>

          {submittedBuyerSearch && (
            <div className="mt-3 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              {buyerBillSearchLoading ? (
                <div className="flex h-24 items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-300">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800 dark:border-gray-600 dark:border-t-gray-100" />
                  Searching buyers
                </div>
              ) : buyerBillSearchResults.length ? (
                <div className="max-h-[300px] divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
                  <div className="sticky top-0 z-10 hidden grid-cols-[1.3fr_1fr_1fr_0.9fr_0.9fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500 md:grid dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <span>Name</span>
                    <span>City</span>
                    <span>Phone</span>
                    <span>Status</span>
                    <span className="text-right">Balance</span>
                  </div>
                  {buyerBillSearchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => openExistingBuyerBill(result.id)}
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 md:grid md:grid-cols-[1.3fr_1fr_1fr_0.9fr_0.9fr] md:items-center md:gap-3 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                    >
                      <span className="truncate font-medium text-gray-900 dark:text-white">
                        {result.name}
                      </span>
                      <span className="truncate">{result.city || "--"}</span>
                      <span className="truncate">{result.phone || "--"}</span>
                      <span>
                        <Chip
                          variant={getStatusVariant(
                            result.virtual_account?.status
                          )}
                        >
                          {result.virtual_account?.status || "No status"}
                        </Chip>
                      </span>
                      <span className="font-semibold text-gray-900 md:text-right dark:text-white">
                        Rs {Number(result.virtual_account?.total_balance) || 0}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-gray-300">
                  No buyers found.
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <form onSubmit={handleSubmit}>
        {/* FIRST ROW */}
        <div className="mb-5 pt-6 grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <input
            name="serialNumber"
            type="text"
            placeholder="Serial No"
            className={inputClass}
            value={billData.serialNumber}
            onChange={handleInputChange}
            required
          />
          <input
            name="name"
            type="text"
            placeholder="Name"
            className={inputClass}
            value={billData.name}
            onChange={handleInputChange}
            readOnly={isExistingBuyer}
            required
          />
          <input
            name="city"
            type="text"
            placeholder="City"
            className={inputClass}
            value={billData.city}
            onChange={handleInputChange}
            readOnly={isExistingBuyer}
            required
          />
          <input
            name="cargo"
            type="text"
            placeholder="Cargo"
            className={inputClass}
            value={billData.cargo}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* SECOND ROW */}
        <div className="mb-4 grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <input
            name="phone"
            type="number"
            placeholder="Phone"
            className={inputClass}
            value={billData.phone}
            onChange={handleInputChange}
            readOnly={isExistingBuyer}
            required
          />

          {isSuperAdmin ? (
            <div className="grid grid-cols-2">
              <input
                name="date"
                type="date"
                className={inputClass}
                value={billData.date}
                onChange={handleInputChange}
                readOnly={!pastBill}
              />
              <div className="flex items-center my-auto justify-center space-x-2">
                <label htmlFor="pastBill" className="text-sm font-bold">
                  Past Bill
                </label>
                <input
                  type="checkbox"
                  id="pastBill"
                  className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-0"
                  checked={pastBill}
                  onChange={handlePastBillChange}
                />
              </div>
            </div>
          ) : (
            <input
              name="date"
              type="date"
              className={inputClass}
              value={billData.date}
              readOnly
            />
          )}

          <input
            name="bill_by"
            type="text"
            placeholder="Bill By"
            className={inputClass}
            value={billData.bill_by}
            onChange={handleInputChange}
            required
          />

          <ThemedSelect
            className="w-full"
            name="payment_Method"
            value={billData.payment_Method}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>
              Select Payment Method
            </option>
            {PaymentData?.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </ThemedSelect>
        </div>

        {/* THIRD ROW */}
        <div className="mb-4 grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <ThemedSelect
            className="w-full"
            value={billData.packaging.id}
            onChange={(e) => updatePackaging({ id: e.target.value })}
          >
            <option value="" disabled>
              Select Packaging
            </option>
            {Bags?.map((bag) => (
              <option key={bag.id} value={bag.id}>
                {bag.name}
              </option>
            ))}
          </ThemedSelect>

          <input
            type="number"
            placeholder="Packaging Quantity"
            className={inputClass}
            value={billData.packaging.quantity}
            onChange={(e) => updatePackaging({ quantity: e.target.value })}
          />

          {isSuperAdmin && (
            <ThemedSelect
              className="w-full"
              name="branchId"
              value={billData.branchId}
              onChange={handleInputChange}
            >
              <option value="" disabled>
                Select Branch
              </option>
              {Branches?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </option>
              ))}
            </ThemedSelect>
          )}

          <div className="flex items-center my-auto justify-center space-x-2">
            <label htmlFor="otherBillData" className="text-sm font-bold">
              Add Other Bill Data
            </label>
            <input
              type="checkbox"
              id="otherBillData"
              className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-0"
              checked={otherBill.show}
              onChange={(e) =>
                setOtherBill({ ...emptyOtherBill, show: e.target.checked })
              }
            />
          </div>
        </div>

        {/* OTHER BILL DATA ROW */}
        {otherBill.show && (
          <div className="mb-4 border-t pt-4 grid items-start grid-cols-2 gap-5 lg:grid-cols-5">
            <input
              name="o_b_amount"
              type="number"
              placeholder="Enter Other Bill Amount"
              className={inputClass}
              value={otherBill.o_b_amount}
              onChange={handleOtherBillChange}
              required
            />
            <input
              name="o_b_quantity"
              type="number"
              placeholder="Enter Other Bill Quantity"
              className={inputClass}
              value={otherBill.o_b_quantity}
              onChange={handleOtherBillChange}
              required
            />
            <div className="col-span-2">
              <input
                name="o_b_note"
                type="text"
                placeholder="Enter Other Bill Note"
                className={inputClass}
                value={otherBill.o_b_note}
                onChange={handleOtherBillChange}
                required
              />
            </div>
          </div>
        )}

        {/* FORTH ROW */}
        <div className="mb-4 border-t pt-2 grid items-start grid-cols-2 gap-5 lg:grid-cols-5">
          <div>
            <label className="text-sm font-semibold">Sub Total</label>
            <input
              type="number"
              className={inputClass}
              value={subTotal}
              readOnly
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Paid</label>
            <input
              name="paid"
              type="number"
              placeholder="Enter Value"
              className={inputClass}
              value={billData.paid}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Discount</label>
            <div className="flex">
              <input
                name="discount"
                type="number"
                placeholder="Enter Value"
                className="bg-gray-50 border rounded-tl-md rounded-bl-md border-gray-300 text-gray-900 text-sm focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                value={billData.discount}
                onChange={handleInputChange}
                required
              />
              <ThemedSelect
                variant="suffix"
                className="w-20 shrink-0"
                name="discountType"
                value={billData.discountType}
                onChange={handleInputChange}
              >
                <option value="RS">RS</option>
                <option value="%">%</option>
              </ThemedSelect>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Bill Total</label>
            <input
              type="number"
              className={inputClass}
              value={total}
              readOnly
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Remaining</label>
            <input
              type="number"
              className={inputClass}
              value={remaining}
              readOnly
            />
          </div>
        </div>

        {/* SUIT FIELDS */}
        <div className="mt-10">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Enter B-Pair Suit Details
            </h3>
            <button
              type="button"
              onClick={() => setSuits((prev) => [...prev, emptySuitRow])}
              className="inline-block rounded-md border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
            >
              <IoAdd size={22} className="text-white" />
            </button>
          </div>

          <div className="mb-5 pt-3 space-y-5">
            {suits.map((suit, index) => {
              const colorOptions = bPairStockForBill.filter(
                (item) => item.d_no === suit.d_no
              );
              const selectedStock = colorOptions.find(
                (item) => item.id === suit.id
              );
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-x-4"
                >
                  <div className="grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 w-full">
                    <AppSelect
                      className="w-full"
                      options={designOptions}
                      placeholder="Enter Design Number"
                      value={
                        designOptions.find(
                          (option) => option.value === suit.d_no
                        ) || null
                      }
                      onChange={(option) =>
                        updateSuit(index, {
                          d_no: option.value,
                          id: "",
                          color: "",
                          price: "",
                        })
                      }
                    />
                    <ThemedSelect
                      className="w-full"
                      value={suit.id}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Choose Color
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
                      max={selectedStock?.quantity}
                      placeholder="Enter Quantity"
                      className={inputClass}
                      value={suit.quantity}
                      onChange={(e) =>
                        updateSuit(index, { quantity: e.target.value })
                      }
                      required
                    />
                    <input
                      type="number"
                      placeholder="Prices"
                      className={inputClass}
                      value={suit.price}
                      onChange={(e) =>
                        updateSuit(index, { price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button
                    type="button"
                    disabled={suits.length === 1}
                    onClick={() =>
                      setSuits((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="inline-block rounded-md border border-red-700 bg-red-700 p-1.5 hover:bg-red-800 text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IoTrashOutline size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-center gap-x-4 pt-6">
          <button
            type="submit"
            disabled={generateBillloading}
            className={`${buttonClass} disabled:cursor-not-allowed disabled:bg-gray-400`}
          >
            {generateBillloading && <ButtonSpinner />}
            Generate Bill
          </button>
        </div>
      </form>
    </section>
  );
};

export default BPairGenerateBill;
