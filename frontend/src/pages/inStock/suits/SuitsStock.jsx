import { useState, useEffect, useRef } from "react";
import { GetAllSuit, getPendingReturnedStockAsync } from "../../../features/InStockSlice";
import {
  clearValiDateSeller,
  validateOldSellerAsync,
} from "../../../features/SellerSlice";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FaBoxOpen, FaEye, FaHistory } from "react-icons/fa";
import { IoAdd } from "react-icons/io5";
import StockForBranch from "../../../Component/InStock/StockForBranch";
import BooleanIndicator from "../../../Component/Common/BooleanIndicator";
import Pagination from "../../../Component/Common/Pagination";
import {
  buildPaginationQuery,
  formatReadableDate,
  getPageLimit,
} from "../../../Utils/Common";
import AppSelect from "../../../Component/Common/select/AppSelect";
import SuitsModal from "../../bills/Modals/SuitsModal";
import PageLoader from "../../../Component/Loader/PageLoader";
import StockFilters from "../../../Component/Common/StockFilters";
const SuitsStock = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [searchUser, setSearchUser] = useState(false);
  const [sellerDetails, setSellerDetails] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [SuitId, setSuitId] = useState("");
  const [userSelectedCategory, setuserSelectedCategory] = useState("");
  const [search, setSearch] = useState();
  const [stitchType, setStitchType] = useState("");
  const searchTimeoutRef = useRef(null);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  const { Suit, GetSuitloading, pendingReturnedStockCount } = useSelector(
    (state) => state.InStock
  );
  const { searchLoading, validateSeller } = useSelector((state) => state.Seller);
  const { user } = useSelector((state) => state.auth);

  const [selectedSuits, setSelectedSuits] = useState([]);

  useEffect(() => {
    const storedSuits = JSON.parse(localStorage.getItem("selectedSuits")) || [];
    setSelectedSuits(storedSuits);
  }, []);

  const handleCheckboxChange = (suit) => {
    let updatedSelection;
    if (selectedSuits.some((item) => item._id === suit._id)) {
      updatedSelection = selectedSuits.filter((item) => item._id !== suit._id);
    } else {
      updatedSelection = [
        ...selectedSuits,
        { ...suit, assignQuantity: 0, all_records: null },
      ];
    }
    setSelectedSuits(updatedSelection);
    localStorage.setItem("selectedSuits", JSON.stringify(updatedSelection));
  };

  useEffect(() => {
    if (user?.user?.role === "superadmin") {
      dispatch(
        GetAllSuit({
          category: userSelectedCategory,
          search,
          stitch_type: stitchType,
          page,
          limit,
        })
      );
      dispatch(getPendingReturnedStockAsync());
    }
  }, [page, limit, dispatch, user]);

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    setSellerDetails("");
    dispatch(clearValiDateSeller());
    document.body.style.overflow = "auto";
    dispatch(
      GetAllSuit({
        category: userSelectedCategory,
        search,
        stitch_type: stitchType,
        page,
        limit,
      })
    );
  };

  const openSearchModal = () => {
    setSearchModal(true);
    document.body.style.overflow = "hidden";
  };

  const closeSearchModal = () => {
    setSearchModal(false);
    setSearchUser(false);
    dispatch(clearValiDateSeller());
    document.body.style.overflow = "auto";
  };

  const swapModal = () => {
    closeSearchModal();
    setSellerDetails("");
    openModal();
  };

  const handleOldSellerClick = () => {
    setSearchUser(true);
    dispatch(validateOldSellerAsync({ category: "Suits" }));
  };

  const handleChooseSeller = (selectedOption) => {
    if (selectedOption?.seller) {
      setSellerDetails(selectedOption.seller);
      closeSearchModal();
      openModal();
    }
  };

  const sellerOptions = (validateSeller?.oldSellerData || []).map((seller) => ({
    value: seller.id,
    label: seller.name,
    seller,
  }));

  const formatSellerOption = ({ seller }) => {
    const account = seller?.virtual_account || {};

    return (
      <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-[1.2fr_0.9fr]">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {seller?.name}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-300">
            {seller?.phone || "--"}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold sm:text-right">
          <span className="text-red-500">D {account.total_debit ?? 0}</span>
          <span className="text-gray-700 dark:text-gray-200">
            C {account.total_credit ?? 0}
          </span>
          <span className="text-green-600">B {account.total_balance ?? 0}</span>
        </div>
      </div>
    );
  };

  const openHistoryModal = (id) => {
    setHistoryModalOpen(true);
    setSuitId(id);
    document.body.style.overflow = "hidden";
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
    document.body.style.overflow = "auto";
  };


  useEffect(() => {
    return () => clearTimeout(searchTimeoutRef.current);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const payload = {
        category: userSelectedCategory,
        page: 1,
        limit,
        search: value || undefined,
        stitch_type: stitchType,
      };

      dispatch(GetAllSuit(payload));
      navigate(`${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`);
    }, 500);
  };

  const handleCategoryClick = (category) => {
    const selectedCategory = category === "all" ? "" : category;
    setuserSelectedCategory(selectedCategory);

    // check
    if (category === "all") {
      dispatch(GetAllSuit({ search, stitch_type: stitchType, page: 1, limit }));
    } else if (search) {
      dispatch(
        GetAllSuit({ category, search, stitch_type: stitchType, page: 1, limit })
      );
    } else {
      dispatch(GetAllSuit({ category, stitch_type: stitchType, page: 1, limit }));
    }
  };

  const handleStitchTypeChange = (value) => {
    setStitchType(value);
    dispatch(
      GetAllSuit({
        category: userSelectedCategory,
        search,
        stitch_type: value,
        page: 1,
        limit,
      })
    );
    navigate(`${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const dataForHistoryModal = Suit?.data?.filter((item) => item._id === SuitId);
  const filteredSuitData = dataForHistoryModal?.flatMap((record) => {
    return record.all_records;
  });

  if (user?.user?.role !== "superadmin") {
    return <StockForBranch />;
  }

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Suits
          </h1>

          {/* <!-- search bar --> */}
          <div className="search_bar mr-2 flex justify-center items-center gap-x-3">
            {(user?.user?.role === "superadmin" ||
              user?.user?.role === "admin") && (
              <button
                onClick={openSearchModal}
                className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
              >
                <IoAdd size={22} className="text-white" />
              </button>
            )}
            {user?.user?.role === "superadmin" && (
              <>
              <Link
                to={
                  pendingReturnedStockCount > 0
                    ? "/dashboard/AssignedStockHistory?transferType=RETURN_TO_MAIN&bundleStatus=Pending"
                    : "/dashboard/AssignedStockHistory"
                }
                className="relative inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
                title="Branch Stock Records"
              >
                <FaHistory size={22} className="text-white" />
                {pendingReturnedStockCount > 0 && (
                  <span className="absolute top-[-9px] right-[-9px] inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-semibold text-white animate-blink">
                    {pendingReturnedStockCount}
                  </span>
                )}
              </Link>
         
              <Link
                to={"/dashboard/assignstocks"}
                className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
                title="Send Stock To Branch"
              >
                <FaBoxOpen size={22} className="text-white" />
              </Link>
              </>
            )}
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

        {/* -------------- FILTERS -------------- */}
        <StockFilters
          categories={Suit?.category_data}
          total={Suit?.total_stock}
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
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-3 text-xs md:text-sm">CheckBox</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    D # No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Category
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Colors
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Type
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    SKU
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Quantity
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Cost Prices
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Sales Prices
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm" scope="col">
                    History
                  </th>
                </tr>
              </thead>
              <tbody>
                {Suit && Suit?.data?.length > 0 ? (
                  Suit?.data?.map((data, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                        {data.quantity > 0 && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-gray-700 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                            checked={selectedSuits.some(
                              (selected) => selected?._id === data?._id
                            )}
                            onChange={() => handleCheckboxChange(data)}
                          />
                        )}
                      </td>
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                        {data.d_no}
                      </th>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.category}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.color}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.stitch_type}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sku}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        {data.quantity}/T-{data.TotalQuantity}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.cost_price}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sale_price}</td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <span onClick={() => openHistoryModal(data?._id)}>
                          <FaEye size={20} className="cursor-pointer" />
                        </span>
                      </td>
                    </tr>
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
      </section>

      <Pagination
        currentPage={page}
        totalPages={Suit?.totalPages}
        totalRecords={Suit?.totalRecords}
        pageSize={limit}
      />

      {searchModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-8 px-4 w-[95%] max-w-3xl max-h-[88vh] bg-white rounded-md shadow dark:bg-gray-700 overflow-visible">
            <div className="flex items-center justify-between flex-col p-3 rounded-t dark:border-gray-600">
              <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
                Generate Seller
              </h3>
            </div>

            <div className="p-3">
              <div className="flex justify-center items-center gap-x-4">
                <button
                  onClick={swapModal}
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                >
                  New Seller
                </button>
                <button
                  onClick={handleOldSellerClick}
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                >
                  Old Seller
                </button>
              </div>

              {searchUser && (
                <div className="search_user border-t pt-6 mt-6">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Select Existing Seller
                    </p>
                  </div>

                  {searchLoading ? (
                    <div className="py-6 flex justify-center items-center">
                      <div
                        className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full "
                        role="status"
                        aria-label="loading"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <AppSelect
                      className="w-full"
                      options={sellerOptions}
                      placeholder="Choose seller"
                      formatOptionLabel={formatSellerOption}
                      noOptionsMessage={() => "No sellers found for suits"}
                      menuPortalTarget={null}
                      menuPosition="absolute"
                      maxMenuHeight={280}
                      onChange={handleChooseSeller}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="button absolute top-3 right-3">
              <button
                onClick={closeSearchModal}
                className="end-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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

      <SuitsModal
        isOpen={isOpen}
        closeModal={closeModal}
        sellerDetails={sellerDetails}
      />



      {/* ---------- HISTORY MODAL ------------ */}
      {historyModalOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-7xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Suit History
              </h3>
              <button
                onClick={closeHistoryModal}
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
              <div className="scrollable-content h-[50vh] overflow-auto">
                <table className="w-full table-fixed text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[10%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-center" scope="col">
                        Date
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Cost Price
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Sale Price
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Quantity
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Manual No
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Serial No
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Bags
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Pictures
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuitData && filteredSuitData.length > 0 ? (
                      filteredSuitData
                        ?.slice()
                        .reverse()
                        .map((data, index) => (
                          <tr
                            key={index}
                            className="bg-white border-b text-sm font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <td className="px-3 py-3 text-center" scope="row">
                              {formatReadableDate(data?.date)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {data?.cost_price}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {data?.sale_price}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {data?.quantity}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {data?.Manual_No ?? "-"}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {data?.serial_No ?? "-"}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <BooleanIndicator value={data?.bags_used} />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <BooleanIndicator
                                value={data?.includes_pictures}
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              {data?.is_stock_source_packing
                                ? "Process"
                                : data?.branch_stock_history_id
                                  ? "Branch Return"
                                  : "Manual"}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr className="bg-white dark:bg-gray-800">
                        <td
                          colSpan={9}
                          className="px-3 py-8 text-center text-xl text-gray-500 dark:text-gray-300"
                        >
                          No Data Available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default SuitsStock;
