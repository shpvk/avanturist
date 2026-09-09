import type { DotaItem, ItemShelf } from "./dota-items";

export type ShopTab = "basics" | "upgrades" | "neutrals";

export type ShopSection = {
  key: string;
  label: string;
  items: DotaItem[];
};

export const shopTabs: Array<{ value: ShopTab; label: string }> = [
  { value: "basics", label: "Basics" },
  { value: "upgrades", label: "Upgrades" },
  { value: "neutrals", label: "Neutrals" },
];

const basicsShelves: Array<{ shelf: ItemShelf; label: string }> = [
  { shelf: "consumable", label: "Consumables" },
  { shelf: "component", label: "Equipment" },
  { shelf: "secret_shop", label: "Secret shop" },
];

const upgradeShelves: Array<{ shelf: ItemShelf; label: string }> = [
  { shelf: "component", label: "Accessories" },
  { shelf: "common", label: "Support" },
  { shelf: "rare", label: "Magic" },
  { shelf: "epic", label: "Armor and weapons" },
  { shelf: "artifact", label: "Artifacts" },
  { shelf: "secret_shop", label: "Secret shop" },
];

const byCost = (first: DotaItem, second: DotaItem) =>
  first.cost - second.cost || first.name.localeCompare(second.name, "en");

const byName = (first: DotaItem, second: DotaItem) => first.name.localeCompare(second.name, "en");

function shelves(items: DotaItem[], order: Array<{ shelf: ItemShelf; label: string }>): ShopSection[] {
  const known = new Set(order.map((entry) => entry.shelf));
  const sections = order.map(({ shelf, label }) => ({
    key: shelf || "plain",
    label,
    items: items.filter((item) => item.shelf === shelf).sort(byCost),
  }));

  const rest = items.filter((item) => !known.has(item.shelf)).sort(byCost);
  if (rest.length > 0) sections.push({ key: "rest", label: "Other", items: rest });

  return sections.filter((section) => section.items.length > 0);
}

function tiers(items: DotaItem[]): ShopSection[] {
  const known = [...new Set(items.map((item) => item.tier ?? 0))].sort((first, second) => first - second);

  return known
    .map((tier) => ({
      key: `tier-${tier}`,
      label: tier > 0 ? `Tier ${tier}` : "No tier",
      items: items.filter((item) => (item.tier ?? 0) === tier).sort(byName),
    }))
    .filter((section) => section.items.length > 0);
}

export function shopSections(items: DotaItem[], tab: ShopTab): ShopSection[] {
  if (tab === "neutrals") return tiers(items.filter((item) => item.category === "neutral"));

  if (tab === "upgrades") return shelves(items.filter((item) => item.category === "upgrade"), upgradeShelves);

  return shelves(
    items.filter((item) => item.category === "basic" || item.category === "consumable"),
    basicsShelves,
  );
}

export function searchShop(items: DotaItem[], query: string): DotaItem[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];

  return items
    .filter((item) => item.name.toLowerCase().includes(needle) || item.id.replaceAll("_", " ").includes(needle))
    .sort((first, second) => {
      const firstAt = first.name.toLowerCase().indexOf(needle);
      const secondAt = second.name.toLowerCase().indexOf(needle);
      return firstAt - secondAt || byName(first, second);
    });
}
