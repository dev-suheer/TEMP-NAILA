import { useEffect, useState } from "react";
import { IoAdd } from "react-icons/io5";
import { IoTrashOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { GetAllBags } from "../../features/InStockSlice";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  generateBillForOlderBuyerAsync
} from "../../features/GenerateBillSlice";
import { getBuyerByIdAsync } from "../../features/BuyerSlice";
import moment from "moment-timezone";
import AppSelect from "../../Component/Common/select/AppSelect";
import { getStockOptionLabel } from "../../Utils/Common";
import { getSuitsStockToGenerateBillAsync } from "../../features/BuyerSlice";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const OldBuyerGenerateBill = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const { user } = useSelector((state) => state.auth);
  const { Branches } = useSelector((state) => state.InStock);
  const PackagingData = useSelector((state) => state.InStock?.Bags);
  const { pdfLoading, generateBillloading } = useSelector(
    (state) => state.BuyerBills
  );
  const { BuyerById } = useSelector((state) => state.Buyer);
  const Bags = PackagingData?.data?.filter((item) => item.name !== "Bags");
  const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
  const { StockToGenerateBill } = useSelector((state) => state?.Buyer);
  const [otherBillData, setOtherBillData] = useState({
    o_b_quantity: "",
    o_b_amount: "",
    o_b_note: "",
    show: false,
  });

  const [billData, setBillData] = useState({
    buyerId: id,
    branchId: user?.user?.role === "superadmin" ? "" : user?.user?.branchId,
    serialNumber: "",
    name: BuyerById?.name,
    city: BuyerById?.city,
    cargo: "",
    phone: BuyerById?.phone,
    discountType: "RS",
    subTotal: "",
    date: today,
    bill_by: "",
    payment_Method: "",
    total: "",
    paid: "",
    remaining: "",
    discount: "",
    packaging: {
      name: "",
      id: "",
      quantity: "",
    },
    suits_data: [{ id: "", quantity: "", d_no: "", color: "", price: "" }],
    other_Bill_Data: {},
  });

  const [colorOptions, setColorOptions] = useState([[]]);
  const [pastBill, setPastBill] = useState(false);
  const [branchStockData, setBranchStockData] = useState([]);

  useEffect(() => {
    if (id) {
      dispatch(getBuyerByIdAsync({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getSuitsStockToGenerateBillAsync()).then((res) => {
      if (user?.user?.role !== "superadmin") {
        setBranchStockData(res?.payload);
      }
    });
    dispatch(GetAllBags());
  }, [user]);

  useEffect(() => {
    dispatch(GetAllBags());
  }, [dispatch]);

  useEffect(() => {
    if (BuyerById) {
      setBillData({
        buyerId: id,
        branchId: user?.user?.role === "superadmin" ? "" : user?.user?.branchId,
        serialNumber: "",
        name: BuyerById?.name || "",
        city: BuyerById?.city || "",
        cargo: "",
        phone: BuyerById?.phone || "",
        date: today,
        bill_by: "",
        payment_Method: "",
        total: "",
        paid: "",
        remaining: "",
        discount: "",
        packaging: {
          name: "",
          id: "",
          quantity: "",
        },
        suits_data: [{ id: "", quantity: "", d_no: "", color: "", price: "" }],
      });
    }
  }, [BuyerById, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Update the state with the new value
    const updatedBillData = {
      ...billData,
      [name]: value,
    };

    // Convert total and paid to numbers for calculation
    const paid = parseInt(updatedBillData.paid, 10) || 0;
    const discount = () => {
      return updatedBillData.discountType === "%"
        ? (parseInt(calculateSubTotal()) * parseInt(updatedBillData.discount)) /
            100 || 0
        : parseInt(updatedBillData.discount) || 0;
    };
    updatedBillData.subTotal = calculateSubTotal();

    // Calculate remaining value if total or paid has changed
    if (
      name === "paid" ||
      name === "discount" ||
      name === "discountType" ||
      name === "subTotal"
    ) {
      const otherBillAmount = parseInt(otherBillData.o_b_amount) || 0;
      updatedBillData.remaining =
        calculateSubTotal() - paid - discount() + otherBillAmount;
      updatedBillData.total = updatedBillData.remaining + paid;
    }

    setBillData(updatedBillData);
  };

  useEffect(() => {
    const e = {
      target: {
        name: "subTotal",
        value: "",
      },
    };
    handleInputChange(e);
  }, [billData.suits_data]);

  const handlePackagingChange = (e) => {
    const { name, value } = e.target;

    if (name === "packagingType") {
      const selectedOption = Bags.find((bag) => bag.id === value);
      setBillData((prevState) => ({
        ...prevState,
        packaging: {
          ...prevState.packaging,
          name: selectedOption?.name || "",
          id: selectedOption?.id || "",
        },
      }));
    } else if (name === "quantity") {
      setBillData((prevState) => ({
        ...prevState,
        packaging: {
          ...prevState.packaging,
          quantity: value,
        },
      }));
    }
  };

  const handleBranchChange = (e) => {
    const { value } = e.target;
    setBillData((prevState) => ({
      ...prevState,
      branchId: value,
      suits_data: [{ id: "", quantity: "", d_no: "", color: "", price: "" }],
      other_Bill_Data: {},
    }));
    setOtherBillData({
      o_b_quantity: "",
      o_b_amount: "",
      o_b_note: "",
      show: false,
    });
    const data = StockToGenerateBill.filter((branch) => {
      return branch.branchId === value;
    });
    setBranchStockData(data);
  };

  const addNewRow = () => {
    setBillData((prevData) => ({
      ...prevData,
      suits_data: [
        ...prevData.suits_data,
        { id: "", quantity: "", d_no: "", color: "", price: "" },
      ],
    }));
    setColorOptions((prevOptions) => [...prevOptions, []]);
  };

  const handleSuitDataChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSuitsData = [...billData.suits_data];
    updatedSuitsData[index] = { ...updatedSuitsData[index], [name]: value };
    setBillData((prevData) => ({
      ...prevData,
      suits_data: updatedSuitsData,
    }));
  };

  const removeRow = (index) => {
    setBillData((prevData) => ({
      ...prevData,
      suits_data: prevData.suits_data.filter((_, i) => i !== index),
    }));

    setColorOptions((prevOptions) => {
      const newColorOptions = prevOptions.filter((_, i) => i !== index);
      return newColorOptions;
    });
  };

  const validateBranch = () => {
    if (user?.user?.role === "superadmin" && !billData.branchId) {
      toast.error("Please select a branch");
    }
  };

  const handleSuitChange = (selectedDesignNumber, index) => {
    const designNumber = selectedDesignNumber.value;
    const newSuitsData = [...billData.suits_data];
    newSuitsData[index]["d_no"] = designNumber;
    newSuitsData[index]["color"] = "";
    newSuitsData[index]["id"] = "";

    //DATA BY DESIGN NUMBER
    const DataFromDesignNumber = branchStockData.filter(
      (item) => item.d_no === selectedDesignNumber.value
    );

    // Update color options for this specific row
    setColorOptions((prevOptions) => {
      const newColorOptions = [...prevOptions];
      newColorOptions[index] = DataFromDesignNumber;
      return newColorOptions;
    });

    setBillData({ ...billData, suits_data: newSuitsData });
  };

  const handleColorChange = (index, e) => {
    const selectedDesign = branchStockData.find(
      (design) => design.id === e.target.value
    );

    setBillData((prevState) => {
      const updatedSuitsData = [...prevState.suits_data];
      updatedSuitsData[index].color = selectedDesign?.color;
      updatedSuitsData[index].id = selectedDesign?.id;

      return {
        ...prevState,
        suits_data: updatedSuitsData,
      };
    });
  };

  const validatePackaging = (modifiedBillData) => {
    const payLoad = { ...modifiedBillData };
    if (
      modifiedBillData.packaging.id === "" ||
      modifiedBillData.packaging.quantity === 0
    ) {
      delete payLoad.packaging;
    }

    return payLoad;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const modifiedBillData = {
      ...billData,
      discount: Number(billData.discount),
      paid: Number(billData.paid),
      remaining: Number(billData.remaining),
      total: Number(billData.total),
      packaging: {
        ...billData.packaging,
        quantity: Number(billData.packaging.quantity),
      },
      suits_data: billData.suits_data.map((suit) => ({
        ...suit,
        quantity: Number(suit.quantity),
        d_no: Number(suit.d_no),
        price: Number(suit.price),
      })),
      pastBill: pastBill,
    };

    // Check Branch ID
    if (modifiedBillData.branchId === "") {
      toast.error("Please Select Branch");
      return;
    }

    if (otherBillData.show === true) {
      modifiedBillData.other_Bill_Data = otherBillData;
    }

    const payloadData = validatePackaging(modifiedBillData);

    dispatch(generateBillForOlderBuyerAsync(payloadData)).then((res) => {
      if (res.payload.succes === true) {
        setBillData({
          buyerId: id,
          branchId:
            user?.user?.role === "superadmin" ? "" : user?.user?.branchId,
          serialNumber: "",
          name: BuyerById?.name || "",
          city: BuyerById?.city || "",
          cargo: "",
          phone: BuyerById?.phone || "",
          date: today,
          bill_by: "",
          payment_Method: "",
          total: "",
          paid: "",
          remaining: "",
          discount: "",
          packaging: {
            name: "",
            id: "",
            quantity: "",
          },
          suits_data: [
            { id: "", quantity: "", d_no: "", color: "", price: "" },
          ],
          other_Bill_Data: {},
        });
        setOtherBillData({
          o_b_quantity: "",
          o_b_amount: "",
          o_b_note: "",
          show: false,
        });
        setPastBill(false);
        navigate('/dashboard/buyers')
      }
    });
  };

  const validateValue = (value) => {
    return value === undefined || value === null || isNaN(value) || value === ""
      ? 0
      : parseInt(value);
  };

  const calculateSubTotal = () => {
    const subtotal = billData?.suits_data?.reduce((total, suit) => {
      return total + validateValue(suit?.price) * validateValue(suit?.quantity);
    }, 0);
    return subtotal;
  };

  const handleOtherBillCahange = (e) => {
    let { name, value } = e.target;
    if (name === "o_b_amount" || name === "o_b_quantity") {
      value = value === "" ? "" : parseInt(value) || 0;
    }
    setOtherBillData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "o_b_amount") {
      setBillData((prevState) => {
        const oldAmount = otherBillData.o_b_amount || 0;
        const newTotal = prevState.total - oldAmount + value;
        const discount = () => {
          return prevState.discountType === "%"
            ? (parseInt(calculateSubTotal()) * parseInt(prevState.discount)) /
                100 || 0
            : parseInt(prevState.discount) || 0;
        };
        return {
          ...prevState,
          total: newTotal,
          remaining: calculateSubTotal() - prevState.paid - discount() + value,
        };
      });
    }
  };

  const handleBillType = (e) => {
    const value = e.target.checked;
    setPastBill(value);
    if (!value) {
      setBillData((prev) => ({
        ...prev,
        date: today,
      }));
    }
  };

  const handleOtherBillCheckbox = (value) => {
    setOtherBillData((prev) => ({
      ...prev,
      show: value,
      o_b_amount: "",
      o_b_quantity: "",
      o_b_note: "",
    }));
    setBillData((prevState) => ({
      ...prevState,
      total: prevState.total - otherBillData.o_b_amount,
      remaining: prevState.remaining - otherBillData.o_b_amount,
    }));
  };

  return (
    <>
      {!BuyerById ? (
        <PageLoader />
      ) : (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 overflow-y-auto min-h-screen rounded-lg">
          <div className="content">
            <div className="header pt-3 pb-5 w-full border-b">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-center">
                Generate Bill
              </h2>
            </div>
          </div>

          <div className="px-2 py-2 grid grid-cols-1 gap-4 border-2 rounded-lg lg:grid-cols-6 lg:gap-4 text-gray-900 dark:text-gray-100  dark:border-gray-600">
            <div className="box text-center">
              <div className="pb-1 font-normal " scope="col">
                <span className="text-red-500 ">S.N</span>-
                <span className="text-green-600">A.S.N</span>
              </div>
              <span className="text-red-500">
                {" "}
                {BuyerById?.serialNumber}
              </span>
              -<span className="text-green-600">{BuyerById?.autoSN}</span>
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

          <form onSubmit={handleSubmit}>
            {/* INPUT FIELDS DETAILS */}
            <div className="fields">
              {/* FIRST ROW */}
              <div className="mb-5 pt-6 grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <input
                    name="serialNumber"
                    type="text"
                    placeholder="Serial No"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.serialNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <input
                    name="name"
                    type="text"
                    placeholder="Name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.name}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>
                <div>
                  <input
                    name="city"
                    type="text"
                    placeholder="City"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.city}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>
                <div>
                  <input
                    name="cargo"
                    type="text"
                    placeholder="Cargo"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.cargo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* SECOND ROW */}
              <div className="mb-4 grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <input
                    name="phone"
                    type="number"
                    placeholder="Phone"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.phone}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>
                {/* HANDLIG PAST BILL LOGIC */}
                {user?.user?.role === "superadmin" ? (
                  <div className="col-span-1 grid grid-cols-2">
                    {pastBill ? (
                      <div className="col-span-1">
                        <input
                          name="date"
                          type="date"
                          placeholder="Date"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={billData.date}
                          onChange={handleInputChange}
                        />
                      </div>
                    ) : (
                      <div className="col-span-1">
                        <input
                          name="date"
                          type="date"
                          placeholder="Date"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={billData.date}
                          readOnly
                        />
                      </div>
                    )}
                    <div className="flex col-span-1 items-center my-auto justify-center space-x-2">
                      <label className="text-sm font-bold">Past Bill</label>
                      <input
                        type="checkbox"
                        id="BillType"
                        className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-0"
                        onChange={handleBillType}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      name="date"
                      type="date"
                      placeholder="Date"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={billData.date}
                      readOnly
                    />
                  </div>
                )}
                <div>
                  <input
                    name="bill_by"
                    type="text"
                    placeholder="Bill By"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.bill_by}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <ThemedSelect className="w-full"
                    id="payment-method"
                    name="payment_Method"
                    value={billData.payment_Method}
                    onChange={(e) =>
                      setBillData({
                        ...billData,
                        payment_Method: e.target.value,
                      })
                    }
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
              </div>

              {/* THIRD ROW */}
              <div className="mb-4 grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <ThemedSelect className="w-full"
                    id="packaging"
                    name="packagingType"
                    value={billData.packaging.id}
                    onChange={handlePackagingChange}
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
                </div>
                <div>
                  <input
                    name="quantity"
                    type="number"
                    placeholder="Packaging Quantity"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.packaging.quantity}
                    onChange={handlePackagingChange}
                  />
                </div>
                {user?.user?.role === "superadmin" ? (
                  <div>
                    <ThemedSelect className="w-full"
                      id="branches"
                      name="branchId"
                      value={billData.branchId}
                      onChange={handleBranchChange}
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
                  </div>
                ) : null}
                <div className="flex items-centerB my-auto justify-center space-x-2">
                  <label
                    htmlFor="otherBillData"
                    className="text-sm font-bold"
                  >
                    Add Other Bill Data
                  </label>
                  <input
                    type="checkbox"
                    id="otherBillData"
                    className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-0"
                    onChange={(e) =>
                      handleOtherBillCheckbox(e.target.checked)
                    }
                  />
                </div>
              </div>

              {/* OTHER BILL DATA ROW*/}
              {otherBillData.show && (
                <div
                  className={`mb-4 border-t pt-4 grid items-start grid-cols-2 gap-5 lg:grid-cols-5`}
                >
                  <div>
                    <input
                      name="o_b_amount"
                      type="number"
                      placeholder="Enter Other Bill Amount"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={otherBillData.o_b_amount}
                      onChange={handleOtherBillCahange}
                      required={otherBillData.show}
                    />
                  </div>

                  <div>
                    <input
                      name="o_b_quantity"
                      type="number"
                      placeholder="Enter Other Bill  Quantity"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={otherBillData.o_b_quantity}
                      onChange={handleOtherBillCahange}
                      required={otherBillData.show}
                    />
                  </div>

                  <div className="col-span-2 ">
                    <input
                      name="o_b_note"
                      type="text"
                      placeholder="Enter Other Bill Note"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      value={otherBillData.o_b_note}
                      onChange={handleOtherBillCahange}
                      required={otherBillData.show}
                    />
                  </div>
                </div>
              )}

              {/* FORTH ROW */}
              <div
                className={`mb-4 border-t pt-2 grid items-start grid-cols-2 gap-5 lg:grid-cols-5`}
              >
                <div>
                  <label className="text-sm font-semibold">Sub Total</label>
                  <input
                    name="subTotal"
                    type="number"
                    placeholder={0}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={calculateSubTotal() || 0}
                    readOnly
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Paid</label>
                  <input
                    name="paid"
                    type="number"
                    placeholder="Enter Value"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.paid}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="text-sm font-semibold">
                      Discount
                    </label>
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
                      <ThemedSelect variant="suffix" className="w-20 shrink-0"
                        name="discountType"
                        value={billData.discountType}
                        onChange={handleInputChange}
                      >
                        <option value="RS">RS</option>
                        <option value="%">%</option>
                      </ThemedSelect>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Bill Total
                  </label>
                  <input
                    name="total"
                    type="number"
                    placeholder={0}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.total}
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Remaining</label>
                  <input
                    name="remaining"
                    type="number"
                    placeholder={0}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={billData.remaining}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* DESIGN FIELDS */}
            <div className="fields mt-10">
              {/* header */}
              <div className="header flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-xl font-medium"> Enter Suit Details</h3>

                <button
                  type="button"
                  onClick={addNewRow}
                  className="inline-block rounded-md border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
                >
                  <IoAdd size={22} className="text-white" />
                </button>
              </div>

              {/* fields */}
              <div className="mb-5 pt-3 space-y-5">
                {billData.suits_data.map((suit, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-x-4"
                  >
                    <div className="grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 w-full">
                      <div>
                        <AppSelect className="w-full"
                          options={Array.from(
                            new Set(
                              branchStockData?.map(
                                (item) => `${item.d_no}-${item.category}`
                              )
                            )
                          ).map((uniqueItem) => {
                            const [d_no, category] = uniqueItem.split("-");
                            return {
                              value: Number(d_no),
                              label: `${d_no} (${category})`,
                            };
                          })}
                          onChange={(newValue) =>
                            handleSuitChange(newValue, index)
                          }
                          placeholder="Enter Design Number"
                          onMenuOpen={validateBranch}
                        />
                      </div>
                      <div>
                        <ThemedSelect className="w-full"
                          id="color"
                          name="color"
                          value={suit.id}
                          onChange={(e) => handleColorChange(index, e)}
                        >
                          <option value="" disabled>
                            Choose Color
                          </option>
                          {colorOptions[index]?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {getStockOptionLabel(item, item.total_quantity)}
                            </option>
                          ))}
                        </ThemedSelect>
                      </div>
                      <div>
                        <input
                          name="quantity"
                          type="number"
                          placeholder="Enter Quantity"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={suit.quantity}
                          onChange={(e) => handleSuitDataChange(index, e)}
                          required
                        />
                      </div>
                      <div>
                        <input
                          name="price"
                          type="number"
                          placeholder="Prices"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={suit.price}
                          onChange={(e) => handleSuitDataChange(index, e)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="inline-block rounded-md border border-red-700 bg-red-700 p-1.5 hover:bg-red-800 text-white"
                      >
                        <IoTrashOutline size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-center gap-x-4 pt-6">
              {pdfLoading || generateBillloading ? (
                <button
                  disabled
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 cursor-not-allowed rounded border border-gray-600 bg-gray-400 px-10 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring"
                >
                  <ButtonSpinner />
                  Generate Bill
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-gray-500"
                >
                  Generate Bill
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </>
  );
};

export default OldBuyerGenerateBill;
