import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  generateStoneBillAsync,
  generateStoneGatePssPdfAsync,
  GetSingleStone,
  UpdateStoneAsync,
} from "../../../features/stoneslice";
import { useSelector, useDispatch } from "react-redux";
import { FiPlus } from "react-icons/fi";
import {
  createStitching,
  getStitchingDataBypartyNameAsync,
} from "../../../features/stitching";

import { GETEmbroiderySIngle } from "../../../features/EmbroiderySlice";
import { GetAllLaceForEmroidery } from "../../../features/InStockSlice";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import toast from "react-hot-toast";
import ProcessBillModal from "../../../Component/Modal/ProcessBillModal";
import moment from "moment-timezone";
import ReactSearchBox from "react-search-box";
import {
  blurOnWheel,
  getAvailableColors,
  getColorLimitError,
  getColorOptionLabel,
  getInitialReceived,
  getReceivedError,
  getRecordForId,
} from "../../../Utils/Common";
import ProcessAvailabilityCard from "../../../Component/Common/ProcessAvailabilityCard";
import Loading from "../../../Component/Loader/Loading";
import StatusChip from "../../../Component/Common/StatusChip";
import PageLoader from "../../../Component/Loader/PageLoader";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";
import SkipToPackingModal from "../Packing/components/SkipToPackingModal";
import { StepPackingIcon } from "../Packing/components/PackingStatusIcon";
import { canSendForward } from "../Packing/packingUtils";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const StonesDetails = () => {
  const { id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const {
    loading,
    SingleStone: storedStone,
    StnoneBillLoading,
    StonerpdfLoading,
  } = useSelector((state) => state.stone);
  const SingleStone = getRecordForId(storedStone, id);
  const { LaceForEmroidery } = useSelector((state) => state.InStock);

  const { SingleEmbroidery, loading: embroideryLoading } = useSelector((state) => state.Embroidery);
  const { loading: IsLoading, previousDataByPartyName } = useSelector(
    (state) => state.stitching
  );

  const [isUpdateReceivedConfirmOpen, setIsUpdateReceivedConfirmOpen] =
    useState(false);
  const [isCompletedConfirmOpen, setIsCompletedConfirmOpen] = useState(false);
  const [isGenerateGatePassOpen, setisGenerateGatePassOpen] = useState(false);
  const [processBillModal, setProcessBillModal] = useState(false);
  const [processBillData, setProcessBillData] = useState({});
  const [accountData, setAccountData] = useState(null);
  const [partyValue, setPartyValue] = useState("newParty");
  const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const {
    embroidery_Id,
    design_no,
    serial_No,
    from,
    source_step,
    source_id,
    source_availability,
  } = location.state || {};

  useEffect(() => {
    if (id !== "null") {
      const data = {
        id: id,
      };
      dispatch(GetSingleStone(data));
    } else {
      openModal();
    }
    dispatch(GetAllLaceForEmroidery());
  }, [id]);

  useEffect(() => {
    if (SingleStone?.embroidery_Id || embroidery_Id) {
      const data = {
        id: SingleStone?.embroidery_Id || embroidery_Id,
      };
      dispatch(GETEmbroiderySIngle(data));
    }
  }, [id, SingleStone]);

  const initialRow = { category: "", color: "", quantity_in_no: 0 };
  const stitchingInputClass =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-1 focus:ring-[#252525] focus:border-[#252525] block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white";
  const stitchingOptionClass =
    "bg-white text-gray-900 hover:bg-[#252525] hover:text-white";

  const getUniqueShirtRows = (rows = []) => {
    const seenColors = new Set();
    return rows.filter((item) => {
      const key = item?.color || `${item?.category || ""}-${seenColors.size}`;
      if (seenColors.has(key)) return false;
      seenColors.add(key);
      return true;
    });
  };

  const getShirtCategory = (color) =>
    (SingleEmbroidery?.shirt?.find((item) => item?.color === color) ||
      SingleEmbroidery?.shirt?.[0])?.category || "";

  const getInitialSuitRows = () => {
    if (stitchingAvailability?.byColor?.length) {
      const colorRows = getAvailableColors(stitchingAvailability).map((item) => ({
        category: getShirtCategory(item.color),
        color: item.color,
        quantity_in_no: item.available,
      }));
      return colorRows.length ? colorRows : [{ ...initialRow }];
    }

    const stoneRows =
      SingleStone?.category_quantity
        ?.filter((item) => item?.color)
        ?.map((item) => {
          const receivedQuantity = Number(item.recieved_Data?.r_total || 0);
          const matchingShirt = SingleEmbroidery?.shirt?.find(
            (shirt) => shirt?.color === item.color
          );

          return {
            category: matchingShirt?.category || "",
            color: item?.color || "",
            quantity_in_no: receivedQuantity || item.quantity || 0,
          };
        }) || [];

    if (stoneRows.length) return stoneRows;

    const shirtRows =
      getUniqueShirtRows(SingleEmbroidery?.shirt)
        ?.filter((item) => item?.category || item?.color)
        ?.map((item) => ({
          category: item?.category || "",
          color: item?.color || "",
          quantity_in_no: item?.received || 0,
        })) || [];

    return shirtRows.length ? shirtRows : [{ ...initialRow }];
  };

  const [formData, setFormData] = useState({
    partyName: "",
    serial_No: "",
    design_no: "",
    date: "",
    rate: "",
    embroidery_Id: "",
    suits_category: [initialRow],
    lace_quantity: "",
    lace_category: "",
    Quantity: "",
  });

  const [StoneData, setStoneData] = useState({
    id: SingleStone?.id,
    category_quantity: [],
  });

  useEffect(() => {
    if (SingleStone) {
      setStoneData({
        id: SingleStone.id,
        category_quantity: SingleStone?.category_quantity?.map((item) => ({
          id: item.id,
          category: item.category,
          color: item.color,
          quantity: item.quantity,
          received: getInitialReceived(SingleStone, item.recieved_Data?.r_total, item.quantity),
        })),
      });
    }
  }, [SingleStone]);

  useEffect(() => {
    setFormData({
      serial_No: SingleStone?.serial_No || serial_No || "",
      design_no: SingleStone?.design_no || design_no || "",
      embroidery_Id: SingleStone?.embroidery_Id || embroidery_Id || "",
      suits_category: getInitialSuitRows(),
      lace_category: "",
      date: today,
      partyName: "",
      partytype: partyValue,
      source_step: id !== "null" ? "Stone" : source_step || "Embroidery",
      source_id: id !== "null" ? SingleStone?.id : source_id || embroidery_Id || "",
    });
  }, [SingleStone, SingleEmbroidery, partyValue, id, source_step, source_id, embroidery_Id]);

  const [isPackingModalOpen, setPackingModalOpen] = useState(false);

  const getStitchingAvailability = () => {
    if (id === "null") return source_availability;
    return SingleStone?.processAvailability;
  };
  const stitchingAvailability = getStitchingAvailability();

  const getAvailableSuitOptions = (currentIndex) => {
    const selectedColors = new Set(
      formData?.suits_category
        ?.map((row, index) => (index === currentIndex ? null : row?.color))
        ?.filter(Boolean)
    );
    const options = stitchingAvailability?.byColor?.length
      ? getAvailableColors(stitchingAvailability).map((item) => ({
          category: getShirtCategory(item.color),
          color: item.color,
          available: item.available,
        }))
      : getUniqueShirtRows(SingleEmbroidery?.shirt);

    return (
      options?.filter(
        (item) => !item?.color || !selectedColors.has(item.color)
      ) || []
    );
  };

  const getAvailableSuitCategoryOptions = (currentIndex) => {
    const seenCategories = new Set();
    return getAvailableSuitOptions(currentIndex).filter((item) => {
      if (!item?.category || seenCategories.has(item.category)) return false;
      seenCategories.add(item.category);
      return true;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addNewRow = (categoryType) => {
    setFormData((prevState) => {
      const updatedCategory = prevState[categoryType] || [];
      const newCategoryArray = [...updatedCategory, { ...initialRow }];
      return {
        ...prevState,
        [categoryType]: newCategoryArray,
      };
    });
  };

  const removeRow = (categoryType, index) => {
    setFormData((prevState) => ({
      ...prevState,
      [categoryType]: prevState[categoryType].filter((_, idx) => idx !== index),
    }));
  };

  const handleCategoryChange = (e, index, categoryType) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [categoryType]: prevState[categoryType]?.map((row, i) => {
        if (i !== index) return row;
        if (categoryType !== "suits_category") {
          return { ...row, category: value };
        }

        const colorStillMatches = SingleEmbroidery?.shirt?.some(
          (item) => item?.category === value && item?.color === row.color
        );
        return {
          ...row,
          category: value,
          color: colorStillMatches ? row.color : "",
        };
      }),
    }));
  };

  const handleColorChange = (e, index, categoryType) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [categoryType]: prevState[categoryType]?.map((row, i) => {
        if (i !== index) return row;
        if (categoryType !== "suits_category") {
          return { ...row, color: value };
        }

        const matchingShirt = SingleEmbroidery?.shirt?.find(
          (item) =>
            item?.color === value &&
            (!row.category || item?.category === row.category)
        );
        return {
          ...row,
          category: matchingShirt?.category || row.category,
          color: value,
        };
      }),
    }));
  };

  const handleQuantityChange = (e, index, categoryType) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [categoryType]: prevState[categoryType]?.map((row, i) =>
        i === index ? { ...row, quantity_in_no: value } : row
      ),
    }));
  };

  //CALCULAATE TOTAL QUANTITY FOR STITCHING DATA
  const validateValue = (value) => {
    return isNaN(value) || value === undefined || value === null
      ? 0
      : parseInt(value);
  };

  const calculateTotalQuantity = () => {
    let totalQuantity = 0;
    if (formData.suits_category) {
      formData.suits_category.forEach((item) => {
        totalQuantity += validateValue(item.quantity_in_no);
      });
    }

    return totalQuantity;
  };

  //VALIDATE SUITS DATA
  const validateSuitData = () => {
    if (formData.suits_category && formData.suits_category.length >= 0) {
      formData.suits_category = formData.suits_category.filter((item) => {
        return !(
          item.category === "" &&
          item.color === "" &&
          item.quantity_in_no === 0
        );
      });
      if (formData.suits_category.length === 0) {
        delete formData.suits_category;
      }
    } else if (
      formData.suits_category &&
      formData.suits_category.length === 0
    ) {
      delete formData.suits_category;
    }
  };

  const handleSubmitstitching = (e) => {
    e.preventDefault();
    validateSuitData();
    if (!formData.suits_category) {
      toast.error("Please add Shirt Data");
    } else {
      const requestedQuantity = calculateTotalQuantity();
      const availableQuantity =
        stitchingAvailability?.available !== undefined
          ? Number(stitchingAvailability.available || 0)
          : 0;

      if (availableQuantity <= 0) {
        return toast.error("No available quantity from previous step");
      }

      if (requestedQuantity > availableQuantity) {
        return toast.error(
          `Invalid quantity. Available quantity is ${availableQuantity}`
        );
      }

      const colorError = getColorLimitError(
        stitchingAvailability,
        formData.suits_category,
        "quantity_in_no"
      );
      if (colorError) return toast.error(colorError);

      dispatch(
        createStitching({ ...formData, Quantity: requestedQuantity })
      ).then((res) => {
        if (res.payload.success === true) {
          closeModal();
          navigate("/dashboard/stitching");
        }
      });
    }
  };

  const handleUpdateStone = (e) => {
    e.preventDefault();

    dispatch(UpdateStoneAsync(StoneData))
      .then((res) => {
        if (res.payload.success) {
          const data = {
            id: id,
          };
          dispatch(GetSingleStone(data));
          closeUpdateRecievedModal();
        }
      })
      .catch(() => {
        closeUpdateRecievedModal();
      });
  };

  const handleCompleteStone = (e) => {
    e.preventDefault();

    dispatch(
      UpdateStoneAsync({
        id: SingleStone?.id,
        T_Quantity: SingleStone?.category_quantity?.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        project_status: "Completed",
      })
    ).then(() => {
      const data = {
        id: id,
      };
      dispatch(GetSingleStone(data));
      closeCompletedModal();
    });
  };

  const handleStoneReceivedChange = (e, index) => {
    const { value } = e.target;
    const error = getReceivedError(value, StoneData.category_quantity?.[index]?.quantity);
    if (error) return toast.error(error);

    setStoneData((prevData) => ({
      ...prevData,
      category_quantity: prevData.category_quantity?.map((row, rowIndex) =>
        rowIndex === index ? { ...row, received: value } : row
      ),
    }));
  };

  const openModal = () => {
    if (
      id !== "null" &&
      Number(SingleStone?.processAvailability?.capacity || SingleStone?.r_quantity || 0) <= 0
    ) {
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

  const T_Quantity = SingleStone?.category_quantity?.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleGenerateGatePassPDf = () => {
    const data = { ...SingleStone, T_Quantity };
    dispatch(generateStoneGatePssPdfAsync(data));
    closeGatepassModal();
  };

  const T_QuantityForBill = SingleStone?.r_quantity;

  const generateBill = (e) => {
    e.preventDefault();
    if (!T_QuantityForBill || T_QuantityForBill === 0) {
      toast.error("Unable To Generate Bill Because Front Category Is Missing");
      return;
    }
    const formData = {
      ...SingleStone,
      date: SingleStone?.date,
      r_quantity: T_QuantityForBill,
      process_Category: "Stone",
      Stone_id: SingleStone.id,
      Manual_No: processBillData.Manual_No,
      additionalExpenditure: processBillData.additionalExpenditure,
    };
    dispatch(generateStoneBillAsync(formData)).then((res) => {
      if (res.payload.success) {
        closeBillModal();
      }
    });
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <PageLoader />
      </section>
    );
  }

  const handleOpenGatePassModal = () => {
    setisGenerateGatePassOpen(true);
  };

  const closeGatepassModal = () => {
    setisGenerateGatePassOpen(false);
    document.body.style.overflow = "auto";
  };

  const openGenerateBillForm = () => {
    setProcessBillModal(true);
  };

  const closeBillModal = () => {
    setProcessBillModal(false);
    setProcessBillData({
      Manual_No: "",
      additionalExpenditure: "",
    });
  };

  const HandleProcessBillDataChange = (data) => {
    setProcessBillData(data);
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
    dispatch(getStitchingDataBypartyNameAsync({ partyName: value }));
  };

  const searchResults = previousDataByPartyName?.stitchingData?.map((item) => {
    return {
      key: item.partyName,
      value: item.partyName,
    };
  });

  const openPackingMOdal = () => {
    if (Number(SingleStone?.processAvailability?.available || 0) <= 0) {
      return toast.error("No available quantity for packing");
    }
    setPackingModalOpen(true);
  };


  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Stones Details
          </h1>
        </div>

        {/* -------------- DETAILS SECTION -------------- */}
        <div className="details mx-2 mt-8 px-3 text-gray-800 dark:text-gray-200 py-5 border border-gray-300 dark:border-gray-500 bg-[#F7F7F7] dark:bg-gray-800 rounded-md">
          <div className="grid items-start grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-x-2.5 gap-y-5 text-sm">
            {/* FIRST ROW */}
            <div className="box">
              <span className="font-medium">Party Name:</span>
              <span> {SingleStone?.partyName}</span>
            </div>
            <div className="box">
              <span className="font-medium">Manual No:</span>
              <span>{SingleStone?.Manual_No ?? "--"}</span>
            </div>
            <div className="box">
              <span className="font-medium">Design No:</span>
              <span>{SingleStone?.design_no}</span>
            </div>

            <div className="box">
              <span className="font-medium">Total Quantity:</span>
              <span>
                {" "}
                {SingleStone?.category_quantity?.reduce(
                  (total, item) => total + item.quantity,
                  0,
                )}{" "}
              </span>
            </div>

            <div className="box">
              <span className="font-medium">R Quantity:</span>
              <span>
                {" "}
                {SingleStone?.r_quantity ? SingleStone?.r_quantity : "--"}
              </span>
            </div>

            <div className="box">
              <span className="font-medium">Per Suit:</span>
              <span>{SingleStone?.rate}</span>
            </div>
            <div className="box">
              <span className="font-medium">Project Status:</span>
              <span className="inline-flex items-center gap-2">
                <StatusChip status={SingleStone?.project_status} fallback="" />
                <StepPackingIcon step="Stone" record={SingleStone} />
              </span>
            </div>

            {SingleStone?.category_quantity?.map((item, index) => (
              <div className="box" key={index}>
                <span className="font-medium">{item.category}:</span>
                <span> {item.quantity}-{item.color}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RECEIVED SUITS COLORS */}
        <div className="my-10 px-3 text-gray-800 dark:text-gray-200">
          <h2 className="font-semibold">Enter Received Quantity</h2>
          <div className="mt-3 space-y-3 max-w-4xl">
            {StoneData.category_quantity?.map((row, index) => (
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
                  value={row.received}
                  onChange={(e) => handleStoneReceivedChange(e, index)}
                  onWheel={blurOnWheel}
                  disabled={SingleStone?.project_status === "Completed"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center">
          {SingleStone?.project_status !== "Completed" && (
            <button
              className="px-3 py-2 text-sm rounded bg-[#252525] text-white border-none"
              onClick={handleUpdateReceivedClick}
            >
              Update Recived
            </button>
          )}
        </div>

        {/* -------------- BUTTONS BAR -------------- */}
        <div className="mt-6 flex justify-center items-center gap-x-5">
          {SingleStone?.project_status !== "Completed" &&
            SingleStone?.updated && (
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white  dark:text-gray-800"
                onClick={handleCompletedClick}
              >
                Completed
              </button>
            )}
          {SingleStone?.project_status === "Completed" &&
            !SingleStone?.bill_generated && (
              <button
                onClick={openGenerateBillForm}
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
              >
                Generate Bill
              </button>
            )}
          {StonerpdfLoading ? (
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
          {SingleStone?.project_status === "Completed" && (
            <>
              <button
                className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                onClick={openModal}
              >
                Next Step
              </button>
              {canSendForward(SingleEmbroidery, SingleStone?.processAvailability) && (
                <button
                  onClick={openPackingMOdal}
                  className="px-4 py-2.5 cursor-pointer text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                >
                  Skip To Packing
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative scrollable-content h-[70vh] py-4 px-3 w-[95%] max-w-5xl max-h-[70vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold  text-gray-900 dark:text-white">
                  Stitching
                </h3>
                <ProcessAvailabilityCard availability={stitchingAvailability} />
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
            {embroideryLoading ? (
              <div className="flex justify-center items-center mt-14">
                <Loading />
              </div>
            ) : (
              <div className="p-4 md:p-5">
                <form className="space-y-4" onSubmit={handleSubmitstitching}>
                  {/* INPUT FIELDS DETAILS */}
                  <div className="mb-8 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
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

                    {/* PARTY NAME */}
                    <div>
                      {partyValue === "newParty" ? (
                        <input
                          name="partyName"
                          type="text"
                          placeholder="Party Name"
                          className={stitchingInputClass}
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

                    {/* SERIAL NO */}
                    <div>
                      <input
                        name="serial_No"
                        type="text"
                        placeholder="Serial No"
                        className={stitchingInputClass}
                        required
                        value={formData.serial_No}
                        onChange={handleChange}
                        readOnly
                      />
                    </div>

                    {/* DESIGN NO */}
                    <div>
                      <input
                        name="design_no"
                        type="text"
                        placeholder="Design No"
                        className={stitchingInputClass}
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
                        type="text"
                        placeholder="Date"
                        className={stitchingInputClass}
                        required
                        value={formData.date}
                        readOnly
                      />
                    </div>

                    {/* ENTER RATE */}
                    <div>
                      <input
                        name="rate"
                        type="text"
                        placeholder="Enter Rate"
                        className={stitchingInputClass}
                        required
                        step="0.01"
                        value={formData?.rate}
                        onChange={handleChange}
                      />
                    </div>

                    {/* LACE QUANTITY */}
                    <div>
                      <input
                        name="lace_quantity"
                        type="number"
                        placeholder="Lace Quantity"
                        className={stitchingInputClass}
                        value={formData?.lace_quantity}
                        onChange={handleChange}
                      />
                    </div>

                    {/* LACE CATEGORY */}

                    <div>
                      <ThemedSelect className="w-full"
                        name="lace_category"
                        value={formData?.lace_category}
                        onChange={handleChange}
                      >
                        <option className={stitchingOptionClass} value="">
                          Select Value
                        </option>

                        {LaceForEmroidery?.map((item, index) => (
                          <option
                            className={stitchingOptionClass}
                            key={index}
                            value={item.category}
                          >
                            {item.category}
                          </option>
                        ))}
                      </ThemedSelect>
                    </div>
                  </div>

                  <div className="box">
                    <div className="flex justify-between items-center ">
                      <h2 className="block mb-0 text-sm font-medium text-gray-900 dark:text-white">
                        Enter Suit Colors And Quantity :
                      </h2>
                      <p
                        onClick={() => addNewRow("suits_category")}
                        className="cursor-pointer"
                      >
                        <FiPlus size={24} className=" dark:text-white" />
                      </p>
                    </div>

                    {/* SUITS DATA */}

                    {formData?.suits_category?.map((row, index) => (
                      <div
                        key={index}
                        className="my-5 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
                      >
                        {/* SELECT CATEGORY */}
                        <div>
                          <ThemedSelect className="w-full"
                            value={row.category}
                            onChange={(e) =>
                              handleCategoryChange(e, index, "suits_category")
                            }
                          >
                            <option className={stitchingOptionClass} value="">
                              Select Value
                            </option>

                            {getAvailableSuitCategoryOptions(index)?.map(
                              (item, index) => (
                                <option
                                  className={stitchingOptionClass}
                                  key={`${item?.category}-${item?.color}-${index}`}
                                  value={item?.category}
                                >
                                  {item?.category}
                                </option>
                              ),
                            )}
                          </ThemedSelect>
                        </div>

                        {/* SELECTED COLORS */}
                        <div>
                          <ThemedSelect className="w-full"
                            value={row.color}
                            onChange={(e) =>
                              handleColorChange(e, index, "suits_category")
                            }
                          >
                            <option className={stitchingOptionClass} value="">
                              Select Value
                            </option>

                            {getAvailableSuitOptions(index)
                              ?.filter(
                                (item) =>
                                  !row.category ||
                                  item?.category === row.category,
                              )
                              ?.map((item, index) => (
                                <option
                                  className={stitchingOptionClass}
                                  key={`${item?.color}-${index}`}
                                  value={item?.color}
                                >
                                  {getColorOptionLabel(item)}
                                </option>
                              ))}
                          </ThemedSelect>
                        </div>

                        {/* ENTER QUANITY */}
                        <div className="col-span-2 flex gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Enter Quantity In No"
                            className={stitchingInputClass}
                            value={row.quantity_in_no || ""}
                            onChange={(e) =>
                              handleQuantityChange(e, index, "suits_category")
                            }
                          />
                          {formData?.suits_category?.length > 1 && (
                            <button
                              onClick={() => removeRow("suits_category", index)}
                              className="end-2.5 text-red-500 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

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
            )}
          </div>
        </div>
      )}

      {isUpdateReceivedConfirmOpen && (
        <ConfirmationModal
          title="Confirm Update"
          message="Are you sure you want to update the received items?"
          onConfirm={handleUpdateStone}
          onClose={closeUpdateRecievedModal}
        />
      )}

      {isCompletedConfirmOpen && (
        <ConfirmationModal
          title="Confirm Complete"
          message="Are you sure you want to Complete?"
          onConfirm={handleCompleteStone}
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
          loading={StnoneBillLoading}
          closeModal={closeBillModal}
          Manual_No={SingleStone?.Manual_No}
          processBillAmount={Math.round(
            SingleStone?.rate * SingleStone?.r_quantity,
          )}
        />
      )}

      {isPackingModalOpen && (
        <SkipToPackingModal
          embroidery={SingleEmbroidery}
          sourceStep="Stone"
          sourceRecord={SingleStone}
          onClose={() => setPackingModalOpen(false)}
        />
      )}
    </>
  );
};

export default StonesDetails;
