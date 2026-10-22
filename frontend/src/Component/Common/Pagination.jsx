import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DEFAULT_PAGE_LIMIT, PAGE_LIMIT_OPTIONS } from "../../Utils/Common";
import ThemedSelect from "./select/ThemedSelect";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getVisiblePages = (currentPage, totalPages) => {
  const pages = [];
  const start = clamp(currentPage - 2, 1, Math.max(totalPages - 4, 1));
  const end = Math.min(start + 4, totalPages);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = DEFAULT_PAGE_LIMIT,
  onPageChange,
  onPageSizeChange,
  syncUrl = true,
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedTotalPages = Math.max(Number(totalPages) || 1, 1);
  const normalizedCurrentPage = clamp(
    Number(currentPage) || 1,
    1,
    normalizedTotalPages,
  );
  const normalizedPageSize = PAGE_LIMIT_OPTIONS.includes(Number(pageSize))
    ? Number(pageSize)
    : DEFAULT_PAGE_LIMIT;
  const [jumpPage, setJumpPage] = useState("");

  const visiblePages = useMemo(
    () => getVisiblePages(normalizedCurrentPage, normalizedTotalPages),
    [normalizedCurrentPage, normalizedTotalPages],
  );

  const updateUrl = (updates) => {
    const params = new URLSearchParams(location.search);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    navigate(`${location.pathname}?${params.toString()}`);
  };

  const goToPage = (page) => {
    const nextPage = clamp(Number(page) || 1, 1, normalizedTotalPages);
    onPageChange?.(nextPage);
    if (syncUrl) {
      updateUrl({ page: nextPage });
    }
  };

  const handlePageSizeChange = (event) => {
    const nextLimit = Number(event.target.value);
    onPageSizeChange?.(nextLimit);
    if (syncUrl) {
      updateUrl({ page: 1, limit: nextLimit });
    }
  };

  const handleJump = (event) => {
    event.preventDefault();
    if (!jumpPage) return;
    goToPage(jumpPage);
    setJumpPage("");
  };

  const startRecord =
    totalRecords > 0 ? (normalizedCurrentPage - 1) * normalizedPageSize + 1 : 0;
  const endRecord = Math.min(
    normalizedCurrentPage * normalizedPageSize,
    Number(totalRecords) || 0,
  );

  const controlClass =
    "h-9 rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-900 shadow-sm outline-none transition hover:border-gray-400 hover:bg-gray-50 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:focus:border-gray-400 dark:focus:ring-gray-600";
  const iconButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700";

  return (
    <section
      className={`mx-auto mt-6 flex w-[70%] min-w-[320px] flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm max-sm:w-full max-sm:min-w-0 dark:border-gray-600 dark:bg-gray-800 ${className}`}
    >
      <div className="min-w-[190px] text-sm font-medium text-gray-600 dark:text-gray-300">
        Showing{" "}
        <span className="text-gray-950 dark:text-white">
          {startRecord}-{endRecord}
        </span>{" "}
        of{" "}
        <span className="text-gray-950 dark:text-white">
          {totalRecords || 0}
        </span>{" "}
        records
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(1)}
          disabled={normalizedCurrentPage === 1}
          className={iconButtonClass}
          aria-label="First page"
        >
          <ChevronsLeft size={17} />
        </button>
        <button
          type="button"
          onClick={() => goToPage(normalizedCurrentPage - 1)}
          disabled={normalizedCurrentPage === 1}
          className={iconButtonClass}
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />
        </button>

        {visiblePages[0] > 1 && (
          <span className="px-2 text-sm font-semibold text-gray-400">...</span>
        )}

        {visiblePages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => goToPage(page)}
            className={`h-9 min-w-9 rounded-md px-3 text-sm font-semibold transition ${
              page === normalizedCurrentPage
                ? "bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900"
                : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < normalizedTotalPages && (
          <span className="px-2 text-sm font-semibold text-gray-400">...</span>
        )}

        <button
          type="button"
          onClick={() => goToPage(normalizedCurrentPage + 1)}
          disabled={normalizedCurrentPage === normalizedTotalPages}
          className={iconButtonClass}
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </button>
        <button
          type="button"
          onClick={() => goToPage(normalizedTotalPages)}
          disabled={normalizedCurrentPage === normalizedTotalPages}
          className={iconButtonClass}
          aria-label="Last page"
        >
          <ChevronsRight size={17} />
        </button>
      </div>

      <div className="flex min-w-[280px] flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          Rows
          <ThemedSelect
            variant="sm"
            className="w-20"
            value={normalizedPageSize}
            onChange={handlePageSizeChange}
          >
            {PAGE_LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </ThemedSelect>
        </div>

        <form onSubmit={handleJump} className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Page {normalizedCurrentPage} of {normalizedTotalPages}
          </span>
          <input
            type="number"
            min="1"
            max={normalizedTotalPages}
            value={jumpPage}
            onChange={(event) => setJumpPage(event.target.value)}
            placeholder="Go"
            className={`${controlClass} w-16 px-2`}
          />
        </form>
      </div>
    </section>
  );
};

export default Pagination;
