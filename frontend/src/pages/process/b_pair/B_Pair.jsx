import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getbPairDataAsync } from "../../../features/B_pairSlice";
import BPairHistoryModal from "./BPairHistoryModal";
import Pagination from "../../../Component/Common/Pagination";
import {
  buildPaginationQuery,
  getPageLimit,
} from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";
import StockFilters from "../../../Component/Common/StockFilters";

const B_Pair = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { B_pairDataLoading, B_pairData } = useSelector(
    (state) => state.B_Pair
  );

  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [stitchType, setStitchType] = useState("");
  const [historyId, setHistoryId] = useState("");
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || 1, 10);
  const limit = getPageLimit(searchParams);

  const fetchBPairs = (data = {}) => {
    dispatch(
      getbPairDataAsync({
        category: selectedCategory,
        search,
        stitch_type: stitchType,
        page,
        limit,
        ...data,
      })
    );
  };

  useEffect(() => {
    fetchBPairs();
  }, [dispatch, page, limit]);

  const goToFirstPage = () => {
    navigate(
      `${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`
    );
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchBPairs({ search: value || undefined, page: 1 });
    goToFirstPage();
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchBPairs({ category, page: 1 });
    goToFirstPage();
  };

  const handleStitchTypeChange = (value) => {
    setStitchType(value);
    fetchBPairs({ stitch_type: value, page: 1 });
    goToFirstPage();
  };

  const historyData = B_pairData?.data?.find((item) => item.id === historyId);

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            B Pair
          </h1>

          <div className="flex flex-wrap items-center gap-3 mr-2">
            {/* <!-- search bar --> */}
            <div className="search_bar">
              <div className="relative">
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

            <button
              type="button"
              onClick={() => navigate("/dashboard/bpair-bill")}
              className="rounded-md bg-[#252525] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
            >
              Generate Bill
            </button>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {/* -------------- FILTERS -------------- */}
        <StockFilters
          categories={B_pairData?.category_data}
          total={B_pairData?.total_stock}
          category={selectedCategory}
          onCategoryChange={handleCategoryClick}
          stitchType={stitchType}
          onStitchTypeChange={handleStitchTypeChange}
        />

        {/* -------------- TABLE -------------- */}
        {B_pairDataLoading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5 ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    D # No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Category
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Color
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Type
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    SKU
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Available
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Sold
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Sale Price
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    History
                  </th>
                </tr>
              </thead>
              <tbody>
                {B_pairData?.data?.length > 0 ? (
                  B_pairData.data.map((data) => (
                    <tr
                      key={data.id}
                      className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                        {data.d_no}
                      </th>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.category}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.color}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.stitch_type}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sku}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.quantity}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sold_quantity}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.sale_price}</td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <span onClick={() => setHistoryId(data.id)}>
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
        totalPages={B_pairData?.totalPages}
        totalRecords={B_pairData?.totalRecords}
        pageSize={limit}
      />

      {historyData && (
        <BPairHistoryModal
          data={historyData}
          closeModal={() => setHistoryId("")}
        />
      )}
    </>
  );
};

export default B_Pair;
