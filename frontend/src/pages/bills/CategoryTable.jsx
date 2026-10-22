import { useSelector } from "react-redux";
import {  useSearchParams } from "react-router-dom";

import Pagination from "../../Component/Common/Pagination";
import { formatReadableDate, getPageLimit } from "../../Utils/Common";

const CategoryTable = ({ category }) => {
    const [searchParams] = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);


    // ALL USE SELECTORRS
    const { loading } = useSelector((state) => state.InStock);
    const { Base } = useSelector((state) => state.InStock);
    const { Lace } = useSelector((state) => state.InStock);
    const { Bags } = useSelector((state) => state.InStock);
    const { accessories } = useSelector((state) => state.InStock);
    const { Expense } = useSelector((state) => state.InStock);

    const allExpenses = Expense?.data?.reduce((acc, branch) => {
        return acc.concat(branch.brannchExpenses);
    }, []);



    if (category === 'Base') {
        return (
            <>
                {loading ? (
                    <div className="pt-16 flex justify-center mt-12 items-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full " role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto mt-5 ">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                <tr>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Category
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Colors
                                    </th>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        T. m
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
                                </tr>
                            </thead>
                            <tbody>
                                {Base && Base?.data?.length > 0 ? (
                                    Base?.data?.map((data, index) => (
                                        <tr key={index} className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm" scope="row">
                                                {data?.category}
                                            </th>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data?.colors}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data?.TYm} m
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {formatReadableDate(data?.r_Date)}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data?.recently} m
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
            </>
        );
    } else if (category === 'Lace') {
        return (
            <>
                {loading ? (
                    <div className="pt-16 flex justify-center mt-12 items-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full " role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto mt-7">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                <tr>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Bill No
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
                                        Cetegory
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
                                </tr>
                            </thead>
                            <tbody>
                                {Lace && Lace?.data?.length > 0 ? (
                                    Lace?.data?.map((data, index) => (
                                        <tr key={index} className="bg-white border-b text-sm font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                                scope="row"
                                            >
                                                {data.bill_no}
                                            </th>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.name}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.category}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.totalQuantity} m
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {formatReadableDate(data?.r_Date)}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.recently} m
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
            </>
        );
    } else if (category === 'Bag & Box') {
        return (
            <>
                {loading ? (
                    <div className="pt-16 flex justify-center mt-12 items-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full " role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto mt-7">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                <tr>
                                    <th
                                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                        scope="col"
                                    >
                                        Bill No
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

                                </tr>
                            </thead>
                            <tbody>
                                {Bags && Bags?.data?.length > 0 ? (
                                    Bags?.data?.map((data, index) => (
                                        <tr key={index} className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm"
                                                scope="row"
                                            >
                                                {data.bill_no}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.name}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.totalQuantity} m
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {formatReadableDate(data?.r_Date)}
                                            </td>

                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                {data.recently} m
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
            </>
        );
    } else if (category === 'Accessories') {
        return (
            <>
                {loading ? (
                    <div className="pt-16 flex justify-center mt-12 items-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full " role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
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
                                </tr>
                            </thead>
                            <tbody>
                                {accessories && accessories?.data?.length > 0 ? (
                                    accessories?.data?.map((data, index) => (
                                        <tr key={index} className="bg-white border-b font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white">
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
            </>
        );
    } else if (category === 'Expense') {
        return (
            <>
                {loading ? (
                    <div className="pt-16 flex justify-center mt-12 items-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full " role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative overflow-x-auto mt-5 ">
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
                                            Reason
                                        </th>
                                        <th
                                            className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                            scope="col"
                                        >
                                            Rate
                                        </th>
                                        <th
                                            className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm"
                                            scope="col"
                                        >
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allExpenses?.length > 0 ? (
                                        allExpenses?.data?.map((expense, index) => (
                                            <tr key={index} className="bg-white border-b font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm"
                                                    scope="row"
                                                >
                                                    {expense.serial_no}
                                                </th>
                                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                    {expense.name}
                                                </td>
                                                <td onClick={() => openModal(expense.id)} className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 cursor-pointer text-xs md:text-sm">
                                                    {expense.reason}
                                                </td>
                                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                    {expense.rate}
                                                </td>
                                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                                                    {formatReadableDate(expense.Date)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-center text-xs md:text-sm">
                                                No Data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div >


                        <Pagination
                          currentPage={page}
                          totalPages={Base?.totalPages}
                          totalRecords={Base?.totalRecords}
                          pageSize={limit}
                        />
                    </>
                )}
            </>
        );
    } else {
        return null;
    }
};

export default CategoryTable;
