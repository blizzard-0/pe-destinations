import type { Pagination as PaginationInfo } from "@/app/api/destinations/types";

type PaginationProps = {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
};

const buttonClass =
  "rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50";

const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
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
