import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  generateCalenderBillAsync,
  generateCalenderGatePssPdfAsync,
  GetSingleCalender,
  UpdateCalenderAsync,
} from "../../../features/CalenderSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import {
  createCutting,
  getCuttingDataBypartyNameAsync,
} from "../../../features/CuttingSlice";
import { GETEmbroiderySIngle } from "../../../features/EmbroiderySlice";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import ReactSearchBox from "react-search-box";
import moment from "moment-timezone";
import toast from "react-hot-toast";
import ProcessAvailabilityCard from "../../../Component/Common/ProcessAvailabilityCard";
import { RxCross2 } from "react-icons/rx";
import { FiPlus } from "react-icons/fi";
import {
  formatReadableDate,
  getAvailableColors,
  getColorLimitError,
  getColorOptionLabel,
  getRecordForId,
} from "../../../Utils/Common";
import StatusChip from "../../../Component/Common/StatusChip";
import PageLoader from "../../../Component/Loader/PageLoader";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const CalendarDetails = () => {
  const { id } = useParams();
  const {
    loading,
    SingleCalender: storedCalender,
    generateCAlenderBillLoading,
    CalenderpdfLoading,
  } = useSelector((state) => state.Calender);
  const SingleCalender = getRecordForId(storedCalender, id);
  const { loading: IsLoading, previousDataByPartyName } = useSelector(
    (state) => state.Cutting
  );
  const { SingleEmbroidery } = useSelector((state) => state.Embroidery);
  const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isUpdateReceivedConfirmOpen, setIsUpdateReceivedConfirmOpen] =
    useState(false);
  const [isCompletedConfirmOpen, setIsCompletedConfirmOpen] = useState(false);
  const [isGenerateGatePassOpen, setisGenerateGatePassOpen] = useState(false);
  const [partyValue, setPartyValue] = useState("newParty");
  const [accountData, setAccountData] = useState(null);
  const [processBillModal, setProcessBillModal] = useState(false);
  const initialCuttingRow = { category: "Front", color: "", quantity: "" };

  const [CuttingData, setCuttingData] = useState({
    serial_No: "",
    partyName: "",
    design_no: "",
    date: "",
    T_Quantity: "",
    rate: "",
    embroidery_Id: "",
    category_quantity: [initialCuttingRow],
  });

  const handleInputChangeCutting = (e) => {
    const { name, value } = e.target;
    setCuttingData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const [CalenderData, setCalenderData] = useState({
    id: id,
    r_quantity: "",
  });

  const [billData, setBilldata] = useState({
    Manual_No: "",
    additionalExpenditure: "",
  });


  const [convertedQuantity, setConvertedQuantity] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);

  const {
    embroidery_Id,
    design_no,
    serial_No,
    from,
    source_step,
    source_id,
    source_availability,
  } = location.state || {};
  const cuttingAvailability =
    id !== "null"
      ? SingleCalender?.processAvailability
      : source_availability;

  useEffect(() => {
    if (id === "null") {
      openModal();
    }
  }, [id]);

  useEffect(() => {
    if (id !== "null") {
      const data = {
        id: id,
      };
      dispatch(GetSingleCalender(data));
    }
  }, [id, dispatch]);

  useEffect(() => {
    const currentEmbroideryId = SingleCalender?.embroidery_Id || embroidery_Id;
    if (currentEmbroideryId) {
      dispatch(GETEmbroiderySIngle({ id: currentEmbroideryId }));
    }
  }, [SingleCalender?.embroidery_Id, embroidery_Id, dispatch]);

  const getUniqueShirtRows = (rows = []) => {
    const seenColors = new Set();
    return rows.filter((item) => {
      const key = item?.color || `${item?.category || ""}-${seenColors.size}`;
      if (seenColors.has(key)) return false;
      seenColors.add(key);
      return true;
    });
  };

  const getInitialCuttingRows = () => {
    if (cuttingAvailability?.byColor?.length) {
      const colorRows = getAvailableColors(cuttingAvailability).map((item) => ({
        category: "Front",
        color: item.color,
        quantity: item.available,
      }));
      return colorRows.length ? colorRows : [{ ...initialCuttingRow }];
    }

    const shirtRows = getUniqueShirtRows(SingleEmbroidery?.shirt)
        ?.filter((item) => item?.color)
        ?.map((item) => ({
          category: "Front",
          color: item.color,
          quantity: item.received || "",
        })) || [];

    return shirtRows.length ? shirtRows : [{ ...initialCuttingRow }];
  };

  const getAvailableCuttingColors = (currentIndex) => {
    const currentColor = CuttingData.category_quantity?.[currentIndex]?.color;
    const selectedColors = new Set(
      CuttingData.category_quantity
        ?.map((row, index) => (index === currentIndex ? null : row?.color))
        ?.filter(Boolean)
    );

    const colors = cuttingAvailability?.byColor?.length
      ? getAvailableColors(cuttingAvailability)
      : getUniqueShirtRows(SingleEmbroidery?.shirt);

    return colors.filter(
      (item) => item?.color === currentColor || !selectedColors.has(item?.color)
    );
  };

  useEffect(() => {
    setCuttingData({
      serial_No: SingleCalender?.serial_No || serial_No || "",
      design_no: SingleCalender?.design_no || design_no || "",
      T_Quantity: "",
      partytype: partyValue,
      date: today,
      partyName: "",
      embroidery_Id: SingleCalender?.embroidery_Id || embroidery_Id || "",
      source_step:
        id !== "null" ? "Embroidery" : source_step || "Embroidery",
      source_id:
        id !== "null"
          ? SingleCalender?.embroidery_Id
          : source_id || embroidery_Id || "",
      category_quantity: getInitialCuttingRows(),
    });
  }, [SingleCalender, SingleEmbroidery, partyValue, id, source_step, source_id, embroidery_Id]);

  useEffect(() => {
    setCalenderData({
      id: id,
      r_quantity: SingleCalender?.r_quantity || SingleCalender?.T_Quantity || "",
    });
    setConvertedQuantity(SingleCalender?.r_quantity);
    setConvertedAmount(SingleCalender?.r_quantity * SingleCalender?.rate);
  }, [SingleCalender]);

  const handleInputChangeCalender = (e) => {
    const { name, value } = e.target;
    setCalenderData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCuttingColorChange = (e, index) => {
    const { value } = e.target;
    setCuttingData((prevData) => ({
      ...prevData,
      category_quantity: prevData.category_quantity?.map((row, rowIndex) =>
        rowIndex === index ? { ...row, color: value } : row
      ),
    }));
  };

  const handleCuttingQuantityChange = (e, index) => {
    const { value } = e.target;
    setCuttingData((prevData) => ({
      ...prevData,
      category_quantity: prevData.category_quantity?.map((row, rowIndex) =>
        rowIndex === index ? { ...row, quantity: value } : row
      ),
    }));
  };

  const removeCuttingRow = (index) => {
    setCuttingData((prevData) => ({
      ...prevData,
      category_quantity:
        prevData.category_quantity?.length > 1
          ? prevData.category_quantity.filter((_, rowIndex) => rowIndex !== index)
          : prevData.category_quantity,
    }));
  };

  const addCuttingRow = () => {

    setCuttingData((prevData) => ({
      ...prevData,
      category_quantity: [
        ...(prevData.category_quantity || []),
        { ...initialCuttingRow },
      ],
    }));
  };

  const handleSubmitCutting = (e) => {
    e.preventDefault();
    const cuttingRows = CuttingData.category_quantity?.filter(
      (item) => item?.category || item?.color || item?.quantity
    ) || [];
    if (!cuttingRows.length) {
      return toast.error("Please add cutting rows");
    }

    if (
      cuttingRows.some(
        (item) => !item.category || !item.color || !Number(item.quantity || 0)
      )
    ) {
      return toast.error("Each cutting row must have category, color, and quantity");
    }

    const availableQuantity =
      cuttingAvailability?.available !== undefined
        ? Number(cuttingAvailability.available || 0)
        : 0;
    const requestedQuantity = cuttingRows.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

    if (availableQuantity <= 0) {
      return toast.error("No available quantity from previous step");
    }

    if (requestedQuantity > availableQuantity) {
      return toast.error(
        `Invalid quantity. Available quantity is ${availableQuantity}`
      );
    }

    const colorError = getColorLimitError(cuttingAvailability, cuttingRows, "quantity");
    if (colorError) return toast.error(colorError);

    dispatch(
      createCutting({
        ...CuttingData,
        T_Quantity: requestedQuantity,
        category_quantity: cuttingRows,
      })
    ).then((res) => {
      if (res.payload.success === true) {
        closeModal();
        navigate("/dashboard/cutting");
      }
    });
  };

  const handleCompleteCalender = (e) => {
    e.preventDefault();
    const data = {
      id: id,
    };
    dispatch(UpdateCalenderAsync({ project_status: "Completed", id: id }))
      .then(() => {
        dispatch(GetSingleCalender(data));
        closeCompletedModal();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleUpdateCalender = (e) => {
    e.preventDefault();

    if(!CalenderData.r_quantity || Number(CalenderData.r_quantity) < 0) {
      toast.error("Please enter a valid recieved quantity");
      return
    }

    const data = {
      id: id,
    };

    dispatch(UpdateCalenderAsync(CalenderData))
      .then((res) => {
        if(res?.payload?.success) {
        dispatch(GetSingleCalender(data));
        closeUpdateRecievedModal();
        }
      })
      
  };

  const openModal = () => {
    if (
      id !== "null" &&
      Number(SingleCalender?.processAvailability?.available || 0) <= 0
    ) {
      return toast.error("No available embroidery quantity for next step");
    }
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (id === "null") {
      navigate(from);
    }
    setIsOpen(false);
    setPartyValue("newParty");
    document.body.style.overflow = "auto";
  };

  const handleOpenGatePassModal = () => {
    setisGenerateGatePassOpen(true);
  };

  const closeGatepassModal = () => {
    setisGenerateGatePassOpen(false);
    document.body.style.overflow = "auto";
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <PageLoader />
      </section>
    );
  }

  const handleCompletedClick = () => {
    setIsCompletedConfirmOpen(true);
  };

  const closeCompletedModal = () => {
    setIsUpdateReceivedConfirmOpen(false);
    setIsCompletedConfirmOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleUpdateReceivedClick = () => {
    setIsUpdateReceivedConfirmOpen(true);
  };

  const closeUpdateRecievedModal = () => {
    setIsUpdateReceivedConfirmOpen(false);
    setIsCompletedConfirmOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleGenerateGatePassPDf = () => {
    dispatch(generateCalenderGatePssPdfAsync(SingleCalender));
    closeGatepassModal();
  };

  const generateBill = (e) => {
    e.preventDefault();
    const formData = {
      ...SingleCalender,
      ...billData,
      date: SingleCalender?.date,
      r_quantity: convertedQuantity,
      process_Category: "Calender",
      Calender_id: SingleCalender.id,
    };
    dispatch(generateCalenderBillAsync(formData)).then((res) => {
      if (res.payload.success) {
        closeBillModal();
        const data = {
          id: id,
        };
        dispatch(GetSingleCalender(data));
      }
    });
  };

  const openGenerateBillForm = () => {
    setBilldata((prev) => ({
      ...prev,
      Manual_No: SingleCalender?.Manual_No                                                                                        
    }))
    setProcessBillModal(true);
  };

  const closeBillModal = () => {
    setProcessBillModal(false);
    setConvertedQuantity(SingleCalender?.r_quantity);
    setConvertedAmount(SingleCalender?.r_quantity * SingleCalender?.rate);
    setBilldata({
      Manual_No: "",
      additionalExpenditure: "",
    });
  };

  const handleBillDataChange = (e) => {
    const { name, value } = e.target;
    setBilldata((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUnitChange = (e) => {
    const unit = e.target.value;
    let convertedQuantity = "";
    let convertedAmount = "";
    if (unit === "y") {
      convertedQuantity = SingleCalender?.r_quantity * 1.09361;
      convertedAmount = Math.round(convertedQuantity * SingleCalender?.rate);
    } else if (unit === "m") {
      convertedQuantity = SingleCalender.r_quantity;
      convertedAmount = convertedQuantity * SingleCalender?.rate;
    }
    setConvertedQuantity(convertedQuantity);
    setConvertedAmount(convertedAmount);
  };

  const handleSelectedRecord = (value) => {
    const Data = previousDataByPartyName?.accountData.find(
      (item) => item.partyName === value
    );
    setCuttingData((prev) => ({
      ...prev,
      partyName: value,
    }));
    if (Data?.partyName === value) {
      setAccountData(Data?.virtual_account);
    } else {
      setAccountData(false);
    }
  };

  const togleNameField = (e) => {
    const value = e.target.value;
    setPartyValue(value);
    setCuttingData((prev) => ({
      ...prev,
      partyName: "",
    }));
    setAccountData(null);
  };

  const handleSearchOldData = (value) => {
    dispatch(getCuttingDataBypartyNameAsync({ partyName: value }));
  };

  const searchResults = previousDataByPartyName?.cuttingData?.map((item) => {
    return {
      key: item.partyName,
      value: item.partyName,
    };
  });

  const handleSkipStep = (e) => {
    const value = e.target.value;
    const sourceAvailability = SingleCalender?.processAvailability;
    const availableQuantity = Number(sourceAvailability?.available || 0);
    if (availableQuantity <= 0) {
      return toast.error("No available embroidery quantity for next step");
    }
    const sourceState = {
      source_step: "Embroidery",
      source_id: SingleCalender.embroidery_Id,
    };
    switch (true) {
      case value === "Stones":
        navigate("/dashboard/cutting-details/null", {
          state: {
            embroidery_Id: SingleCalender.embroidery_Id,
            design_no: SingleCalender.design_no,
            serial_No: SingleCalender.serial_No,
            from: location.pathname,
            source_availability: sourceAvailability,
            ...sourceState,
          },
        });
        break;
        case value === "Stitching":
          navigate("/dashboard/stones-details/null", {
            state: {
              embroidery_Id: SingleCalender.embroidery_Id,
              design_no: SingleCalender.design_no,
              serial_No: SingleCalender.serial_No,
              from: location.pathname,
              source_availability: sourceAvailability,
              ...sourceState,
            },
          });
          break;
      default:
        break;
    }
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Calendar
          </h1>
        </div>

        {/* -------------- DETAILS SECTION -------------- */}
        <div className="details mx-2 mt-8 px-3 text-gray-800 dark:text-gray-200 py-5 border border-gray-300 dark:border-gray-500 bg-[#F7F7F7] dark:bg-gray-800 rounded-md">
          <div className="grid items-start grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-x-2.5 gap-y-5 text-sm">
            {/* FIRST ROW */}
            <div className="box">
              <span className="font-medium">Party Name:</span>
              <span> {SingleCalender?.partyName}</span>
            </div>
            <div className="box">
              <span className="font-medium">Manual No:</span>
              <span> {SingleCalender?.Manual_No ?? '--'}</span>
            </div>
            <div className="box">
              <span className="font-medium">Design No:</span>
              <span> {SingleCalender?.design_no}</span>
            </div>

            <div className="box">
              <span className="font-medium">Rate:</span>
              <span> {SingleCalender?.rate}</span>
            </div>
            <div className="box">
              <span className="font-medium">Project Status:</span>
              <span> <StatusChip status={SingleCalender?.project_status} fallback="" /></span>
            </div>
            <div className="box">
              <span className="font-medium">Date:</span>
              <span>{formatReadableDate(SingleCalender?.date)}</span>
            </div>
            <div className="box">
              <span className="font-medium">Quantity:</span>
              <span> {SingleCalender?.T_Quantity} m </span>
            </div>
            <div className="box">
              <span className="font-medium">R. Quantity:</span>
              <span>
                {" "}
                {SingleCalender?.r_quantity}{" "}
                {SingleCalender?.r_quantity !== "" ? "m" : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* ENTER RECEIVED QUANTITY */}
        <div className="my-10 px-3 text-gray-800  dark:text-gray-200">
          <label htmlFor="received_quantity" className="font-semibold">
            Enter Received Quantity
          </label>
          <div className="flex gap-3">
            <input
              id="r_quantity"
              name="r_quantity"
              type="text"
              placeholder="Quantity"
              className="bg-gray-50 mt-2 border max-w-40 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              required
              value={CalenderData.r_quantity}
              onChange={handleInputChangeCalender}
              disabled={SingleCalender?.project_status === "Completed"}
            />
          </div>
        </div>

        <div className="flex justify-center items-center">
          {SingleCalender?.project_status !== "Completed" && (
            <button
              className="px-2 py-2.5 text-sm rounded bg-[#252525] text-white border-none"
              onClick={handleUpdateReceivedClick}
            >
              Update Recived
            </button>
          )}
        </div>
        {/* -------------- BUTTONS BAR -------------- */}
        <div className="mt-6 flex justify-center items-center gap-x-5">
          {SingleCalender?.project_status !== "Completed" &&
            SingleCalender?.updated && (
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                onClick={handleCompletedClick}
              >
                Completed
              </button>
            )}
          {SingleCalender?.project_status === "Completed" &&
            !SingleCalender?.bill_generated && (
              <button
                onClick={openGenerateBillForm}
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
              >
                Generate Bill
              </button>
            )}
          {CalenderpdfLoading ? (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded bg-gray-400 cursor-progress dark:bg-gray-200 text-white dark:text-gray-800"
            >
              <ButtonSpinner />
              Generate Gate Pass
            </button>
          ) : (
            <button
              onClick={handleOpenGatePassModal}
              className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            >
              Generate Gate Pass
            </button>
          )}
          {SingleCalender?.project_status === "Completed" && (
            <>
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                onClick={openModal}
              >
                Next Step
              </button>
              <ThemedSelect variant="button" className="min-w-[9rem]"
                onChange={handleSkipStep}
              >
                <option value="" disabled selected hidden>
                  Skip To
                </option>
                <option value="Stones">Stones</option>
                <option value="Stitching">Stitching</option>
              </ThemedSelect>
            </>
          )}
        </div>

        {isOpen && (
          <div
            aria-hidden="true"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
          >
            <div className="relative py-4 px-3 w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Cutting Details
                  </h3>
                  <ProcessAvailabilityCard availability={cuttingAvailability} />
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
              {/* ACCOUNT DATA */}
              {partyValue === "oldParty" && accountData === false ? (
                <div className=" px-8 py-2 mb-5 flex justify-around items-center border-2 border-red-600 rounded-lg text-green-500 dark:text-green-500  dark:border-red-600">
                  <p>Calender Data Found But No Bill Generated Yet</p>
                </div>
              ) : (
                <>
                  {partyValue === "oldParty" && accountData !== null && (
                    <div className=" px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 rounded-lg text-gray-900 dark:text-gray-100  dark:border-gray-600">
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal">Total Debit</h3>
                        <h3>{accountData?.total_debit || 0}</h3>
                      </div>
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal">Total Credit</h3>
                        <h3>{accountData?.total_credit || 0}</h3>
                      </div>
                      <div className="box text-center">
                        <h3 className="pb-1 font-normal ">Total Balance</h3>
                        <h3>{accountData?.total_balance || 0}</h3>
                      </div>
                      <div className="box text-center">
                          <h3 className="pb-1 font-normal ">Status</h3>
                          <h3>
                          <StatusChip status={accountData?.status} />
                          </h3>
                        </div>
                    </div>
                  )}
                </>
              )}

              <div className="p-4 md:p-5">
                <form className="space-y-4" onSubmit={handleSubmitCutting}>
                  <div className="mb-8 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {/* RADIO BUTTONS */}
                    <div className="grid grid-cols-2 items-center justify-center gap-1">
                      <label className="col-span-1 ">
                        <input
                          type="radio"
                          name="partyType"
                          value="oldParty"
                          className="bg-gray-50 cursor-pointer border mr-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          onChange={togleNameField}
                          required
                        />
                        Old Party
                      </label>
                      <label className="col-span-1 ">
                        <input
                          type="radio"
                          name="partyType"
                          value="newParty"
                          className="bg-gray-50 cursor-pointer border mr-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          onChange={togleNameField}
                          required
                          defaultChecked
                        />
                        New Party
                      </label>
                    </div>

                    <div>
                      {partyValue === "newParty" ? (
                        <input
                          name="partyName"
                          type="text"
                          placeholder="Party Name"
                          className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                          value={CuttingData.partyName}
                          onChange={handleInputChangeCutting}
                        />
                      ) : (
                        <div className="custom-search-box relative">
                          <ReactSearchBox
                            key={searchResults?.key}
                            onSelect={(value) =>
                              handleSelectedRecord(value?.item?.key)
                            }
                            placeholder={
                              CuttingData.partyName === ""
                                ? "Search"
                                : CuttingData.partyName
                            }
                            data={searchResults}
                            onChange={(value) => handleSearchOldData(value)}
                            inputBorderColor="#D1D5DB"
                            inputBackgroundColor="#F9FAFB"
                          />
                          <style jsx>
                            {`
                              .react-search-box-dropdown {
                                position: absolute;
                                z-index: 50;
                                top: 100%;
                                left: 0;
                                width: 100%;
                              }
                            `}
                          </style>
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        name="design_no"
                        type="text"
                        placeholder="Design No"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        value={CuttingData.design_no}
                        onChange={handleInputChangeCutting}
                        required
                        readOnly
                      />
                    </div>
                  </div>
                  <div className=" grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    <div>
                      <input
                        name="date"
                        type="text"
                        placeholder="Date"
                        className="bg-gray-50 border  border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        value={CuttingData.date}
                        required
                        readOnly
                      />
                    </div>

                    <div>
                      <input
                        name="rate"
                        type="number"
                        placeholder="rate"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        value={CuttingData.rate}
                        step="0.01"
                        onChange={handleInputChangeCutting}
                        required
                      />
                    </div>

                    <div>
                      <input
                        name="serial_No"
                        type="text"
                        placeholder="serial No"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        value={CuttingData.serial_No}
                        onChange={handleInputChangeCutting}
                        required
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                    <h2 className="block text-sm font-medium text-gray-900 dark:text-white">
                      Cutting Quantity
                    </h2>
                      <button
                        type="button"
                        onClick={addCuttingRow}
                        className="text-gray-800 rounded-md inline-flex justify-center items-center dark:text-white"
                      >
                        <FiPlus size={24} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {CuttingData.category_quantity?.map((row, index) => (
                        <div
                          key={`${row.color || "row"}-${index}`}
                          className="grid items-start grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4"
                        >
                          <input
                            type="text"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 disabled:opacity-75 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            value={row.category}
                            disabled
                            required
                          />
                          <ThemedSelect className="w-full"
                            value={row.color}
                            onChange={(e) => handleCuttingColorChange(e, index)}
                            required
                          >
                            <option value="" disabled>
                              Select Color
                            </option>
                            {getAvailableCuttingColors(index)?.map((item) => (
                              <option key={item.color} value={item.color}>
                                {getColorOptionLabel(item)}
                              </option>
                            ))}
                          </ThemedSelect>
                          <input
                            type="number"
                            min="0"
                            placeholder="Quantity"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            value={row.quantity}
                            onChange={(e) => handleCuttingQuantityChange(e, index)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeCuttingRow(index)}
                            disabled={CuttingData.category_quantity?.length <= 1}
                            className="min-h-[42px] text-red-500 rounded-md inline-flex justify-center items-center disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <RxCross2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    {IsLoading ? (
                      <button
                        disabled
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 cursor-not-allowed rounded border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring"
                      >
                        <ButtonSpinner />
                        Submit
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-block rounded border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isUpdateReceivedConfirmOpen && (
          <ConfirmationModal
            title="Confirm Update"
            message="Are you sure you want to update the received items?"
            onConfirm={handleUpdateCalender}
            onClose={closeUpdateRecievedModal}
          />
        )}

        {isCompletedConfirmOpen && (
          <ConfirmationModal
            title="Confirm Complete"
            message="Are you sure you want to Complete ?"
            onConfirm={handleCompleteCalender}
            onClose={closeCompletedModal}
          />
        )}

        {isGenerateGatePassOpen && (
          <ConfirmationModal
            title="Confirmation"
            message="Are you sure you want to generate gatepass?"
            onConfirm={handleGenerateGatePassPDf}
            onClose={closeGatepassModal}
          />
        )}
        {/* PROCESS BILL MODAL */}
        {processBillModal && (
          <div
            aria-hidden="true"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
          >
            <div className="relative py-4 px-3 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
              {/* ------------- HEADER ------------- */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Additionl Process Bill Details
                </h3>
                <button
                  onClick={closeBillModal}
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
                <form onSubmit={generateBill}>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-4">
                    {/* Manual_No */}
                    <div>
                      <input
                        name="Manual_No"
                        type="text"
                        placeholder="Manual No"
                        value={billData.Manual_No}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                        readOnly
                      />
                    </div>

                    {/* Additional Expenditure */}
                    <input
                      name="additionalExpenditure"
                      type="number"
                      placeholder="A.E"
                      value={billData.additionalExpenditure}
                      onChange={handleBillDataChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                    <div className=" items-center grid grid-cols-4 gap-1 justify-center">
                      <input
                        name="processBillAmount"
                        type="text"
                        value={convertedQuantity}
                        className="bg-gray-50 col-span-2 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        readOnly
                      />

                      <ThemedSelect className="col-span-2 w-full"
                        required
                        onChange={handleUnitChange}
                      >
                        <option selected value={"m"}>
                          m
                        </option>
                        <option value={"y"}>y</option>
                      </ThemedSelect>
                    </div>
                    <div className=" items-center grid grid-cols-4 gap-1 justify-center">
                      <h3 className="col-span-2">Bill Amount :</h3>
                      <input
                        name="processBillAmount"
                        type="text"
                        value={convertedAmount}
                        className="bg-gray-50 border col-span-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-6">
                    {generateCAlenderBillLoading ? (
                      <button
                        disabled
                        type="button"
                        className="text-white cursor-not-allowed border-gray-600 bg-gray-600  focus:ring-0 focus:outline-none font-medium rounded text-sm px-5 py-2.5 text-center mr-2  inline-flex items-center gap-2"
                      >
                        <ButtonSpinner />
                        Submit
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-0 active:text-indgrayigo-500"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default CalendarDetails;
