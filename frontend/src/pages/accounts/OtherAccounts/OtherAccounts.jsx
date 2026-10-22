import { useCallback, useEffect, useState } from "react";
import { IoAdd } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import {
  createOtherAccountAsync,
  getAllOtherAccountsAsync,
} from "../../../features/OtherAccountsSlice";
import Pagination from "../../../Component/Common/Pagination";
import { getPageLimit } from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";
import ButtonSpinner from "../../../Component/Common/button/ButtonSpinner";

const OtherAccounts = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const { OtherAccounts, loading } = useSelector(
    (state) => state.OtherAccounts
  );
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
  });

  const getOtherAccounts = useCallback(() => {
    dispatch(getAllOtherAccountsAsync({ search, page, limit }));
  }, [dispatch, search, page, limit]);

  useEffect(() => {
    getOtherAccounts();
  }, [getOtherAccounts]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createOtherAccountAsync(formData)).then((res) => {
       if (res.payload.success === true) {
        closeModal();
        getOtherAccounts();
        setFormData("");
      }
    });
  };

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
    setFormData("");
  };



  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* HEADER */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Other Accounts
          </h1>

          {/* SEARCH BAR */}
          <div className="flex justify-between items-center gap-3">
            <div className="search_bar flex items-center gap-3 mr-2">
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
                  placeholder="Search by name"
                  value={search}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <button
              onClick={openModal}
              className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
            >
              <IoAdd size={22} className="text-white" />
            </button>
          </div>
        </div>

        {loading?.getAll ? (
          <PageLoader />
        ) : (
          <>
            <div className="relative overflow-x-auto mt-5">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      {" "}
                      Name
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Phone
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      City
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OtherAccounts?.data?.length > 0 ? (
                    OtherAccounts?.data?.map((account, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b text-md font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <th
                          className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          scope="row"
                        >
                          <p>{account.name}</p>
                        </th>

                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {account.phone}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                          {account.city}
                        </td>
                        <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                          <Link to={`/dashboard/other-accounts/${account.id}`}>
                            <FaEye size={20} className="cursor-pointer" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="w-full text-md font-semibold dark:text-white">
                      <td
                        colSpan={6}
                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-center text-xs md:text-sm"
                      >
                        No accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={OtherAccounts?.totalPages}
        totalRecords={OtherAccounts?.totalRecords}
        pageSize={limit}
      />

      {/* CREATE OTHER ACCOUNT */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Other Account Form
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
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* FIRST ROW */}
                <div className="mb-5 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {/* NAME */}
                  <div>
                    <input
                      type="text"
                      placeholder="Name"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* PHONE NUMBER */}
                  <div>
                    <input
                      type="number"
                      placeholder="Phone Number"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  {loading?.create ? (
                    <button
                      type="submit"
                      disabled
                      className="inline-flex items-center justify-center gap-2 cursor-not-allowed rounded border border-gray-400 bg-gray-400 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-400 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                    >
                      <ButtonSpinner />
                      Create Account
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-block rounded border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring active:text-indgrayigo-500"
                    >
                      Create Account
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OtherAccounts;
