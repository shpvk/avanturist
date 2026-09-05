/**
 * Narrowing for the item picker. The whole Dota shop is ~250 icons, so the picker only
 * ever shows a slice of it. Kept free of imports so the tests can run it from source.
 */

type Filterable = { id: string; name: string; category: string };

export type ItemFilterState = {
  /** Free text, matched against the display name and the id a build is stored with. */
  query: string;
  /** A category from the catalog, or "all". */
  category: string;
};

export function filterItems<T extends Filterable>(items: T[], { query, category }: ItemFilterState): T[] {
  const needle = query.trim().toLowerCase();

  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (needle === "") return true;
    // "battle fury" and "bfury" both have to find the same icon.
    return item.name.toLowerCase().includes(needle) || item.id.replaceAll("_", " ").includes(needle);
  });
}
