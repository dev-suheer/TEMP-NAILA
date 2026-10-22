import React, { useState, useEffect } from "react";
import "./Stock.css";
import {
  GetAllStockForBranch,
  approveOrRejectStock,
  getPendingStockForBranchAsync,
  returnStockToMainAsync,
} from "../../features/InStockSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Pagination from "../Common/Pagination";
import {
  buildPaginationQuery,
  getPageLimit,
} from "../../Utils/Common";
import toast from "react-hot-toast";
import PageLoader from "../Loader/PageLoader";
import StockFilters from "../Common/StockFilters";
import ButtonSpinner from "../Common/button/ButtonSpinner";
const StockForBranch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [userSelectedCategory, setuserSelectedCategory] = useState("");
  const [confirmationModal, setconfirmationModal] = useState(false);
  const [rejectModal, setrejectModal] = useState(false);
  const [record, setRecord] = useState(false);
  const [search, setSearch] = useState();
  const [stitchType, setStitchType] = useState("");
  const [returnMode, setReturnMode] = useState(false);
  const [selectedReturnItems, setSelectedReturnItems] = useState([]);
  const [rawReturnBundle, setRawReturnBundle] = useState([]);
  const [returnBundles, setReturnBundles] = useState([]);
  const [returnNote, setReturnNote] = useState("");
  const [returnBundlesModal, setReturnBundlesModal] = useState(false);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  const {
    suitStocks,
    GetSuitloading,
    SuitLoading,
    stockLoading,
    pendingStock,
  } = useSelector((state) => state.InStock);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(
      GetAllStockForBranch({
        category: userSelectedCategory,
        search,
        stitch_type: stitchType,
        page,
        limit,
      })
    );
    dispatch(getPendingStockForBranchAsync());
  }, [page, limit, dispatch]);

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  const openConfirmationModal = (record) => {
    setconfirmationModal(true);
    setRecord(record);
    document.body.style.overflow = "hidden";
  };

  const closeConfirmationModal = () => {
    setconfirmationModal(false);
    document.body.style.overflow = "auto";
  };

  const openRejectModal = (record) => {
    setrejectModal(true);
    setRecord(record);
    document.body.style.overflow = "hidden";
  };

  const closeRejectModal = () => {
    setrejectModal(false);
    document.body.style.overflow = "auto";
  };

  const resetReturnFlow = () => {
    setReturnMode(false);
    setSelectedReturnItems([]);
    setRawReturnBundle([]);
    setReturnBundles([]);
    setReturnNote("");
    setReturnBundlesModal(false);
  };

  const toggleReturnMode = () => {
    if (returnMode) {
      resetReturnFlow();
      return;
    }
    setReturnMode(true);
  };

  const handleReturnSelection = (item) => {
    setSelectedReturnItems((prev) => {
      if (prev.some((selected) => selected._id === item._id)) {
        return prev.filter((selected) => selected._id !== item._id);
      }
      return [...prev, { ...item, returnQuantity: 0 }];
    });
  };

  const handleReturnQuantityChange = (itemId, value) => {
    const quantity = value === "" ? "" : Number(value);
    setSelectedReturnItems((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, returnQuantity: quantity } : item
      )
    );
  };

  const handleAddReturnInBundle = (item) => {
    if (!item) return;
    const returnQuantity = Number(item.returnQuantity);
    const existingBundledQuantity = [...returnBundles.flat(), ...rawReturnBundle]
      .filter((record) => record.branchStock_Id === item._id)
      .reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    if (returnQuantity <= 0) {
      toast.error("Return quantity must be greater than 0");
      return;
    }
    if (existingBundledQuantity + returnQuantity > Number(item.total_quantity)) {
      toast.error("Return quantity cannot exceed available branch stock");
      return;
    }
    const returnDataForBundle = {
      branchStock_Id: item._id,
      Item_Id: item.main_stock_Id,
      category: item.category,
      color: item.color,
      stitch_type: item.stitch_type,
      quantity: returnQuantity,
      cost_price: item.cost_price,
      sale_price: item.sale_price,
      d_no: item.d_no,
    };
    setRawReturnBundle((prev) => [...prev, returnDataForBundle]);
  };

  const handleCreateReturnBundle = () => {
    if (rawReturnBundle.length === 0) return;
    setReturnBundles((prev) => [...prev, rawReturnBundle]);
    setRawReturnBundle([]);
    setSelectedReturnItems([]);
  };

  const handleRemoveReturnBundle = (index) => {
    setReturnBundles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = () => {
    if (returnBundles.length === 0) {
      toast.error("Please create at least one return bundle");
      return;
    }
    if (!returnNote.trim()) {
      toast.error("Please enter your note");
      return;
    }

    dispatch(returnStockToMainAsync({ bundles: returnBundles, note: returnNote.trim() })).then(
      (res) => {
        if (res.payload?.success === true) {
          resetReturnFlow();
          dispatch(
            GetAllStockForBranch({
              category: userSelectedCategory,
              search,
              stitch_type: stitchType,
              page,
              limit,
            })
          );
        }
      }
    );
  };




  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    const payload = {
      category: userSelectedCategory,
      page: 1,
      limit,
      search: value || undefined,
      stitch_type: stitchType,
      id: user?.user?.branchId,
    };

    dispatch(GetAllStockForBranch(payload));
    navigate(`${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleCategoryClick = (category) => {
    const selectedCategory = category === "all" ? "" : category;
    setuserSelectedCategory(selectedCategory);

    // check
    if (category === "all") {
      dispatch(
        GetAllStockForBranch({ search, stitch_type: stitchType, page: 1, limit })
      );
    } else if (search) {
      dispatch(
        GetAllStockForBranch({
          category,
          search,
          stitch_type: stitchType,
          page: 1,
          limit,
        })
      );
    } else {
      dispatch(
        GetAllStockForBranch({ category, stitch_type: stitchType, page: 1, limit })
      );
    }
  };

  const handleStitchTypeChange = (value) => {
    setStitchType(value);
    dispatch(
      GetAllStockForBranch({
        category: userSelectedCategory,
        search,
        stitch_type: value,
        page: 1,
        limit,
      })
    );
    navigate(`${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleAccept = () => {
    const stockId = record;
    const payload = {
      stockId,
      status: "Approved",
    };

    dispatch(approveOrRejectStock(payload))
      .then((res) => {
        if (res.payload.success === true) {
          closeModal();
          closeConfirmationModal();
    dispatch(getPendingStockForBranchAsync());

          dispatch(
            GetAllStockForBranch({
        category: userSelectedCategory,
        search,
        stitch_type: stitchType,
        page,
        limit,
      })
          );
        }
      })
      .catch((error) => {
        console.error("Error processing stock:", error);
      });
  };

  const handleReject = () => {
    const stockId = record;
    const payload = {
      stockId,
      status: "Rejected",
    };

    dispatch(approveOrRejectStock(payload))
      .then((res) => {
        if (res.payload.success === true) {
          closeModal();
          closeRejectModal();
    dispatch(getPendingStockForBranchAsync());

          dispatch(
            GetAllStockForBranch({
        category: userSelectedCategory,
        search,
        stitch_type: stitchType,
        page,
        limit,
      })
          );
        }
      })
      .catch((error) => {
        console.error("Error processing stock:", error);
      });
  };

  const setStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "yellow-400 ";
      case "Approved":
        return "green-500";
      case "Returned":
        return "red-500 ";
      default:
        return "gray-400";
    }
  };

  let notificationCount = pendingStock?.length;

    const getALLBundlesQuantity = (data) => {
    const rawData = data?.bundles || []
    const allBundlesQuantitySum = rawData?.reduce((acc,record) => {
      let totalSum = 0
      const flatData = record.flat();
      flatData.forEach((item) => {
        totalSum += item.quantity
      })
      acc.allBundlesQuantitySum += totalSum;
    return acc;

    },{   
      allBundlesQuantitySum:0
    });
    return allBundlesQuantitySum
  };


  const getSingleBundlesQuantity = (data) => {
    const singleBundleQuantitySum = data?.reduce((acc,record) => {
      let totalSum = 0
        totalSum += record.quantity
      acc.singleBundleQuantitySum += totalSum;
    return acc;

    },{   
      singleBundleQuantitySum:0
    });
    return singleBundleQuantitySum
  };


  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Suits
          </h1>

          {/* <!-- search bar --> */}
          <div className="search_bar mr-2 flex justify-center items-center gap-x-5">
            <div className="relative inline-block">
              <button
                onClick={openModal}
                className="relative rounded-sm border border-gray-700 bg-gray-600 p-1.5 text-white hover:bg-gray-700 hover:text-gray-100 focus:ring-0"
              >
                New Stock
                {notificationCount > 0 && (
                  <span className="absolute top-[-9px] inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-red-500 border-2 border-white rounded-full animate-blink">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={toggleReturnMode}
              className={`rounded-sm border border-gray-700 p-1.5 text-white hover:bg-gray-700 hover:text-gray-100 focus:ring-0 ${
                returnMode ? "bg-gray-800" : "bg-gray-600"
              }`}
            >
              {returnMode ? "Cancel Return" : "Return Stock"}
            </button>

            <div className="relative mt-4 md:mt-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="w-5 h-5 text-gray-800 dark:text-gray-200"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>

              <input
                type="text"
                className="md:w-64 lg:w-72 py-2 pl-10 pr-4 text-gray-800 dark:text-gray-200 bg-transparent border border-[#D9D9D9] rounded-lg focus:border-[#D9D9D9] focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-[#D9D9D9] placeholder:text-sm dark:placeholder:text-gray-300"
                placeholder="Search by Design No or SKU"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {returnMode && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCreateReturnBundle}
                disabled={rawReturnBundle.length === 0}
                className={`rounded px-4 py-2 text-sm ${
                  rawReturnBundle.length > 0
                    ? "bg-[#252525] text-white dark:bg-gray-200 dark:text-gray-800"
                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
              >
                Create Bundle
              </button>
              <button
                onClick={() => setReturnBundlesModal(true)}
                disabled={returnBundles.length === 0}
                className={`rounded px-4 py-2 text-sm ${
                  returnBundles.length > 0
                    ? "bg-[#252525] text-white dark:bg-gray-200 dark:text-gray-800"
                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
              >
                View Bundles
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Bundle Items: {rawReturnBundle.length} | Bundles: {returnBundles.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Return note"
                className="h-10 w-64 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-gray-700 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSubmitReturn}
                disabled={stockLoading || returnBundles.length === 0}
                className={`inline-flex items-center justify-center gap-2 rounded px-5 py-2 text-sm ${
                  !stockLoading && returnBundles.length > 0
                    ? "bg-[#252525] text-white dark:bg-gray-200 dark:text-gray-800"
                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
              >
                {stockLoading && <ButtonSpinner />}
                Submit Return
              </button>
            </div>
          </div>
        )}

        {/* -------------- FILTERS -------------- */}
        <StockFilters
          categories={suitStocks?.category_data}
          total={suitStocks?.total_stock}
          category={userSelectedCategory}
          onCategoryChange={(category) => {
            handleCategoryClick(category || "all");
            navigate(`/dashboard/suits${buildPaginationQuery(searchParams, { page: 1, limit })}`);
          }}
          stitchType={stitchType}
          onStitchTypeChange={handleStitchTypeChange}
        />

        {/* -------------- TABLE -------------- */}
        {GetSuitloading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5 ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  {returnMode && (
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                      Select
                    </th>
                  )}
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    D # No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Category
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Colors
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Type
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    SKU
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Total Quantity
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Sold Quantity
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Cost Prices
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                    Sales Prices
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-center text-xs md:text-sm" scope="col">
                    Last Updated
                  </th>
                  {returnMode && (
                    <>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                        Return Qty
                      </th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm" scope="col">
                        Action
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {suitStocks && suitStocks?.data?.length > 0 ? (
                  suitStocks?.data?.map((data, index) => {
                    const selectedReturnItem = selectedReturnItems.find(
                      (item) => item._id === data._id
                    );
                    return (
                      <tr
                        key={index}
                        className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        {returnMode && (
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                            {data.total_quantity > 0 && (
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-700 focus:ring-0 dark:border-gray-600 dark:bg-gray-700"
                                checked={Boolean(selectedReturnItem)}
                                onChange={() => handleReturnSelection(data)}
                              />
                            )}
                          </td>
                        )}
                        <th
                          className="px-6 text-center py-4 font-medium"
                          scope="row"
                        >
                          {data.d_no}
                        </th>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">{data.category}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">{data.color}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">{data.stitch_type}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">{data.sku}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                          {data.total_quantity}/T-{data?.total_dno_quantity}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                          {data.sold_quantity}
                        </td>

                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                          {data.cost_price}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                          {data.sale_price}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                          {data.lastUpdated}
                        </td>
                        {returnMode && (
                          <>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                              <input
                                type="number"
                                min="0"
                                max={data.total_quantity}
                                disabled={!selectedReturnItem}
                                value={selectedReturnItem?.returnQuantity ?? ""}
                                onChange={(e) =>
                                  handleReturnQuantityChange(data._id, e.target.value)
                                }
                                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-gray-700 focus:border-gray-700 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-gray-100"
                              />
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">
                              <button
                                onClick={() => handleAddReturnInBundle(selectedReturnItem)}
                                disabled={!selectedReturnItem}
                                className={`rounded px-3 py-1.5 text-xs ${
                                  selectedReturnItem
                                    ? "bg-[#252525] text-white dark:bg-gray-200 dark:text-gray-800"
                                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                                }`}
                              >
                                Add
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr className="w-full flex justify-center items-center">
                    <td className="text-xl mt-3">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Pagination
        currentPage={page}
        totalPages={suitStocks?.totalPages}
        totalRecords={suitStocks?.totalRecords}
        pageSize={limit}
      />
      {returnBundlesModal && returnBundles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-[90%] max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Return Bundles | Total Quantity:{" "}
                {returnBundles
                  .flat()
                  .reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
              </h2>
              <button
                onClick={() => setReturnBundlesModal(false)}
                className="text-lg font-bold text-gray-500 hover:text-red-600"
              >
                &times;
              </button>
            </div>
            {returnBundles.map((bundle, index) => (
              <div key={index} className="mb-6 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-100">
                    Bundle {index + 1} | Quantity:{" "}
                    {bundle.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                  </h3>
                  <button
                    onClick={() => handleRemoveReturnBundle(index)}
                    className="mb-2 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-red-500 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 14 14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="sr-only">Remove bundle</span>
                  </button>
                </div>

                <table className="w-full border text-left text-sm text-gray-600 dark:text-gray-200">
                  <thead className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                    <tr>
                      <th className="px-4 py-2">D No</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Color</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Cost Price</th>
                      <th className="px-4 py-2">Sale Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{item.d_no}</td>
                        <td className="px-4 py-2">{item.category}</td>
                        <td className="px-4 py-2">{item.color}</td>
                        <td className="px-4 py-2">{item.stitch_type}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{item.cost_price}</td>
                        <td className="px-4 py-2">{item.sale_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ---------- PENDING STOCK MODALS ------------ */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative scrollable-content py-4 px-3 w-[95%] max-w-6xl max-h-[85vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pending Stock
              </h3>
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

            {/* ------------- BODY ------------- */}
            {SuitLoading ? (
              <div className="pt-4 flex justify-center mt-12 items-center">
                <div
                  className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full "
                  role="status"
                  aria-label="loading"
                >
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="p-2 md:p-5">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">D # No</th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">Category</th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">Color</th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">Type</th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">Quantity</th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">Cost Price</th>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center text-xs md:text-sm">Sale Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStock?.length > 0 ? (
                      pendingStock.map((dataGroup, i) => (
                        <React.Fragment key={`group-${i}`}>
                          <tr className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white font-semibold">
                            <td colSpan={8} className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              Total Quantity: {getALLBundlesQuantity(dataGroup)?.allBundlesQuantitySum}  | Issue Date: {dataGroup.issueDate} | Status:{" "}
                              <span
                                className={`text-${setStatusColor(
                                  dataGroup.bundleStatus
                                )}`}
                              >
                                {dataGroup.bundleStatus}
                              </span>{" "}
                              {`| Note: ${dataGroup.note}`}
                              <span className="mx-10">
                                   <button
                                        onClick={() =>
                                          openConfirmationModal(dataGroup.id)
                                        }
                                        className="text-green-500 hover:bg-green-100 rounded-lg p-2"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => openRejectModal(dataGroup.id)}
                                        className="text-red-500 hover:bg-red-100 rounded-lg p-2 ml-2"
                                      >
                                        Reject
                                      </button>
                              </span>
                            
                            </td>
                          
                          </tr>

                          {dataGroup.bundles?.map(
                            (bundleArray, bundleIndex) => (
                              <React.Fragment
                                key={`bundle-${i}-${bundleIndex}`}
                              >
                                {/* Bundle Index Row */}
                                <tr className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white font-semibold">
                                  <td colSpan={8} className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">
                                    Bundle {bundleIndex + 1} | Quantity : ({getSingleBundlesQuantity(bundleArray)?.singleBundleQuantitySum})
                                  </td>
                                </tr>

                                {bundleArray.map((item, itemIndex) => (
                                  <tr
                                    key={`item-${i}-${bundleIndex}-${itemIndex}`}
                                    className="bg-white border-b text-md font-medium dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                  >
                                    <th
                                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm"
                                      scope="row"
                                    >
                                      {item.d_no}
                                    </th>
                                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                      {item.category}
                                    </td>
                                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{item.color}</td>
                                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{item.stitch_type}</td>
                                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                      {item.quantity}
                                    </td>
                                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                      {item.cost_price}
                                    </td>
                                    <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                      {item.sale_price}
                                    </td>
                                    
                                  </tr>
                                ))}
                              </React.Fragment>
                            )
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr className="w-full flex justify-center items-center">
                        <td className="text-xl mt-3">No Data Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      ;{/* ----------  APPROVE MODAL ------------ */}
      {confirmationModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-lg bg-white rounded-md shadow dark:bg-gray-700">
            <div className="flex items-center justify-center p-4 border-b dark:border-gray-600">
              <h3 className="text-xl font-semibold text-green-600 dark:text-white">
                ACCEPT STOCK
              </h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-center dark:text-gray-300">
                Are you sure you want to proceed with this? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-center p-2">
              {stockLoading ? (
                <button
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 cursor-not-allowed text-sm rounded bg-green-300 dark:bg-gray-200 text-white dark:text-gray-800"
                >
                  <ButtonSpinner />
                  Approve
                </button>
              ) : (
                <button
                  onClick={handleAccept}
                  className="px-4 py-2.5 text-sm rounded bg-green-600 dark:bg-gray-200 text-white dark:text-gray-800"
                >
                  Approve
                </button>
              )}
            </div>

            <div className="button_box absolute top-6 right-6">
              <button
                onClick={closeConfirmationModal}
                className="text-red-500 hover:bg-gray-200 hover:text-red-500 rounded-lg text-sm w-8 h-8 flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
          </div>
        </div>
      )}
      {/* ----------  REJECT MODAL ------------ */}
      {rejectModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-lg bg-white rounded-md shadow dark:bg-gray-700">
            <div className="flex items-center justify-center p-4 border-b dark:border-gray-600">
              <h3 className="text-xl font-semibold text-red-500 dark:text-white">
                REJECT STOCK
              </h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-center dark:text-gray-300">
                Are you sure you want to proceed with this? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-center p-2">
              {stockLoading ? (
                <button
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 cursor-not-allowed text-sm rounded bg-red-300 dark:bg-gray-200 text-white dark:text-gray-800"
                >
                  <ButtonSpinner />
                  Reject
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  className="px-4 py-2.5 text-sm rounded bg-red-500 dark:bg-gray-200 text-white dark:text-gray-800"
                >
                  Reject
                </button>
              )}
            </div>

            <div className="button_box absolute top-6 right-6">
              <button
                onClick={closeRejectModal}
                className="text-red-500 hover:bg-gray-200 hover:text-red-500 rounded-lg text-sm w-8 h-8 flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
          </div>
        </div>
      )}
    </>
  );
};

export default StockForBranch;
