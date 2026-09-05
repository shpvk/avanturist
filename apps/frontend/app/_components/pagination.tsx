import { pageItems } from "../_lib/pagination";

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

/** Feed pager. A single page needs no controls, so the whole strip disappears. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount < 2) return null;

  return (
    <nav className="feed-pagination" aria-label="Страницы билдов">
      {pageItems(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span className="feed-pagination-gap" key={`gap-${index}`} aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Страница ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button className="feed-pagination-next" type="button" aria-label="Следующая страница" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
