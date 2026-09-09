export const pageSize = 12;

export type PageItem = number | "gap";

const windowSize = 3;

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
