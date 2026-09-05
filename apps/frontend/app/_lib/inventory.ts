import { dotaItems } from "./dota-items";

/** A build split the way Dota shows one: carried items, the Aghanim's upgrades, the neutral. */
export type Inventory = {
  /** Carried items in build order, padded with empty slots up to a full inventory. */
  main: Array<string | null>;
  scepter: string | null;
  shard: string | null;
  neutral: string | null;
};

/** Aghanim's Scepter and the Blessing it upgrades into share the one scepter slot. */
const scepterIds = new Set(["ultimate_scepter", "ultimate_scepter_2"]);
const shardId = "aghanims_shard";
const neutralIds = new Set(dotaItems.filter((item) => item.category === "neutral").map((item) => item.id));

/** Dota carries six items; the dedicated slots hold everything else. */
export const mainSlotCount = 6;

/**
 * Builds are stored as one flat list, so the dedicated slots are read out of it: the first
 * scepter, shard and neutral item claim their own slot and the rest stay carried. An
 * unusually long build keeps every item — the carried grid simply grows another row.
 */
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

  const slots = Math.max(mainSlotCount, Math.ceil(carried.length / 3) * 3);
  return {
    main: Array.from({ length: slots }, (_, index) => carried[index] ?? null),
    scepter,
    shard,
    neutral,
  };
}
