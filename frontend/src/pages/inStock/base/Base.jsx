import { useState, useEffect, useMemo } from "react";
import { IoAdd } from "react-icons/io5";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  DeleteBaseStockAsync,
  GetAllBase,
  GetAllCategoriesForBase,
} from "../../../features/InStockSlice";
import { useDispatch, useSelector } from "react-redux";
import { FaEye } from "react-icons/fa";
import AddBaseModal from "./AddBaseModal";
import { MdDeleteOutline } from "react-icons/md";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import Pagination from "../../../Component/Common/Pagination";
import { buildPaginationQuery, formatReadableDate, getPageLimit } from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";

const Base = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, Base, deleteLodaing } = useSelector(
    (state) => state.InStock
  );
  const { user } = useSelector((state) => state.auth);
  const { BaseCategories } = useSelector((state) => state.InStock);

  const [isOpen, setIsOpen] = useState(false);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [showConfirmationModal, setConfirmationModal] = useState();
  const [onConfitmation, setOnConfirmation] = useState(null);
  const [baseId, setBaseId] = useState();
  const [userSelectedCategory, setuserSelectedCategory] = useState("");
  // const [filteredData, setFilteredData] = useState(Base);
  const [search, setSearch] = useState("");

  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  useEffect(() => {
    dispatch(GetAllBase({ category: userSelectedCategory, search, page, limit }));
    dispatch(GetAllCategoriesForBase());
  }, [page, limit, dispatch]);

  const addBaseModal = () => {
    setIsBaseModalOpen(true);
  };

  const closeBaseModal = () => {
    setIsBaseModalOpen(false);
  };

  const openModal = (id) => {
    setIsOpen(true);
    setBaseId(id);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    setConfirmationModal(false);
    setOnConfirmation(false);
    document.body.style.overflow = "auto";
  };


  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (value === "") {
      dispatch(GetAllBase({ category: userSelectedCategory, page, limit }));
    } else {
      dispatch(
        GetAllBase({ category: userSelectedCategory, search: value, page: 1, limit })
      );
    }
    navigate(`${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleCategoryClick = (category) => {
    const selectedCategory = category === "all" ? "" : category;
    setuserSelectedCategory(selectedCategory);

    // check
    if (category === "all") {
      dispatch(GetAllBase({ search, page: 1, limit }));
    } else if (search) {
      dispatch(GetAllBase({ category, search, page: 1, limit }));
    } else {
      dispatch(GetAllBase({ category, page: 1, limit }));
    }
  };

  const filteredBaseData = useMemo(
    () => Base?.data?.filter((data) => data.id === baseId),
    [Base, baseId]
  );

  const handleDelete = (id) => {
    const payload = {
      baseId,
      itemId: id,
    };
    setConfirmationModal(true);
    document.body.style.overflow = "hidden";

    const deleteBill = () => {
      dispatch(DeleteBaseStockAsync(payload)).then((res) => {
        if (res.payload.success) {
          dispatch(
            GetAllBase({ category: userSelectedCategory, search, page, limit })
          );
          closeModal();
        }
      });
    };
    setOnConfirmation(() => deleteBill);
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Base
          </h1>

          {/* <!-- search bar --> */}
          <div className="search_bar mr-2 flex items-center gap-x-3">
            {(user?.user?.role === "superadmin" ||
              user?.user?.role === "admin") && (
              <button
                onClick={addBaseModal}
                className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
              >
                <IoAdd size={22} className="text-white" />
              </button>
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
                placeholder="Search by Color"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {/* -------------- TABS -------------- */}
        <div className="tabs flex justify-between items-center my-5">
          <div className="tabs_button flex flex-wrap gap-1">
            <Link
              to={`/dashboard/base${buildPaginationQuery(searchParams, { page: 1, limit })}`}
              className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md ${
                userSelectedCategory === ""
                  ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                  : ""
              }`}
              onClick={() => handleCategoryClick("all")}
            >
              All
            </Link>
            {BaseCategories?.map((category) => (
              <Link
                key={category}
                className={`border border-gray-500 dark:bg-gray-700 text-black dark:text-gray-100 px-5 py-2 mx-2 text-sm rounded-md ${
                  userSelectedCategory === category
                    ? "bg-[#252525] text-white dark:bg-white dark:text-black"
                    : ""
                }`}
                onClick={() => handleCategoryClick(category)}
                to={`/dashboard/base${buildPaginationQuery(searchParams, { page: 1, limit })}`}
              >
                {category}
              </Link>
            ))}
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
                    Category
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Colors
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    T. m
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    R. Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Recently
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm" scope="col">
                    History
                  </th>
                </tr>
              </thead>
              <tbody>
                {Base && Base?.data?.length > 0 ? (
                  Base?.data?.map((data, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                        {data?.category}
                      </th>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.colors}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.TYm} m</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        {formatReadableDate(data.r_Date)}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.recently} m</td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <span onClick={() => openModal(data?.id)}>
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
        totalPages={Base?.totalPages}
        totalRecords={Base?.totalRecords}
        pageSize={limit}
      />

      {isBaseModalOpen === true && (
        <AddBaseModal
          addBaseModal={addBaseModal}
          closeBaseModal={closeBaseModal}
        />
      )}

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-4xl max-h-[80vh] scrollable-content bg-white rounded-md shadow dark:bg-gray-700 overflow-y-auto">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Base History
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
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Category
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Color
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Date
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Quantity
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBaseData && filteredBaseData.length > 0 ? (
                    filteredBaseData?.map((item, index) =>
                      item?.all_Records
                        ?.slice()
                        ?.reverse()
                        ?.map((data, subIndex) => (
                          <tr
                            key={`${index}-${subIndex}`}
                            className={`bg-white text-black border-b text-sm font-medium`}
                          >
                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                              {data?.category}
                            </th>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data?.colors}</td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              {formatReadableDate(data?.Date)}
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data?.quantity} m</td>

                             {data?.isDirectEntry && <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                <MdDeleteOutline
                                  onClick={() => handleDelete(data.id)}
                                  size={24}
                                  className="cursor-pointer text-red-500"
                                />
                              </td> }
                            
                          </tr>
                        ))
                    )
                  ) : (
                    <tr className="w-full flex justify-center items-center">
                      <td className="text-xl mt-3">No Data Available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRMATION MODAL */}
      {showConfirmationModal && (
        <ConfirmationModal
          onClose={closeModal}
          onConfirm={onConfitmation}
          message={
            "Are you sure you want to Delete this?"
          }
          title={"Delete Base Bill"}
          updateStitchingLoading={deleteLodaing}
        />
      )}
    </>
  );
};

export default Base;
