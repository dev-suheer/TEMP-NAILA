import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  GetAllProcessBillAsync,
  GetAllPictureAccountsAsync,
} from "../../features/ProcessBillSlice";
import { useDispatch, useSelector } from "react-redux";
import BillFilters, {
  emptyBillFilters,
} from "../../Component/BillFilters/BillFilters";
import Pagination from "../../Component/Common/Pagination";
import StatusChip from "../../Component/Common/StatusChip";
import {
  accountStatusOptions,
  buildPaginationQuery,
  formatReadableDate,
  getPageLimit,
} from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";

const processCategories = [
  "Embroidery",
  "Calender",
  "Cutting",
  "Stone",
  "Stitching",
  "Pictures",
];

const initialProcessBillFilters = {
  ...emptyBillFilters,
  status: "",
};

const ProcessBills = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("Embroidery");

  const [filters, setFilters] = useState(initialProcessBillFilters);
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  const { loading, ProcessBills } = useSelector((state) => state.ProcessBill);

  const fetchProcessBills = ({
    category = selectedCategory,
    pageValue = page,
    limitValue = limit,
    filterValues = filters,
  } = {}) => {
    const payload = {
      page: pageValue,
      limit: limitValue,
      name: filterValues.name || undefined,
      status: filterValues.status || undefined,
      dateFrom: filterValues.dateFrom || undefined,
      dateTo: filterValues.dateTo || undefined,
    };

    if (category === "Pictures") {
      dispatch(GetAllPictureAccountsAsync(payload));
    } else {
      dispatch(GetAllProcessBillAsync({ ...payload, category }));
    }
  };

  useEffect(() => {
    fetchProcessBills({ pageValue: page, limitValue: limit });
  }, [dispatch, page, limit, selectedCategory]);


  const handleCategoryFilterChange = (category) => {
    const nextCategory = category || "Embroidery";
    setSelectedCategory(nextCategory);
    setFilters(initialProcessBillFilters);
    fetchProcessBills({
      category: nextCategory,
      pageValue: 1,
      filterValues: initialProcessBillFilters,
    });
    navigate(`/dashboard/processbills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleFiltersSearch = () => {
    fetchProcessBills({ pageValue: 1 });
    navigate(`/dashboard/processbills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleFiltersChange = (nextFilters) => {
    const statusChanged = nextFilters.status !== filters.status;
    const updatedFilters = statusChanged
      ? { ...nextFilters, name: "" }
      : nextFilters;

    setFilters(updatedFilters);

    if (statusChanged) {
      fetchProcessBills({ pageValue: 1, filterValues: updatedFilters });
      navigate(`/dashboard/processbills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
    }
  };

  const handleResetFilters = () => {
    setFilters(initialProcessBillFilters);
    fetchProcessBills({
      pageValue: 1,
      filterValues: initialProcessBillFilters,
    });
    navigate(`/dashboard/processbills${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Process 
          </h1>

          <BillFilters
            filters={filters}
            nameOptions={(ProcessBills?.partyNames || []).map((name) => ({
              value: name,
              label: name,
            }))}
            categoryOptions={processCategories.map((category) => ({
              value: category,
              label: category,
            }))}
            statusOptions={accountStatusOptions}
            selectedCategory={selectedCategory}
            showCategoryFilter={true}
            showStatusFilter={true}
            namePlaceholder="Party Name"
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
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    S # No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    Party Name
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    Design No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {ProcessBills && ProcessBills?.processBills?.length > 0 ? (
                  ProcessBills?.processBills?.map((data, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <th
                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        scope="row"
                      >
                        {data?.serial_No}
                      </th>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data?.partyName}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data?.design_no}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{formatReadableDate(data?.date)}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                        <StatusChip status={data?.virtual_account?.status} fallback="" />
                      </td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <Link
                          to={`/dashboard/process-details/${data?.id}/${selectedCategory}`}
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
        totalPages={ProcessBills?.totalPages}
        totalRecords={
          ProcessBills?.totalRecords ?? ProcessBills?.totalProcessBills
        }
        pageSize={limit}
        onPageChange={(nextPage) => fetchProcessBills({ pageValue: nextPage })}
        onPageSizeChange={(nextLimit) =>
          fetchProcessBills({ pageValue: 1, limitValue: nextLimit })
        }
      />
    </>
  );
};

export default ProcessBills;

