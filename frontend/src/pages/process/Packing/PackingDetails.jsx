import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addInStockFromPackagingAsync,
  GetSingleStitching,
} from "../../../features/stitching";
import { GETEmbroiderySIngle } from "../../../features/EmbroiderySlice";
import PicturesOrder from "../../bills/Modals/PicturesOrder";
import { getOrderProcessPartiesAsync } from "../../../features/B_pairSlice";
import { formatAmount, getRecordForId } from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";
import {
  getPenaltyStatus,
  getRowQuantities,
  isPackingRowInvalid,
  toPackingRow,
} from "./packingUtils";
import PackingOrderSummary from "./components/PackingOrderSummary";
import PackingStockSection from "./components/PackingStockSection";
import BPairPenaltySection from "./components/BPairPenaltySection";
import PackingConfirmModal from "./components/PackingConfirmModal";

const PackingDetails = () => {
  const { id } = useParams();
  const {
    SingleStitching: storedStitching,
    loading,
    addInStockLoading,
  } = useSelector((state) => state.stitching);
  const SingleStitching = getRecordForId(storedStitching, id);
  const { processParties, processPartiesLoading } = useSelector(
    (state) => state.B_Pair
  );
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [picturesOrderModal, setpicturesOrderModal] = useState(false);
  const [penaltyValues, setPenaltyValues] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    d_no: "",
    useBags: false,
    embroidery_Id: "",
    suits_category: [],
    dupatta_category: [],
    Manual_No: null,
    serial_No: null,
  });
  const [defaultPrices, setDefaultPrices] = useState({
    cost_price: "",
    sale_price: "",
    b_pair_sale_price: "",
  });

  const { SingleEmbroidery } = useSelector((state) => state.Embroidery);
  const {
    embroidery_Id,
    design_no,
    serial_No,
    Manual_No,
    suits_category,
    source_step,
    source_id,
  } = location.state || {};

  const stitching =
    id !== "null" && SingleStitching?.id === id ? SingleStitching : null;

  useEffect(() => {
    if (
      id === "null" &&
      [embroidery_Id, design_no, serial_No, suits_category, source_step, source_id].some(
        (value) => value === undefined
      )
    ) {
      navigate("/dashboard/embroidery");
    }
  }, [embroidery_Id, design_no, serial_No, suits_category, source_step, source_id, id]);

  useEffect(() => {
    if (id !== "null") {
      const data = { id };
      dispatch(GetSingleStitching(data));
    }
  }, [id, dispatch]);

  useEffect(() => {
    const stitchingDetails = stitching && {
      d_no: stitching.design_no,
      embroidery_Id: stitching.embroidery_Id,
      packing_Id: stitching.id,
      Manual_No: stitching.Manual_No,
      serial_No: stitching.serial_No,
    };

    if (stitching?.suits_category?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...stitchingDetails,
        suits_category: stitching.suits_category.map((item) =>
          toPackingRow(item, item.recieved)
        ),
        dupatta_category: [],
      }));
    } else if (stitching?.dupatta_category?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...stitchingDetails,
        suits_category: [],
        dupatta_category: stitching.dupatta_category.map((item) =>
          toPackingRow(item, item.recieved)
        ),
      }));
    } else if (id === "null" && suits_category?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        d_no: design_no,
        embroidery_Id: embroidery_Id,
        Manual_No: Manual_No,
        serial_No: serial_No,
        suits_category: suits_category.map((item) =>
          toPackingRow(item, item.received)
        ),
        dupatta_category: [],
        source_step,
        source_id,
      }));
    }
    const idData = stitching?.embroidery_Id || embroidery_Id;
    if (idData) {
      dispatch(GETEmbroiderySIngle({ id: idData }));
    }
  }, [stitching, id]);

  useEffect(() => {
    setPenaltyValues({});
    if (formData.embroidery_Id) {
      dispatch(
        getOrderProcessPartiesAsync({ embroidery_Id: formData.embroidery_Id })
      );
    }
  }, [formData.embroidery_Id, dispatch]);

  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <PageLoader />
      </section>
    );
  }

  const handleInputChange = (category, index, field, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [category]: prevState[category]?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleDefaultPriceChange = (field, value) => {
    setDefaultPrices((prevState) => ({
      ...prevState,
      [field]: value,
    }));
    setFormData((prevState) => ({
      ...prevState,
      suits_category: prevState.suits_category?.map((item) => ({
        ...item,
        [field]: value,
      })),
      dupatta_category: prevState.dupatta_category?.map((item) => ({
        ...item,
        [field]: value,
      })),
    }));
  };

  const handleDefaultStitchTypeChange = (stitchType) => {
    setFormData((prevState) => ({
      ...prevState,
      suits_category: prevState.suits_category?.map((item) => ({
        ...item,
        stitch_type: stitchType,
      })),
      dupatta_category: prevState.dupatta_category?.map((item) => ({
        ...item,
        stitch_type: stitchType,
      })),
    }));
  };

  const handlePenaltyChange = (key, field, value) => {
    setPenaltyValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const stockRows = [
    ...(formData?.suits_category || []),
    ...(formData?.dupatta_category || []),
  ];
  const totalBPairQuantity = stockRows.reduce(
    (total, item) => total + getRowQuantities(item).bPair,
    0
  );
  const totalReceivedQuantity = stockRows.reduce(
    (total, item) => total + getRowQuantities(item).received,
    0
  );
  const penaltyStatus = getPenaltyStatus(
    processParties,
    penaltyValues,
    totalBPairQuantity
  );
  const penaltyRows = totalBPairQuantity > 0 ? penaltyStatus.assignedRows : [];
  const totalPenalty = totalBPairQuantity > 0 ? penaltyStatus.totalPenalty : 0;

  const handleAddInStock = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      b_pair_parties: penaltyRows.map(({ party, quantity, labour_quantity, additional_cost }) => ({
        process_step: party.process_step,
        process_id: party.process_id,
        quantity,
        labour_quantity,
        additional_cost,
      })),
    };
    dispatch(addInStockFromPackagingAsync(payload)).then((res) => {
      if (res.payload?.success) {
        closeConfirmationModal();
        navigate("/dashboard/suits");
      }
    });
  };

  const openConfirmationModal = () => {
    setConfirmationModal(true);
  };

  const closeConfirmationModal = () => {
    setConfirmationModal(false);
  };

  const viewPicturesOrderData = () => {
    setpicturesOrderModal(true);
  };

  const hidePicturesOrderData = () => {
    setpicturesOrderModal(false);
  };

  const handleChecked = (e) => {
    const value = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      useBags: value,
    }));
  };

  const isAddInStockDisabled =
    stockRows.length === 0 ||
    stockRows.some(isPackingRowInvalid) ||
    !penaltyStatus.isComplete;

  const stockSections = [
    { key: "suits_category", title: "Shirt Data For Stock" },
    { key: "dupatta_category", title: "Duppata Data For Stock" },
  ]
    .filter((section) => formData?.[section.key]?.length > 0)
    .map((section) => ({ ...section, rows: formData[section.key] }));

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        {/* HEADER */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Packing Details
          </h1>
        </div>

        <PackingOrderSummary
          serialNo={stitching?.serial_No || serial_No}
          manualNo={stitching?.Manual_No || Manual_No}
          designNo={stitching?.design_no || design_no}
          additionalCost={SingleEmbroidery?.additionalExpenditure}
          picturesOrder={SingleEmbroidery?.pictures_Order}
          onViewPictures={viewPicturesOrderData}
          useBags={formData.useBags}
          onUseBagsChange={handleChecked}
        />

        <PackingStockSection
          defaultPrices={defaultPrices}
          onDefaultPriceChange={handleDefaultPriceChange}
          onDefaultStitchTypeChange={handleDefaultStitchTypeChange}
          sections={stockSections}
          onRowChange={handleInputChange}
        />

        {totalBPairQuantity > 0 && (
          <BPairPenaltySection
            loading={processPartiesLoading}
            totalBPairQuantity={totalBPairQuantity}
            status={penaltyStatus}
            penaltyValues={penaltyValues}
            onPenaltyChange={handlePenaltyChange}
          />
        )}

        {/* ACTION BAR */}
        <div className="mx-2 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700 dark:text-gray-200">
            <span>
              Main stock{" "}
              <strong className="text-gray-900 dark:text-white">
                {totalReceivedQuantity - totalBPairQuantity}
              </strong>
            </span>
            <span>
              B-Pair{" "}
              <strong className="text-gray-900 dark:text-white">{totalBPairQuantity}</strong>
            </span>
            {totalBPairQuantity > 0 && (
              <span>
                Penalties{" "}
                <strong className="text-gray-900 dark:text-white">
                  {formatAmount(totalPenalty)}
                </strong>
              </span>
            )}
          </div>
          <button
            className={`px-4 py-2.5 text-sm rounded text-white dark:text-gray-800 ${
              isAddInStockDisabled
                ? "cursor-not-allowed bg-gray-400 dark:bg-gray-500"
                : "bg-[#252525] dark:bg-gray-200"
            }`}
            disabled={isAddInStockDisabled}
            onClick={openConfirmationModal}
          >
            Add In Stock
          </button>
        </div>

        {confirmationModal && (
          <PackingConfirmModal
            useBags={formData?.useBags}
            picturesOrder={!!SingleEmbroidery?.pictures_Order}
            totalBPairQuantity={totalBPairQuantity}
            penaltyRows={penaltyRows}
            loading={addInStockLoading}
            onCancel={closeConfirmationModal}
            onConfirm={handleAddInStock}
          />
        )}
      </section>

      {picturesOrderModal && (
        <PicturesOrder
          id={SingleEmbroidery?.id || embroidery_Id}
          closeModal={hidePicturesOrderData}
        />
      )}
    </>
  );
};

export default PackingDetails;
