import type { DotaItem, ItemShelf } from "./dota-items";

export type ShopTab = "basics" | "upgrades" | "neutrals";

export type ShopSection = {
  key: string;
  label: string;
  items: DotaItem[];
};

export const shopTabs: Array<{ value: ShopTab; label: string }> = [
  { value: "basics", label: "Базовые" },
  { value: "upgrades", label: "Составные" },
  { value: "neutrals", label: "Нейтральные" },
];

const basicsShelves: Array<{ shelf: ItemShelf; label: string }> = [
  { shelf: "consumable", label: "Расходники" },
  { shelf: "component", label: "Снаряжение" },
  { shelf: "secret_shop", label: "Секретная лавка" },
];

const upgradeShelves: Array<{ shelf: ItemShelf; label: string }> = [
  { shelf: "component", label: "Аксессуары" },
  { shelf: "common", label: "Поддержка" },
  { shelf: "rare", label: "Магия" },
  { shelf: "epic", label: "Броня и оружие" },
  { shelf: "artifact", label: "Артефакты" },
  { shelf: "secret_shop", label: "Секретная лавка" },
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
  if (rest.length > 0) sections.push({ key: "rest", label: "Прочее", items: rest });

  return sections.filter((section) => section.items.length > 0);
}

function tiers(items: DotaItem[]): ShopSection[] {
  const known = [...new Set(items.map((item) => item.tier ?? 0))].sort((first, second) => first - second);

  return known
    .map((tier) => ({
      key: `tier-${tier}`,
      label: tier > 0 ? `${tier} уровень` : "Без уровня",
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
