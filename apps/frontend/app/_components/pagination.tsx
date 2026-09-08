import { pageItems } from "../_lib/pagination";

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount < 2) return null;

  return (
    <nav className="feed-pagination" aria-label="Build pages">
      {pageItems(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span className="feed-pagination-gap" key={`gap-${index}`} aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button className="feed-pagination-next" type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
