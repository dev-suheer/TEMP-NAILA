import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deletePackingAsync,
  getAllPackingsAsync,
} from "../../../features/PackingSlice";
import Pagination from "../../../Component/Common/Pagination";
import DeleteModal from "../../../Component/Modal/DeleteModal";
import PageLoader from "../../../Component/Loader/PageLoader";
import Icon from "../../../Component/Common/Icons";
import {
  buildPaginationQuery,
  formatAmount,
  formatReadableDate,
  getPageLimit,
} from "../../../Utils/Common";
import PackingViewModal from "./components/PackingViewModal";
import PackingSourceLink from "./components/PackingSourceLink";
import { getPackingSourceLabel } from "./packingUtils";

const cellClass = "px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm";
const headClass = "px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm";

const Packings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || 1, 10);
  const limit = getPageLimit(searchParams);
  const embroideryId = searchParams.get("embroidery_Id") || "";

  const { Packings, packingsLoading, deletePackingLoading } = useSelector(
    (state) => state.Packing
  );
  const [search, setSearch] = useState("");
  const [viewPacking, setViewPacking] = useState(null);
  const [packingToDelete, setPackingToDelete] = useState(null);

  const fetchPackings = (data = {}) => {
    dispatch(
      getAllPackingsAsync({
        page,
        limit,
        search,
        embroidery_Id: embroideryId,
        ...data,
      })
    );
  };

  useEffect(() => {
    fetchPackings();
  }, [dispatch, page, limit, embroideryId]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchPackings({ search: value, page: 1 });
    navigate(
      `${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`
    );
  };

  const clearOrderFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("embroidery_Id");
    params.set("page", 1);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleDelete = () => {
    dispatch(deletePackingAsync({ id: packingToDelete.id })).then((res) => {
      if (res.payload?.success) {
        setPackingToDelete(null);
        fetchPackings();
      }
    });
  };

  const packings = Packings?.data || [];

  const deleteMessage = (packing) =>
    `This permanently removes packing ${getPackingSourceLabel(packing)}: ${
      packing.total_main
    } main stock and ${packing.total_b_pair} B-Pair suits${
      packing.total_penalty > 0
        ? `, and reverses ${formatAmount(packing.total_penalty)} penalties from the party accounts`
        : ""
    }. These ${packing.total_received} suits become available to pack again.`;

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Packings
          </h1>

          <div className="search_bar mr-2">
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
                placeholder="Search by Design, Serial or Manual No"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {embroideryId && (
          <div className="mx-2 mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span>Showing packings of</span>
            <span className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1 font-medium dark:border-gray-600 dark:bg-gray-800">
              {packings[0]
                ? `Order S.N ${packings[0].serial_No} · D# ${packings[0].design_no}`
                : "the selected order"}
              <button
                type="button"
                aria-label="Show all packings"
                onClick={clearOrderFilter}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* -------------- TABLE -------------- */}
        {packingsLoading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className={headClass}>Date</th>
                  <th className={headClass}>S.N / M.N</th>
                  <th className={headClass}>Design No</th>
                  <th className={headClass}>Packed From</th>
                  <th className={headClass}>Main</th>
                  <th className={headClass}>B-Pair</th>
                  <th className={headClass}>Penalty</th>
                  <th className={headClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packings.length > 0 ? (
                  packings.map((packing) => (
                    <tr
                      key={packing.id}
                      className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <td className={`${cellClass} whitespace-nowrap`}>
                        {formatReadableDate(packing.createdAt)}
                      </td>
                      <td className={cellClass}>
                        {packing.serial_No} / {packing.Manual_No}
                      </td>
                      <td className={cellClass}>{packing.design_no}</td>
                      <td className={`${cellClass} whitespace-nowrap`}>
                        <PackingSourceLink packing={packing} />
                      </td>
                      <td className={cellClass}>{packing.total_main}</td>
                      <td className={cellClass}>{packing.total_b_pair}</td>
                      <td className={`${cellClass} whitespace-nowrap`}>
                        {packing.total_penalty > 0
                          ? formatAmount(packing.total_penalty)
                          : "--"}
                      </td>
                      <td className={cellClass}>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label="View packing"
                            onClick={() => setViewPacking(packing)}
                          >
                            <FaEye size={20} className="cursor-pointer" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete packing"
                            onClick={() => setPackingToDelete(packing)}
                          >
                            <Icon name="delete" className="cursor-pointer" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white dark:bg-gray-800">
                    <td colSpan={8} className="py-8 text-center text-xl text-gray-500 dark:text-gray-300">
                      No Data Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={Packings?.totalPages}
        totalRecords={Packings?.totalRecords}
        pageSize={limit}
      />

      {viewPacking && (
        <PackingViewModal packing={viewPacking} onClose={() => setViewPacking(null)} />
      )}

      {packingToDelete && (
        <DeleteModal
          title={"Delete Packing"}
          message={deleteMessage(packingToDelete)}
          onClose={() => setPackingToDelete(null)}
          Loading={deletePackingLoading}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default Packings;
