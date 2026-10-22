/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  AllBranchStockHistoryAsync,
  approveOrRejectReturnedStockAsync,
  getPendingReturnedStockAsync,
} from "../../../features/InStockSlice";
import Pagination from "../../../Component/Common/Pagination";
import { getPageLimit } from "../../../Utils/Common";
import PageLoader from "../../../Component/Loader/PageLoader";
import DeleteModal from "../../../Component/Modal/DeleteModal";
import TransferCard from "./components/TransferCard";
import ReturnApprovalModal from "./components/ReturnApprovalModal";
import SegmentedFilter from "../../../Component/Common/SegmentedFilter";

const directionOptions = [
  { value: "", label: "All" },
  { value: "TO_BRANCH", label: "Sent to Branch" },
  { value: "RETURN_TO_MAIN", label: "Returned to Main" },
];

const statusOptions = [
  { value: "", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const AssignedStockHistory = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewTransfer, setReviewTransfer] = useState(null);
  const [rejectTransfer, setRejectTransfer] = useState(null);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);
  const branchId = searchParams.get("branchId") || "";
  const transferType = searchParams.get("transferType") || "";
  const bundleStatus = searchParams.get("bundleStatus") || "";

  const {
    StockHistoryLoading,
    StockHistory,
    Branches,
    stockLoading,
    pendingReturnedStockCount,
  } = useSelector((state) => state.InStock);

  const fetchHistory = () => {
    dispatch(
      AllBranchStockHistoryAsync({
        branchId,
        transferType,
        bundleStatus,
        page,
        limit,
      })
    );
  };

  useEffect(() => {
    fetchHistory();
  }, [dispatch, branchId, transferType, bundleStatus, page, limit]);

  useEffect(() => {
    dispatch(getPendingReturnedStockAsync());
  }, [dispatch]);

  const updateFilters = (values) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set("page", 1);
    setSearchParams(params);
  };

  const getBranchName = (id) =>
    Branches?.find((branch) => branch.id === id)?.branchName;

  const updateReturnStatus = (payload, onDone) => {
    dispatch(approveOrRejectReturnedStockAsync(payload)).then((res) => {
      if (res.payload?.success) {
        onDone();
        fetchHistory();
        dispatch(getPendingReturnedStockAsync());
      }
    });
  };

  const handleApprove = (allocations) => {
    updateReturnStatus(
      { stockId: reviewTransfer.id, status: "Approved", allocations },
      () => setReviewTransfer(null)
    );
  };

  const handleReject = () => {
    updateReturnStatus({ stockId: rejectTransfer.id, status: "Rejected" }, () =>
      setRejectTransfer(null)
    );
  };

  const transfers = StockHistory?.data || [];

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <div>
            <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
              Branch Stock History
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Stock sent to branches and stock returned to main
            </p>
          </div>
          {pendingReturnedStockCount > 0 && (
            <button
              type="button"
              onClick={() =>
                updateFilters({
                  transferType: "RETURN_TO_MAIN",
                  bundleStatus: "Pending",
                })
              }
              className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                {pendingReturnedStockCount}
              </span>
              Pending returns to review
            </button>
          )}
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {/* -------------- FILTERS -------------- */}
        <div className="mx-2 my-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Branch
            </span>
            {[{ id: "", branchName: "All Branches" }, ...(Branches || [])].map(
              (branch) => (
                <button
                  key={branch.id || "all"}
                  type="button"
                  onClick={() => updateFilters({ branchId: branch.id })}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                    branchId === branch.id
                      ? "border-[#252525] bg-[#252525] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {branch.branchName}
                </button>
              )
            )}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <SegmentedFilter
              label="Direction"
              options={directionOptions}
              value={transferType}
              onChange={(value) => updateFilters({ transferType: value })}
            />
            <SegmentedFilter
              label="Status"
              options={statusOptions}
              value={bundleStatus}
              onChange={(value) => updateFilters({ bundleStatus: value })}
            />
          </div>
        </div>

        {/* -------------- TRANSFERS -------------- */}
        {StockHistoryLoading ? (
          <PageLoader/>
        ) : transfers.length > 0 ? (
          <div className="mx-2 space-y-4">
            {transfers.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                branchName={branchId ? null : getBranchName(transfer.branchId)}
                onReview={setReviewTransfer}
                onReject={setRejectTransfer}
                actionLoading={stockLoading}
              />
            ))}
          </div>
        ) : (
          <div className="mx-2 rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
            No stock transfers found for the selected filters
          </div>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={StockHistory?.totalPages}
        totalRecords={StockHistory?.totalRecords}
        pageSize={limit}
      />

      {reviewTransfer && (
        <ReturnApprovalModal
          transfer={reviewTransfer}
          branchName={getBranchName(reviewTransfer.branchId)}
          onClose={() => setReviewTransfer(null)}
          onConfirm={handleApprove}
          loading={stockLoading}
        />
      )}

      {rejectTransfer && (
        <DeleteModal
          title={"Reject Returned Stock"}
          message={
            "The returned suits will be added back to the branch stock. Are you sure ?"
          }
          onClose={() => setRejectTransfer(null)}
          Loading={stockLoading}
          onConfirm={handleReject}
        />
      )}
    </>
  );
};

export default AssignedStockHistory;
