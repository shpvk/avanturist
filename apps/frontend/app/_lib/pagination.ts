/** A page number, or the gap that stands for the pages the pager does not list. */
export type PageItem = number | "gap";

/** How many numbers stay around the current page before the pager collapses the rest. */
const windowSize = 3;

/**
 * The pager's buttons: the first page, a sliding window around the current one, the last
 * page, and a gap wherever numbers were left out. Short feeds list every page instead.
 */
export function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= windowSize + 2) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(page - 1, 1), pageCount - windowSize + 1);
  const numbers = new Set([1, pageCount]);
  for (let offset = 0; offset < windowSize; offset += 1) numbers.add(start + offset);

  const items: PageItem[] = [];
  let previous = 0;
  for (const number of [...numbers].sort((first, second) => first - second)) {
    if (previous && number - previous > 1) items.push("gap");
    items.push(number);
    previous = number;
  }
  return items;
}
