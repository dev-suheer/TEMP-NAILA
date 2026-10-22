import { useEffect, useState } from 'react'
import { Link, useSearchParams } from "react-router-dom";
import { GetAllaccessories } from '../../../features/InStockSlice';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import UsedAccessoriesModal from './UsedAccessoriesModal';
import Pagination from "../../../Component/Common/Pagination";
import { formatReadableDate, getPageLimit } from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";


const Accessories = () => {
    const dispatch = useDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [accessoriesModal, setAccessoriesModal] = useState();
    const [selectedUsedAccessories, setSelectedUsedAccessories] = useState();

    const [selectedTab, setSelectedTab] = useState("all_Records");
    const [accessoriesId, setAccessoriesId] = useState();
    const [search, setSearch] = useState();
    const { loading, accessories } = useSelector((state) => state.InStock);

    const [searchParams] = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

    useEffect(() => {
        dispatch(GetAllaccessories({ search, page, limit }))
    }, [search, page, limit, dispatch]);


    const openModal = (id) => {
        setIsOpen(true);
        setAccessoriesId(id);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsOpen(false);
        document.body.style.overflow = 'auto';
    };

    const openAccessoriesModal = (id) => {
        setAccessoriesModal(true);
        setSelectedUsedAccessories(id);
        document.body.style.overflow = 'hidden';
    };

    const closeAccessoriesModal = () => {
        setAccessoriesModal(false);
        document.body.style.overflow = 'auto';
    };

    const filteredData = accessories?.data?.filter((data) => data.id === accessoriesId);


    const handleSearch = (e) => {
        setSearch(e.target.value);
    }


    const handleTabClick = (tab) => {
        setSelectedTab(tab);
    };


    return (
        <>
            <section className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg'>
                {/* -------------- HEADER -------------- */}
                <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
                    <h1 className='text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium'>Accessories</h1>

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
                                type="text"
                                className="md:w-64 lg:w-72 py-2 pl-10 pr-4 text-gray-800 dark:text-gray-200 bg-transparent border border-[#D9D9D9] rounded-lg focus:border-[#D9D9D9] focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-[#D9D9D9] placeholder:text-sm dark:placeholder:text-gray-300"
                                placeholder="Search by Name"
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                </div>



                <p className='w-full bg-gray-300 h-px mt-5'></p>

                {/* -------------- TABLE -------------- */}
                {loading ? (
                    <PageLoader />
                ) : (
                    <div className="relative overflow-x-auto mt-7 ">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                <tr>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Serial No
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Name
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Total Quantity
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        R. Date
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Recently
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        History / Update
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {accessories && accessories?.data?.length > 0 ? (
                                    accessories?.data?.map((data, index) => (
                                        <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm"
                                                scope="row"
                                            >
                                                {data.serial_No}
                                            </th>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.name}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.totalQuantity}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {formatReadableDate(data.r_Date)}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.recently}
                                            </td>
                                            <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4 flex items-center gap-8">
                                                <FaEye onClick={() => openModal(data?.id)} size={20} className='cursor-pointer' />
                                                <MdEdit onClick={() => openAccessoriesModal(data?.id)} size={20} className='cursor-pointer' />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="w-full flex justify-center items-center">
                                        <td className='text-xl mt-3'>No Data Available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Pagination
              currentPage={page}
              totalPages={accessories?.totalPages}
              totalRecords={accessories?.totalRecords}
              pageSize={limit}
            />

            {accessoriesModal && <UsedAccessoriesModal isOpen={openAccessoriesModal} closeModal={closeAccessoriesModal} selectedUsedAccessories={selectedUsedAccessories} />}

            {isOpen && (
                <div
                    aria-hidden="true"
                    className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
                >
                    <div className="relative py-4 px-3 w-[95%] max-w-3xl max-h-[80vh] scrollable-content bg-white rounded-md shadow dark:bg-gray-700 overflow-y-auto">
                        {/* ------------- HEADER ------------- */}
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Accessories History
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

                        <div className="tabs flex justify-between items-center my-4">
                            <div className="tabs_button flex flex-wrap gap-1">
                                <button
                                    className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md ${selectedTab === "all_Records"
                                        ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                                        : ""}`}
                                    onClick={() => handleTabClick("all_Records")}
                                >
                                    Stock In
                                </button>
                                <button
                                    className={`border border-gray-500 px-5 py-2 mx-2 text-sm rounded-md ${selectedTab === "accessoriesUsed_Records"
                                        ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                                        : ""}`}
                                    onClick={() => handleTabClick("accessoriesUsed_Records")}
                                >
                                    Stock Used
                                </button>
                            </div>
                        </div>

                        {/* ------------- BODY ------------- */}
                        <div className="pb-7 pt-0 px-2">
                            {selectedTab === "all_Records" && (
                                <>
                                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                            <tr>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Serial No
                                                </th>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Date
                                                </th>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Name
                                                </th>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Quantity
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData && filteredData.length > 0 ? (
                                                filteredData?.map((item, index) => (
                                                    item?.all_Records?.slice().reverse().map((data, subIndex) => (
                                                        <tr key={`${index}-${subIndex}`}  className={`bg-white text-black"
                                                          border-b text-sm font-medium`}>
                                                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {data.serial_No}
                                                            </th>
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {formatReadableDate(data?.date)}
                                                            </td>
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {data.name}
                                                            </td>
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {data.quantity} 
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))
                                            ) : (
                                                <tr className="w-full flex justify-center items-center">
                                                    <td className='text-xl mt-3'>No Data Available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {selectedTab === "accessoriesUsed_Records" && (
                                <>
                                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                            <tr>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Date
                                                </th>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Name
                                                </th>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Note
                                                </th>
                                                <th
                                                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                                    scope="col"
                                                >
                                                    Quantity
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData && filteredData.length > 0 ? (
                                                filteredData?.map((item, index) => (
                                                    item?.accessoriesUsed_Records?.map((data, subIndex) => (
                                                        <tr key={`${index}-${subIndex}`} className="bg-white border-b text-sm font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {formatReadableDate(data?.date)}
                                                            </td>
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {data?.name}
                                                            </td>
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {data?.note}
                                                            </td>
                                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                                {data?.quantityRemoved}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))
                                            ) : (
                                                <tr className="w-full flex justify-center items-center">
                                                    <td className='text-xl mt-3'>No Data Available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </div>
                </div >
            )}
        </>
    )
}

export default Accessories;
