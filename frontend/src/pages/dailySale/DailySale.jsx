import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { getDailySaleAsync } from "../../features/DailySaleSlice";
import Pagination from "../../Component/Common/Pagination";
import { buildPaginationQuery, formatReadableDate, getPageLimit } from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";

const DailySale = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [messageId, setMessageId] = useState();
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState();

  const { user } = useSelector((state) => state.auth);
  const { loading: branchesLoading, Branches } = useSelector(
    (state) => state.InStock
  );
  const { loading, DailySaleHistory } = useSelector((state) => state.DailySale);

  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  const filteredData = searchText
    ? DailySaleHistory?.dailySaleHistory?.filter((item) =>
        item.partyName.toLowerCase().includes(searchText.toLowerCase())
      )
    : DailySaleHistory?.dailySaleHistory;

  useEffect(() => {
    if (Branches.length > 0) {
      const payload = {
        date: searchDate || null,
        id: selectedBranchId
          ? selectedBranchId
          : user?.user?.branchId || Branches[0].id,
        page,
        limit,
      };

      dispatch(getDailySaleAsync(payload));

      setSelectedBranchId(
        selectedBranchId
          ? selectedBranchId
          : user?.user?.branchId || Branches[0].id
      );
    }
  }, [dispatch, user, Branches, page, limit]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const handlePaginationClick = (i) => {
    setSearchDate("");

    const payload = {
      date: searchDate || null,
      id: selectedBranchId,
      page: i,
      limit,
    };

    dispatch(getDailySaleAsync(payload));
  };


  const handleBranchClick = (branchId) => {
    const selectedBranch = branchId === "all" ? "" : branchId;
    setSelectedBranchId(selectedBranch);
    setSearchDate("");
    dispatch(getDailySaleAsync({ id: branchId, page: 1, limit }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setSearchDate(e.target.value);

    const payload = {
      page: 1,
      limit,
      date: value,
      id: selectedBranchId,
    };

    dispatch(getDailySaleAsync(payload));
    navigate(`/dashboard/dailySale${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const getBranchNameById = useCallback(
    (branchId) => {
      const branch = Branches.find((branch) => branch.id === branchId);
      return branch ? branch.branchName : "Unknown Branch";
    },
    [Branches]
  );

  const filteredMsgData = DailySaleHistory?.dailySaleHistory?.find(
    (data) => data?.id === messageId
  );

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Daily Sale
          </h1>

          {/* <!-- search bar --> */}
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
                type="date"
                className="md:w-64 lg:w-72 py-2 pl-10 pr-4 text-gray-800 dark:text-gray-200 bg-transparent border border-[#D9D9D9] rounded-lg focus:border-[#D9D9D9] focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-[#D9D9D9] placeholder:text-sm dark:placeholder:text-gray-300"
                placeholder="Search by date"
                value={searchDate}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {/* -------------- TABS -------------- */}
        <div className="tabs flex justify-between items-center my-5">
          <div className="tabs_button flex flex-wrap gap-1">
            {/* CHECK ONLY SUPERADMIN CAN SEE ALL */}
            {user?.user?.role === "superadmin" ? (
              <>
                {Branches?.map((branch) => (
                  <Link
                    to={`/dashboard/dailySale${buildPaginationQuery(searchParams, { page: 1, limit })}`}
                    key={branch?.id}
                    className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md ${
                      selectedBranchId === branch?.id
                        ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                        : ""
                    }`}
                    onClick={() => handleBranchClick(branch?.id)}
                  >
                    {branch?.branchName}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {/* THIS SHOWS TO ADMIN & USER */}
                {Branches?.map((branch) => (
                  <button
                    className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md cursor-default ${
                      user?.user?.branchId === branch?.id
                        ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                        : ""
                    }`}
                  >
                    {branch?.branchName}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* -------------- TABLE -------------- */}

        {loading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5 ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Branch Name
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Total Sale
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Total Expense
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Total Profit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.length > 0 ? (
                  filteredData?.map((expense, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {getBranchNameById(expense?.branchId)}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        {expense?.saleData?.totalSale}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        {expense?.saleData?.totalExpense}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        {expense?.saleData?.totalProfit}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        {formatReadableDate(expense.date)}
                      </td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <Link
                          to={`/dashboard/dailySale-details/${expense?.id}`}
                        >
                          <FaEye size={20} className="cursor-pointer" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-2 md:px-6 md:py-4 text-lg md:text-xl text-start">
                      No Data available
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
        totalPages={DailySaleHistory?.totalPages}
        totalRecords={DailySaleHistory?.totalRecords}
        pageSize={limit}
      />

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Expense Details
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
            <div className="p-4 md:p-5">
              <p className="text-gray-900 dark:text-white">
                {filteredMsgData?.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailySale;
