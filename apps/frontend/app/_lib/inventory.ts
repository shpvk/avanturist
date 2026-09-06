import { dotaItems } from "./dota-items";

export type Inventory = {
  main: Array<string | null>;
  backpack: Array<string | null>;
  scepter: string | null;
  shard: string | null;
  neutral: string | null;
};

const scepterIds = new Set(["ultimate_scepter", "ultimate_scepter_2"]);
const shardId = "aghanims_shard";
const neutralIds = new Set(dotaItems.filter((item) => item.category === "neutral").map((item) => item.id));

export const mainSlotCount = 6;
export const backpackSlotCount = 3;

export function splitInventory(items: string[]): Inventory {
  let scepter: string | null = null;
  let shard: string | null = null;
  let neutral: string | null = null;
  const carried: string[] = [];

  for (const item of items) {
    if (!scepter && scepterIds.has(item)) scepter = item;
    else if (!shard && item === shardId) shard = item;
    else if (!neutral && neutralIds.has(item)) neutral = item;
    else carried.push(item);
  }

  const stowed = carried.slice(mainSlotCount);
  const backpackSlots = Math.max(backpackSlotCount, Math.ceil(stowed.length / backpackSlotCount) * backpackSlotCount);
  return {
    main: Array.from({ length: mainSlotCount }, (_, index) => carried[index] ?? null),
    backpack: Array.from({ length: backpackSlots }, (_, index) => stowed[index] ?? null),
    scepter,
    shard,
    neutral,
  };
}

function carriedOf(inventory: Inventory): string[] {
  return [...inventory.main, ...inventory.backpack].filter((entry): entry is string => entry !== null);
}

export function placeItem(items: string[], item: string, slot: number): string[] {
  const inventory = splitInventory(items);
  const carried = carriedOf(inventory).filter((entry) => entry !== item);
  carried.splice(Math.min(Math.max(slot, 0), carried.length), 0, item);

  const dedicated = [inventory.scepter, inventory.shard, inventory.neutral]
    .filter((entry): entry is string => entry !== null && entry !== item);

  return [...dedicated, ...carried];
}

export function dropItem(items: string[], item: string): string[] {
  return items.filter((entry) => entry !== item);
}

export function inventorySize(items: string[]): number {
  const inventory = splitInventory(items);
  return carriedOf(inventory).length
    + [inventory.scepter, inventory.shard, inventory.neutral].filter(Boolean).length;
}
