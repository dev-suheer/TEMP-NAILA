import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { TfiWrite } from "react-icons/tfi";
import { getBuyerForBranchAsync } from "../../features/BuyerSlice";
import BillFilters, {
  emptyBillFilters,
} from "../../Component/BillFilters/BillFilters";
import Pagination from "../../Component/Common/Pagination";
import StatusChip from "../../Component/Common/StatusChip";
import {
  buildPaginationQuery,
  buyerStatusOptions,
  getPageLimit,
} from "../../Utils/Common";

const initialBuyerFilters = {
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

const Buyers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialBuyerFilters);
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);
  const { user } = useSelector((state) => state.auth);
  const { Branches } = useSelector((state) => state.InStock);
  const { loading, Buyers } = useSelector((state) => state.Buyer);
  const [selectedBranchId, setSelectedBranchId] = useState();

  const getDefaultBranchId = () => user?.user?.branchId || Branches?.[0]?.id;

  const getBuyerPayload = ({
    branchId = selectedBranchId || getDefaultBranchId(),
    pageValue = page,
    filterValues = filters,
  } = {}) => ({
    id: user?.user?.id,
    branchId,
    page: pageValue,
    limit,
    name: filterValues.name || undefined,
    status: filterValues.status || undefined,
  });

  useEffect(() => {
    if (Branches?.length > 0) {
      const branchId = selectedBranchId || getDefaultBranchId();
      const payload = getBuyerPayload({ branchId, pageValue: page });
      dispatch(getBuyerForBranchAsync(payload));

      setSelectedBranchId(branchId);
    }
  }, [user, dispatch, Branches, page, limit]);

  const filteredData = Buyers?.buyers;



  const handleFiltersSearch = () => {
    dispatch(getBuyerForBranchAsync(getBuyerPayload({ pageValue: 1 })));
    navigate(`/dashboard/buyers${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleFiltersChange = (nextFilters) => {
    const statusChanged = nextFilters.status !== filters.status;
    const updatedFilters = statusChanged
      ? { ...nextFilters, name: "" }
      : nextFilters;

    setFilters(updatedFilters);

    if (statusChanged) {
      dispatch(
        getBuyerForBranchAsync(
          getBuyerPayload({ pageValue: 1, filterValues: updatedFilters }),
        ),
      );
      navigate(`/dashboard/buyers${buildPaginationQuery(searchParams, { page: 1, limit })}`);
    }
  };

  const handleResetFilters = () => {
    setFilters(initialBuyerFilters);
    dispatch(
      getBuyerForBranchAsync(
        getBuyerPayload({ pageValue: 1, filterValues: initialBuyerFilters }),
      ),
    );
    navigate(`/dashboard/buyers${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  const handleBranchFilterChange = (branchId) => {
    const nextBranchId = branchId || getDefaultBranchId();
    setSelectedBranchId(nextBranchId);
    setFilters(initialBuyerFilters);

    const payload = getBuyerPayload({
      branchId: nextBranchId,
      pageValue: 1,
      filterValues: initialBuyerFilters,
    });
    dispatch(getBuyerForBranchAsync(payload));
    navigate(`/dashboard/buyers${buildPaginationQuery(searchParams, { page: 1, limit })}`);
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Buyers
          </h1>

          {/* <!-- search bar --> */}
          <BillFilters
            filters={filters}
            nameOptions={(Buyers?.buyerNames || []).map((name) => ({
              value: name,
              label: name,
            }))}
            branchOptions={(Branches || []).map((branch) => ({
              value: branch.id,
              label: branch.branchName,
            }))}
            selectedBranch={selectedBranchId}
            statusOptions={buyerStatusOptions}
            showBranchFilter={true}
            showStatusFilter={true}
            showDateFilters={false}
            namePlaceholder="Buyer"
            onChange={handleFiltersChange}
            onBranchChange={handleBranchFilterChange}
            onSearch={handleFiltersSearch}
            onReset={handleResetFilters}
          />
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {/* -------------- TABLE -------------- */}

        <div className="relative overflow-x-auto mt-5 ">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                  <span className="text-red-500">S.N</span>-
                  <span className="text-green-600">A.S.N</span>
                </th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                  Party Name
                </th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                  City
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
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                  New Bill
                </th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <div className="min-h-[50vh] flex justify-center items-center">
                      <div
                        className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full "
                        role="status"
                        aria-label="loading"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData?.map((data, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b text-md font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        <span className="text-red-500">
                          {" "}
                          {data.serialNumber}
                        </span>
                        -<span className="text-green-600">{data.autoSN}</span>
                      </td>
                      <th
                        className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        scope="row"
                      >
                        <p>{data.name}</p>
                        <PhoneComponent phone={data.phone} />
                      </th>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">{data.city}</td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {data.virtual_account.total_credit} Rs
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {data.virtual_account.total_debit} Rs
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        {data.virtual_account.total_balance} Rs
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        <StatusChip status={data.virtual_account.status} fallback="" />
                      </td>
                      <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4">
                        <Link
                          onClick={() => window.scrollTo(0, 0)}
                          to={`/dashboard/buyers-details/${data.id}`}
                        >
                          <FaEye size={20} className="cursor-pointer" />
                        </Link>
                      </td>
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                        <Link
                          to={`/dashboard/old-buyer-generate-bill/${data.id}`}
                          onClick={() => window.scrollTo(0, 0)}
                        >
                          <TfiWrite className="cursor-pointer" size={20} />
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
            )}
          </table>
        </div>
      </section>

      <Pagination
        currentPage={page}
        totalPages={Buyers?.totalPages}
        totalRecords={Buyers?.totalRecords ?? Buyers?.totalBuyers}
        pageSize={limit}
      />
    </>
  );
};

export default Buyers;
