import { Button } from "@/components/ui/button";

export const productsPerPage = 10;

export function getPageCount(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / productsPerPage));
}

export function paginateItems<T>(items: T[], page: number) {
  const pageCount = getPageCount(items.length);
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * productsPerPage;

  return {
    pageItems: items.slice(start, start + productsPerPage),
    pageCount,
    safePage,
  };
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="col-span-full mt-6 mb-24 flex flex-col items-center justify-center gap-3 sm:mb-6 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        className="h-10 cursor-pointer rounded-full px-5"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm font-semibold text-gray-600">
        Page {page} of {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        className="h-10 cursor-pointer rounded-full px-5"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
