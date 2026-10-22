import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { FaEye } from "react-icons/fa";
import { GetEmployeeActive } from '../../features/AccountSlice';
import { getPageLimit } from "../../Utils/Common";

const ActiveEmployee = ({ selectedCategory }) => {
    const dispatch = useDispatch();

    const { loading, ActiveEmployees } = useSelector((state) => state.Account);

    const [searchParams] = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

    useEffect(() => {
        dispatch(GetEmployeeActive({ page, limit }))

    }, [page, limit, dispatch]);

  
   
    return (
        <>
          


            <section>
                {loading ? (
                    <div className="pt-16 flex justify-center mt-12 items-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full" role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative overflow-x-auto mt-5">
                            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                    <tr>
                                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col"> Name</th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">Salary</th>


                                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">Advance</th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">Balance</th>

                                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">Details</th>
                                        {selectedCategory === 'Active Employee' && (

                                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ActiveEmployees?.employData && ActiveEmployees?.employData?.length > 0 ? (
                                        ActiveEmployees?.employData?.map((employee, index) => (
                                            <tr key={index} className="bg-white border-b text-md font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white" scope="row">
                                                    <p>{employee.name}</p>
                                                </th>

                                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">{employee.salary} Rs</td>
                                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                                                    {employee?.financeData && employee.financeData.length > 0 ? (
                                                        `${employee.financeData[employee.financeData.length - 1]?.balance < 0 ? 0 : employee.financeData[employee.financeData.length - 1]?.balance} Rs`
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>



                                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                                                    {employee?.financeData && employee.financeData.length > 0 ? (
                                                        `${employee.financeData[employee.financeData.length - 1]?.balance} Rs`
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>

                                                <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                                                    <Link to={`/dashboard/employee-details/${employee.id}`}>
                                                        <FaEye size={20} className='cursor-pointer' />
                                                    </Link>
                                                </td>
                                                {selectedCategory === 'Active Employee' && (
                                                    <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4 flex gap-2 mt-2">
                                                        <FaEdit size={20} className='cursor-pointer' onClick={() => handleEdit(employee)} />
                                                        <FaTrashAlt size={20} className='cursor-pointer' onClick={() => openConfirmationModal(employee)} />
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="w-full text-md font-semibold dark:text-white">
                                            <td colSpan={6} className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-center text-xs md:text-sm">
                                                No employees found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>


        </>
    )
}

export default ActiveEmployee;
