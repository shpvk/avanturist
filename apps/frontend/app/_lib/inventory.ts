import { dotaItems } from "./dota-items.ts";

export type Inventory = {
  main: Array<string | null>;
  backpack: Array<string | null>;
  scepter: string | null;
  shard: string | null;
  neutral: string | null;
};

export type Slots = Array<string | null>;

export const blessingId = "ultimate_scepter_2";
export const shardId = "aghanims_shard";
const neutralIds = new Set(dotaItems.filter((item) => item.category === "neutral").map((item) => item.id));

export const mainSlotCount = 6;
export const backpackSlotCount = 3;
export const carriedSlotCount = mainSlotCount + backpackSlotCount;
export const scepterSlotIndex = carriedSlotCount;
export const shardSlotIndex = carriedSlotCount + 1;
export const neutralSlotIndex = carriedSlotCount + 2;
export const slotCount = carriedSlotCount + 3;

function classify(items: string[]) {
  let scepter: string | null = null;
  let shard: string | null = null;
  let neutral: string | null = null;
  const carried: string[] = [];

  for (const item of items) {
    if (item === blessingId) scepter ??= item;
    else if (item === shardId) shard ??= item;
    else if (neutralIds.has(item)) neutral ??= item;
    else carried.push(item);
  }

  return { scepter, shard, neutral, carried };
}

export function splitInventory(items: string[]): Inventory {
  const { scepter, shard, neutral, carried } = classify(items);
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

export function emptySlots(): Slots {
  return Array.from({ length: slotCount }, () => null);
}

export function toSlots(items: string[]): Slots {
  const { scepter, shard, neutral, carried } = classify(items);
  const slots = emptySlots();
  carried.slice(0, carriedSlotCount).forEach((item, index) => { slots[index] = item; });
  slots[scepterSlotIndex] = scepter;
  slots[shardSlotIndex] = shard;
  slots[neutralSlotIndex] = neutral;
  return slots;
}

export function fromSlots(slots: Slots): string[] {
  return slots.filter((item): item is string => item !== null);
}

export function dedicatedSlot(item: string): number | null {
  if (item === blessingId) return scepterSlotIndex;
  if (item === shardId) return shardSlotIndex;
  if (neutralIds.has(item)) return neutralSlotIndex;
  return null;
}

export function canPlace(item: string, slot: number): boolean {
  const dedicated = dedicatedSlot(item);
  return dedicated === null ? slot < carriedSlotCount : slot === dedicated;
}

function freeCarriedSlot(slots: Slots): number | null {
  const index = slots.findIndex((item, position) => position < carriedSlotCount && item === null);
  return index === -1 ? null : index;
}

export function placeInSlot(slots: Slots, item: string, slot: number, from: number | null): Slots {
  if (!canPlace(item, slot) || from === slot) return slots;

  const next = [...slots];
  if (from !== null) next[from] = null;

  const displaced = next[slot];
  if (displaced !== null) {
    const spare = from ?? freeCarriedSlot(next);
    if (spare !== null && canPlace(displaced, spare)) next[spare] = displaced;
    else if (dedicatedSlot(displaced) !== slot) return slots;
  }

  next[slot] = item;
  return next;
}

function slotForNewItem(slots: Slots, item: string): number | null {
  const dedicated = dedicatedSlot(item);
  if (dedicated !== null) return dedicated;
  return freeCarriedSlot(slots);
}

export function addItem(slots: Slots, item: string): Slots {
  const slot = slotForNewItem(slots, item);
  return slot === null ? slots : placeInSlot(slots, item, slot, null);
}

export function canAdd(slots: Slots, item: string): boolean {
  return slotForNewItem(slots, item) !== null;
}

export function clearSlot(slots: Slots, slot: number): Slots {
  const next = [...slots];
  next[slot] = null;
  return next;
}

export function carriedSize(slots: Slots): number {
  return slots.slice(0, carriedSlotCount).filter((item) => item !== null).length;
}
