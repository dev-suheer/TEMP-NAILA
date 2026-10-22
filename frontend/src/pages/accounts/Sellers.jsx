import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { validateOldBuyerAsync } from "../../features/GenerateBillSlice";
import { getAllSellerForPurchasingAsync } from "../../features/SellerSlice";
import BillFilters, {
  emptyBillFilters,
} from "../../Component/BillFilters/BillFilters";
import Pagination from "../../Component/Common/Pagination";
import StatusChip from "../../Component/Common/StatusChip";
import {
  accountStatusOptions,
  buildPaginationQuery,
  getPageLimit,
} from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";

const sellerCategories = ["Base", "Lace", "Bag/box", "Accessories", "Suits"];

const initialSellerFilters = {
  ...emptyBillFilters,
  status: "",
};

const PhoneComponent = ({ phone }) => {
  const maskPhoneNumber = (phone) => {
    if (phone.length > 3) {
      return phone.slice(0, 3) + "*******".slice(0, phone.length - 3);
    } else {
      return phone;
    }
  };

  return <p>{maskPhoneNumber(phone)}</p>;
};

const Sellers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [searchUser, setSearchUser] = useState(false);
  const [filters, setFilters] = useState(initialSellerFilters);

  const [validateOldBuyer, setValidateOldBuyer] = useState("");

  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  const { loading, AllSeller } = useSelector((state) => state.Seller);

  const [selectedCategory, setSelectedCategory] = useState("Base");

  useEffect(() => {
    const payload = {
      category: selectedCategory,
      page,
      limit,
      name: filters.name || undefined,
      status: filters.status || undefined,
    };
    dispatch(getAllSellerForPurchasingAsync(payload));
  }, [dispatch, page, limit]);

  const closeModal = () => {
    setIsOpen(false);
    setSearchUser(!searchUser);
    setValidateOldBuyer("");
    document.body.style.overflow = "auto";
  };



  const handleValidateOldBuyer = (e) => {
    const value = e.target.value;
    setValidateOldBuyer(value);

    if (value.length > 0) {
      const timer = setTimeout(() => {
        dispatch(validateOldBuyerAsync({ name: value }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  };

  const handleCategoryFilterChange = (category) => {
    const nextCategory = category || "Base";
    setSelectedCategory(nextCategory);
    setFilters(initialSellerFilters);
    const payload = {
      category: nextCategory,
      page: 1,
      limit,
      status: initialSellerFilters.status,
    };
    dispatch(getAllSellerForPurchasingAsync(payload));
    navigate(`/dashboard/sellers${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleFiltersSearch = () => {
    const payload = {
      page: 1,
      limit,
      category: selectedCategory,
      name: filters.name || undefined,
      status: filters.status || undefined,
    };

    dispatch(getAllSellerForPurchasingAsync(payload)).then(() => {
      navigate(`/dashboard/sellers${buildPaginationQuery(searchParams, { page: payload.page, limit })}`);
    });
  };

  const handleFiltersChange = (nextFilters) => {
    const statusChanged = nextFilters.status !== filters.status;
    const updatedFilters = statusChanged
      ? { ...nextFilters, name: "" }
      : nextFilters;

    setFilters(updatedFilters);

    if (statusChanged) {
      const payload = {
        page: 1,
        limit,
        category: selectedCategory,
        status: updatedFilters.status || undefined,
      };

      dispatch(getAllSellerForPurchasingAsync(payload)).then(() => {
        navigate(`/dashboard/sellers${buildPaginationQuery(searchParams, { page: payload.page, limit })}`);
      });
    }
  };

  const handleResetFilters = () => {
    setFilters(initialSellerFilters);
    const payload = {
      page: 1,
      limit,
      category: selectedCategory,
      status: initialSellerFilters.status,
    };

    dispatch(getAllSellerForPurchasingAsync(payload)).then(() => {
      navigate(`/dashboard/sellers${buildPaginationQuery(searchParams, { page: payload.page, limit })}`);
    });
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Sellers
          </h1>

          {/* <!-- search bar --> */}
          <BillFilters
            filters={filters}
            nameOptions={(AllSeller?.sellerNames || []).map((name) => ({
              value: name,
              label: name,
            }))}
            categoryOptions={sellerCategories.map((category) => ({
              value: category,
              label: category,
            }))}
            selectedCategory={selectedCategory}
            statusOptions={accountStatusOptions}
            showCategoryFilter={true}
            showStatusFilter={true}
            showDateFilters={false}
            namePlaceholder="Seller"
            onChange={handleFiltersChange}
            onCategoryChange={handleCategoryFilterChange}
            onSearch={handleFiltersSearch}
            onReset={handleResetFilters}
          />
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {/* -------------- TABLE -------------- */}
        {loading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5 ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Party Name
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Bill No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Credit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Debit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Balance
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {AllSeller && AllSeller?.sellers?.length > 0 ? (
                  AllSeller?.sellers?.map((data, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b text-md font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <th
                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        scope="row"
                      >
                        <p>{data.name}</p>
                        <PhoneComponent phone={data.phone} />
                      </th>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">{data.bill_no}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {data.virtual_account.total_credit === null
                          ? "0"
                          : data.virtual_account.total_credit + " Rs"}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {data.virtual_account.total_debit === null
                          ? "0"
                          : data.virtual_account.total_debit + " Rs"}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {data.virtual_account.total_balance === null
                          ? "0"
                          : data.virtual_account.total_balance + " Rs"}
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        <StatusChip status={data.virtual_account.status} fallback="" />
                      </td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <Link
                          onClick={() => window.scrollTo(0, 0)}
                          to={`/dashboard/sellers-details/${data.id}`}
                        >
                          <FaEye size={20} className="cursor-pointer" />
                        </Link>
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
        totalPages={AllSeller?.totalPages}
        totalRecords={AllSeller?.totalRecords ?? AllSeller?.totalSellers}
        pageSize={limit}
      />

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-8 px-3 w-[95%] max-w-2xl max-h-[90vh] bg-white rounded-md shadow dark:bg-gray-700 overflow-y-auto">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between flex-col p-3 rounded-t dark:border-gray-600">
              <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
                Generate Bill
              </h3>
            </div>

            {/* ------------- BODY ------------- */}
            <div className="p-3">
              <div className="flex justify-center items-center gap-x-4">
                <Link
                  to="/dashboard/generate-bill"
                  onClick={closeModal}
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                >
                  New Buyer
                </Link>
                <button
                  onClick={() => setSearchUser(!searchUser)}
                  className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                >
                  Old Buyer
                </button>
              </div>

              {searchUser && (
                <div className="search_user border-t flex justify-center flex-col pt-6 mt-6">
                  <input
                    type="text"
                    className="w-full py-2 pl-6 pr-4 text-gray-800 dark:text-gray-200 bg-transparent border border-[#D9D9D9] rounded-lg focus:border-[#D9D9D9] focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-[#D9D9D9] placeholder:text-sm dark:placeholder:text-gray-300"
                    placeholder="Search by name"
                    value={validateOldBuyer}
                    onChange={handleValidateOldBuyer}
                  />

                  {/* Displaying names below the input */}
                  {getBuyerLoading ? (
                    <>
                      <div className="py-6 flex justify-center items-center">
                        <div
                          className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full "
                          role="status"
                          aria-label="loading"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {validateOldBuyer.length > 0 &&
                      OldBuyerData &&
                      OldBuyerData.oldBuyerData &&
                      OldBuyerData.oldBuyerData.length > 0 ? (
                        <ul className="mt-4 max-h-60 overflow-y-auto border rounded-lg">
                          {OldBuyerData.oldBuyerData.map((buyer) => (
                            <li key={buyer.id}>
                              <Link
                                to={`/dashboard/old-buyer-generate-bill/${buyer.id}`}
                                onClick={closeModal}
                                className="py-2 px-4 border-b rounded hover:bg-gray-100 w-full flex justify-between"
                              >
                                <span>{buyer.name}</span>
                                <span>{buyer.phone}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-gray-600 pl-4">
                          No matching buyers found.
                        </p>
                      )}
                    </>
                  )}

                  <Link
                    to=""
                    onClick={closeModal}
                    className="inline-block mt-4 w-40 mx-auto rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                  >
                    Create Bill
                  </Link>
                </div>
              )}
            </div>

            <div className="button absolute top-3 right-3">
              <button
                onClick={closeModal}
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
    </>
  );
};

export default Sellers;
