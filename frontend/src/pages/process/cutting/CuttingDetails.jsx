import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useState, useEffect, useMemo } from "react";
import {
  generateCuttingBillAsync,
  generateCuttingGatePssPdfAsync,
  GetSingleCutting,
  Updatecuttingasync,
} from "../../../features/CuttingSlice";
import { GETEmbroiderySIngle } from "../../../features/EmbroiderySlice";
import { FiPlus } from "react-icons/fi";
import {
  createStone,
  getStoneDataBypartyNameAsync,
} from "../../../features/stoneslice";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import ProcessBillModal from "../../../Component/Modal/ProcessBillModal";
import ReactSearchBox from "react-search-box";
import toast from "react-hot-toast";
import ProcessAvailabilityCard from "../../../Component/Common/ProcessAvailabilityCard";
import {
  blurOnWheel,
  formatReadableDate,
  getAvailableColors,
  getColorLimitError,
  getColorOptionLabel,
  getInitialReceived,
  getReceivedError,
  getRecordForId,
  getTodayDate,
} from "../../../Utils/Common";
import { RxCross2 } from "react-icons/rx";
import StatusChip from "../../../Component/Common/StatusChip";
import PageLoader from "../../../Component/Loader/PageLoader";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import SkipToPackingModal from "../Packing/components/SkipToPackingModal";
import { StepPackingIcon } from "../Packing/components/PackingStatusIcon";
import { canSendForward } from "../Packing/packingUtils";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const CuttingDetails = () => {
  const { id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const {
    loading,
    SingleCutting: storedCutting,
    generateCuttingBillLoading,
    CuttingpdfLoading,
  } = useSelector((state) => state.Cutting);
  const SingleCutting = getRecordForId(storedCutting, id);
  const {
    loading: IsLoading,
    previousDataByPartyName,
  } = useSelector((state) => state.stone);
  const { SingleEmbroidery } = useSelector((state) => state.Embroidery);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [isUpdateReceivedConfirmOpen, setIsUpdateReceivedConfirmOpen] =
    useState(false);
  const [isCompletedConfirmOpen, setIsCompletedConfirmOpen] = useState(false);
  const [isGenerateGatePassOpen, setisGenerateGatePassOpen] = useState(false);
  const [processBillModal, setProcessBillModal] = useState(false);
  const [processBillData, setProcessBillData] = useState({});
  const [accountData, setAccountData] = useState(null);
  const [partyValue, setPartyValue] = useState("newParty");
  const [isPackingModalOpen, setPackingModalOpen] = useState(false);
  const today = getTodayDate();

  const [cuttingData, setcuttingData] = useState({
    id,
    r_quantity: "",
  });

  const initialRow = { category: "Front", color: "", quantity: "" };

  const [formData, setFormData] = useState({
    partyName: "",
    serial_No: "",
    design_no: "",
    partyType: partyValue,
    date: "",
    rate: "",
    category_quantity: [initialRow],
    cuttingId:""
  });

  const {
    embroidery_Id,
    design_no,
    serial_No,
    from,
    source_step,
    source_id,
    source_availability,
  } = location.state || {};

  const stoneAvailability =
    id !== "null"
      ? SingleCutting?.processAvailability
      : source_availability;

  const getUniqueShirtRows = (rows = []) => {
    const seenColors = new Set();
    return rows.filter((item) => {
      const key = item?.color || `${item?.category || ""}-${seenColors.size}`;
      if (seenColors.has(key)) return false;
      seenColors.add(key);
      return true;
    });
  };

  const getInitialStoneRows = () => {
    if (stoneAvailability?.byColor?.length) {
      const colorRows = getAvailableColors(stoneAvailability).map((item) => ({
        category: "Front",
        color: item.color,
        quantity: item.available,
      }));
      return colorRows.length ? colorRows : [{ ...initialRow }];
    }

    const cuttingRows =
      SingleCutting?.category_quantity
        ?.filter((item) => item?.color)
        ?.map((item) => ({
          category: "Front",
          color: item.color,
          quantity: item.received || "",
        })) || [];

    if (cuttingRows.length) return cuttingRows;

    const shirtRows = SingleEmbroidery?.shirt
        ?.map((item) => ({
          category: "Front",
          color: item.color,
          quantity: item.received || "",
        })) || [];

    return shirtRows.length ? shirtRows : [{ ...initialRow }];
  };

  useEffect(() => {
    setFormData({
      serial_No: SingleCutting?.serial_No || serial_No || "",
      design_no: SingleCutting?.design_no || design_no || "",
      date: today,
      partyType: partyValue,
      partyName: "",
      embroidery_Id: SingleCutting?.embroidery_Id || embroidery_Id || "",
      category_quantity: getInitialStoneRows(),
      source_step: id !== "null" ? "Cutting" : source_step || "Embroidery",
      source_id: id !== "null" ? SingleCutting?.id : source_id || embroidery_Id || "",
    });
  }, [SingleCutting, SingleEmbroidery, partyValue, id, source_step, source_id, embroidery_Id]);

  useEffect(() => {
    const colorsAddUp =
      (SingleCutting?.category_quantity || []).reduce(
        (total, item) => total + Number(item.received || 0),
        0
      ) === Number(SingleCutting?.r_quantity || 0);

    setcuttingData({
      id: id,
      r_quantity: SingleCutting?.r_quantity || "",
      category_quantity:
        SingleCutting?.category_quantity?.map((item) => ({
          id: item.id || item._id,
          category: item.category,
          color: item.color,
          quantity: item.quantity,
          received: colorsAddUp
            ? getInitialReceived(SingleCutting, item.received, item.quantity)
            : item.received || item.quantity || "",
        })) || [],
    });
  }, [SingleCutting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addNewRow = () => {
    setFormData((prevState) => ({
      ...prevState,
      category_quantity: [...prevState.category_quantity, initialRow],
    }));
  };

  const deleteRow = (index) => {
    setFormData((prevState) => ({
      ...prevState,
      category_quantity: prevState.category_quantity.filter(
        (_, i) => i !== index
      ),
    }));
  };


  const handleColorChange = (e, index) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      category_quantity: prevState.category_quantity?.map((row, i) =>
        i === index ? { ...row, color: value } : row
      ),
    }));
  };

  const handleQuantityChange = (e, index) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      category_quantity: prevState.category_quantity?.map((row, i) =>
        i === index ? { ...row, quantity: parseInt(value) } : row
      ),
    }));
  };

  useEffect(() => {
    if (id !== "null") {
      const data = {
        id: id,
      };
      dispatch(GetSingleCutting(data));
    } else {
      openModal();
    }
  }, [id, dispatch]);

  
  useEffect(() => {
    const embroideryId = SingleCutting?.embroidery_Id || embroidery_Id;
    if (embroideryId) {
      dispatch(GETEmbroiderySIngle({ id: embroideryId }));
    }
  }, [SingleCutting?.embroidery_Id, embroidery_Id, dispatch]);

  const handleInputChangeCutting = (e) => {
    const { name, value } = e.target;
    setcuttingData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCuttingReceivedChange = (e, index) => {
    const { value } = e.target;
    const error = getReceivedError(value, cuttingData.category_quantity?.[index]?.quantity);
    if (error) return toast.error(error);

    setcuttingData((prevData) => ({
      ...prevData,
      category_quantity: prevData.category_quantity?.map((row, rowIndex) =>
        rowIndex === index ? { ...row, received: value } : row
      ),
    }));
  };

  const handleSubmitstome = (e) => {
    e.preventDefault();
    const stoneRows = formData.category_quantity?.filter(
      (item) => item?.category || item?.color || item?.quantity
    ) || [];

    if (!stoneRows.length) {
      return toast.error("Please add stone rows");
    }

    if (
      stoneRows.some(
        (item) => !item.category || !item.color || !Number(item.quantity || 0)
      )
    ) {
      return toast.error("Each stone row must have category, color, and quantity");
    }

    const requestedQuantity = stoneRows.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
    );
    const availableQuantity =
      stoneAvailability?.available !== undefined
        ? Number(stoneAvailability.available || 0)
        : id !== "null"
          ? Number(SingleCutting?.r_quantity || 0)
          : 0;

    if (availableQuantity <= 0) {
      return toast.error("No available quantity from previous step");
    }

    if (requestedQuantity > availableQuantity) {
      return toast.error(
        `Invalid quantity. Available quantity is ${availableQuantity}`
      );
    }

    const colorError = getColorLimitError(stoneAvailability, stoneRows, "quantity");
    if (colorError) return toast.error(colorError);

    const data = {
      ...formData,
      category_quantity: stoneRows,
      cuttingId:id
    };
    dispatch(createStone(data)).then((res) => {
      if (res.payload.success === true) {
        closeModal();
        navigate("/dashboard/stones");
      }
    });
  };

  const handleUpdateCutting = (e) => {
    e.preventDefault();

    const data = {
      id: id,
    };
    const hasReceivedRows = cuttingData.category_quantity?.length > 0;
    const updatePayload = hasReceivedRows
      ? {
          id,
          category_quantity: cuttingData.category_quantity,
        }
      : cuttingData;

    dispatch(Updatecuttingasync(updatePayload)).then((res) => {
      if (res.payload.success) {
        dispatch(GetSingleCutting(data));
        closeUpdateRecievedModal();
      }
    });
  };

  const handleCompleteCutting = (e) => {
    e.preventDefault();

    const data = {
      id: id,
    };

    dispatch(Updatecuttingasync({ project_status: "Completed", id: id }))
      .then(() => {
        dispatch(GetSingleCutting(data));
        closeCompletedModal();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const openModal = () => {
    if (id !== "null" && Number(SingleCutting?.r_quantity || 0) <= 0) {
      return toast.error("No received quantity available from previous step");
    }
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (id === "null") {
      navigate(from);
    }
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

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
    dispatch(generateCuttingGatePssPdfAsync(SingleCutting));
    closeGatepassModal();
  };

  const generateBill = (e) => {
    e.preventDefault();
    const formData = {
      ...SingleCutting,
      date: SingleCutting?.date,
      process_Category: "Cutting",
      Manual_No: processBillData.Manual_No,
      additionalExpenditure: processBillData.additionalExpenditure,
      Cutting_id: SingleCutting.id,
      Embroidery_id: SingleCutting?.embroidery_Id,
    };
    dispatch(generateCuttingBillAsync(formData)).then((res) => {
      if (res.payload.success) {
        closeBillModal();
        setProcessBillData({});
      }
    });
  };

  const openGenerateBillForm = () => {
    setProcessBillModal(true);
  };

  const closeBillModal = () => {
    setProcessBillModal(false);
  };

  const HandleProcessBillDataChange = (data) => {
    setProcessBillData(data);
  };

  const handleOpenGatePassModal = () => {
    setisGenerateGatePassOpen(true);
  };

  const closeGatepassModal = () => {
    setisGenerateGatePassOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleSelectedRecord = (value) => {
    const Data = previousDataByPartyName?.accountData.find(
      (item) => item.partyName === value
    );
    setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      partyName: "",
    }));
    setAccountData(null);
  };

  const handleSearchOldData = (value) => {
    dispatch(getStoneDataBypartyNameAsync({ partyName: value }));
  };

  const searchResults = previousDataByPartyName?.stoneData?.map((item) => {
    return {
      key: item.partyName,
      value: item.partyName,
    };
  });

  const handleSkipStep = (e) => {
    const value = e.target.value;
    e.target.value = "";
    const receivedQuantity = Number(SingleCutting?.r_quantity || 0);
    if (receivedQuantity <= 0) {
      return toast.error("No received quantity available from previous step");
    }
    const sourceState = {
      source_step: "Cutting",
      source_id: SingleCutting.id,
    };
    switch (true) {
      case value === "Stitching":
        navigate("/dashboard/stones-details/null", {
          state: {
            embroidery_Id: SingleCutting.embroidery_Id,
            design_no: SingleCutting.design_no,
            serial_No: SingleCutting.serial_No,
            from: location.pathname,
            source_availability: SingleCutting?.processAvailability,
            ...sourceState,
          },
        });
        break;
      case value === "Packing":
        if (SingleCutting.project_status !== "Completed") {
          return toast.error("Please Complete Project");
        }
        if (Number(SingleCutting?.processAvailability?.available || 0) <= 0) {
          return toast.error("No available quantity for packing");
        }
        setPackingModalOpen(true);
        break;
      default:
        break;
    }
  };

  const shirtColors = useMemo(() => {
    return getUniqueShirtRows(SingleEmbroidery?.shirt).map((s) => s.color) || [];
  },[SingleEmbroidery])

  const getAvailableShirtColors = (currentIndex) => {
    const currentColor = formData.category_quantity?.[currentIndex]?.color;
    const selectedColors = new Set(
      formData.category_quantity
        ?.map((row, index) => (index === currentIndex ? null : row?.color))
        ?.filter(Boolean)
    );
    const colors = stoneAvailability?.byColor?.length
      ? getAvailableColors(stoneAvailability)
      : shirtColors.map((color) => ({ color }));

    return colors.filter(
      (item) => item.color === currentColor || !selectedColors.has(item.color)
    );
  };

   if (loading) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <PageLoader />
      </section>
    );
  }

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Cutting Details
          </h1>
        </div>
        {/* -------------- DETAILS SECTION -------------- */}
        <div className="details mx-2 mt-8 px-3 text-gray-800 dark:text-gray-200 py-5 border border-gray-300 dark:border-gray-500 bg-[#F7F7F7] dark:bg-gray-800 rounded-md">
          <div className="grid items-start grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-x-2.5 gap-y-5 text-sm">
            {/* FIRST ROW */}
            <div className="box">
              <span className="font-medium">Party Name:</span>
              <span> {SingleCutting?.partyName}</span>
            </div>
            <div className="box">
              <span className="font-medium">Manual No:</span>
              <span> {SingleCutting?.Manual_No ?? '--'}</span>
            </div>
            <div className="box">
              <span className="font-medium">Design No:</span>
              <span> {SingleCutting?.design_no}</span>
            </div>

            <div className="box">
              <span className="font-medium">Rate:</span>
              <span> {SingleCutting?.rate}</span>
            </div>
            <div className="box">
              <span className="font-medium">Project Status:</span>
              <span className="inline-flex items-center gap-2">
                <StatusChip status={SingleCutting?.project_status} fallback="" />
                <StepPackingIcon step="Cutting" record={SingleCutting} />
              </span>
            </div>
            <div className="box">
              <span className="font-medium">Date:</span>
              <span>{formatReadableDate(SingleCutting?.date)}</span>
            </div>
            <div className="box">
              <span className="font-medium">Quantity:</span>
              <span> {SingleCutting?.T_Quantity} </span>
            </div>
            <div className="box">
              <span className="font-medium">R. Quantity:</span>
              <span> {SingleCutting?.r_quantity}</span>
            </div>
          </div>
        </div>
        {/* RECEIVED SUITS COLORS */}
        <div className="my-10 px-3 text-gray-800 dark:text-gray-200">
          <label htmlFor="received_quantity" className="font-semibold">
            Enter Received Quantity
          </label>
          {cuttingData.category_quantity?.length > 0 ? (
            <div className="mt-3 space-y-3 max-w-4xl">
              {cuttingData.category_quantity.map((row, index) => (
                <div
                  key={row.id || index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr] items-center gap-3"
                >
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 disabled:opacity-75 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={row.category}
                    disabled
                  />
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 disabled:opacity-75 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={row.color}
                    disabled
                  />
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 disabled:opacity-75 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={`Sent: ${row.quantity || 0}`}
                    disabled
                  />
                  <input
                    type="number"
                    min="0"
                    max={row.quantity || 0}
                    placeholder="Received"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    required
                    value={row.received}
                    onChange={(e) => handleCuttingReceivedChange(e, index)}
                    onWheel={blurOnWheel}
                    disabled={SingleCutting?.project_status === "Completed"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <input
              id="r_quantity"
              name="r_quantity"
              type="text"
              placeholder="Quantity"
              className="bg-gray-50 mt-2 border max-w-xs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              required
              value={cuttingData.r_quantity}
              onChange={handleInputChangeCutting}
              disabled={SingleCutting?.project_status === "Completed"}
            />
          )}
        </div>
        <div className="flex justify-center items-center">
          {SingleCutting?.project_status !== "Completed" && (
            <button
              className={`px-3 py-2 text-sm rounded bg-[#252525] text-white border-none`}
              onClick={handleUpdateReceivedClick}
            >
              Update Recived
            </button>
          )}
        </div>
        {/* -------------- BUTTONS BAR -------------- */}
        <div className="mt-6 flex justify-center items-center gap-x-5">
          {SingleCutting?.project_status !== "Completed" &&
            SingleCutting?.updated && (
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                onClick={handleCompletedClick}
              >
                Completed
              </button>
            )}

          {SingleCutting?.project_status === "Completed" &&
            !SingleCutting.bill_generated && (
              <button
                onClick={openGenerateBillForm}
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
              >
                Generate Bill
              </button>
            )}

          {CuttingpdfLoading ? (
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

          {SingleCutting?.project_status === "Completed" && (
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
                <option value="Stitching">Stitching</option>
                {canSendForward(SingleEmbroidery, SingleCutting?.processAvailability) && (
                  <option value="Packing">Packing</option>
                )}
              </ThemedSelect>
            </>
          )}
        </div>
        {isOpen && (
          <div
            aria-hidden="true"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
          >
            <div className="relative scrollable-content max-h-[90vh] py-4 px-3 w-[95%] max-w-4xl bg-white rounded-md shadow dark:bg-gray-700">
              {/* ------------- HEADER ------------- */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Stone
                  </h3>
                  <ProcessAvailabilityCard availability={stoneAvailability} />
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

              {/* ------------- BODY ------------- */}
              <div className="p-4 md:p-5">
                <form className="space-y-4" onSubmit={handleSubmitstome}>
                  {/* INPUT FIELDS DETAILS */}
                  <div className="mb-5 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
                          value={formData.partyName}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="custom-search-box relative">
                          <ReactSearchBox
                            key={searchResults?.key}
                            onSelect={(value) =>
                              handleSelectedRecord(value?.item?.key)
                            }
                            placeholder={
                              formData.partyName === ""
                                ? "Search"
                                : formData.partyName
                            }
                            data={searchResults}
                            onChange={(value) => handleSearchOldData(value)}
                            inputBorderColor="#D1D5DB"
                            inputBackgroundColor="#F9FAFB"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        name="SerialNo"
                        type="text"
                        placeholder="Serial No"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                        value={formData.serial_No}
                        onChange={handleChange}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="mb-8 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    <div>
                      <input
                        name="DesignNo"
                        type="text"
                        placeholder="Design No"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                        value={formData.design_no}
                        onChange={handleChange}
                        readOnly
                      />
                    </div>
                    {/* DATE */}
                    <div>
                      <input
                        name="date"
                        type="date"
                        placeholder="Date"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        value={formData.date}
                        required
                        readOnly
                      />
                    </div>

                    {/* ENTER RATE */}
                    <div>
                      <input
                        name="rate"
                        type="text"
                        placeholder="Enter Rate"
                        step="0.01"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                        value={formData.rate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center ">
                    <h2 className="block mb-0 text-sm font-medium text-gray-900 dark:text-white">
                      Select Quantity
                    </h2>
                    <p onClick={addNewRow}>
                      <FiPlus
                        size={24}
                        className=" cursor-pointer dark:text-white"
                      />
                    </p>
                  </div>

                  {formData.category_quantity &&
                    formData.category_quantity?.map((row, index) => (
                      <div key={index} className="mb-5 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {/* SELECT CATEGORY */}
                        <div>
                            <input
                            type="text"
                            placeholder="Category"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            required
                            value={row.category}
                            disabled
                          />
                        </div>

                        {/* SELECTED COLORS */}
                        <div>
                          <ThemedSelect className="w-full"
                            value={row.color}
                            onChange={(e) => handleColorChange(e, index)}
                            name="color"
                          >
                            <option value={""} disabled>
                              Select color
                            </option>
                            {getAvailableShirtColors(index)?.map((item) => (
                              <option key={item.color} value={item.color}>
                                {getColorOptionLabel(item)}
                              </option>
                            ))}
                          </ThemedSelect>
                        </div>

                        {/* ENTER QUANITY */}
                        <div className="flex items-center">
                          <input
                            type="text"
                            placeholder="Enter Quantity"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            required
                            value={isNaN(row.quantity) ? 0 : row.quantity}
                            onChange={(e) => handleQuantityChange(e, index)}
                          />

                          {formData?.category_quantity?.length > 1 && (
                            <button
                              onClick={() => deleteRow(index)}
                              className=" text-red-500  rounded-lg ms-auto inline-flex justify-center items-center"
                              type="button"
                            >
                               <RxCross2
                                size={20}
                                className="cursor-pointer text-red-500"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  <div className="flex justify-center pt-2">
                    {IsLoading ? (
                      <button
                        disabled
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 cursor-not-allowed rounded border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                      >
                        <ButtonSpinner />
                        Submit
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-block rounded border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
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
            onConfirm={handleUpdateCutting}
            onClose={closeUpdateRecievedModal}
          />
        )}

        {isCompletedConfirmOpen && (
          <ConfirmationModal
            title="Confirm Complete"
            message="Are you sure you want to Complete?"
            onConfirm={handleCompleteCutting}
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
          <ProcessBillModal
            onDataChange={HandleProcessBillDataChange}
            handleSubmit={generateBill}
            loading={generateCuttingBillLoading}
            closeModal={closeBillModal}
            Manual_No={SingleCutting.Manual_No}
            processBillAmount={Math.round(
              SingleCutting?.rate * SingleCutting?.r_quantity
            )}
          />
        )}

        {isPackingModalOpen && (
          <SkipToPackingModal
            embroidery={SingleEmbroidery}
            sourceStep="Cutting"
            sourceRecord={SingleCutting}
            onClose={() => setPackingModalOpen(false)}
          />
        )}
      </section>
    </>
  );
};

export default CuttingDetails;
