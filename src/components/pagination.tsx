import type { Pagination as PaginationInfo } from "@/app/api/destinations/types";

// The API caps pageSize at 50.
const PAGE_SIZE_OPTIONS = [10, 20, 50];

type PaginationProps = {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const buttonClass =
  "rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50";

const Pagination = ({
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const { page, pageSize, total, totalPages } = pagination;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-4 text-sm"
    >
      <p className="text-gray-600">
        Showing {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="page-size" className="text-gray-600">
          Per page
        </label>
        <select
          id="page-size"
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export { Pagination };
