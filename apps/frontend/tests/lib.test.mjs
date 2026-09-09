import assert from "node:assert/strict";
import test from "node:test";

import { commentsLabel, maskEmail, reputationValue } from "../app/_lib/format.ts";
import { votePercentages } from "../app/_lib/votes.ts";
import { createId } from "../app/_lib/id.ts";
import { searchShop, shopSections } from "../app/_lib/shop-order.ts";
import { dotaItems } from "../app/_lib/dota-items.ts";
import { heroRole } from "../app/_lib/hero-roles.ts";
import { pageItems } from "../app/_lib/pagination.ts";
import { canDeleteBuild } from "../app/_lib/ownership.ts";
import {
  addItem,
  canAdd,
  canPlace,
  carriedSize,
  emptySlots,
  fromSlots,
  neutralSlotIndex,
  placeInSlot,
  scepterSlotIndex,
  shardSlotIndex,
  splitInventory,
} from "../app/_lib/inventory.ts";

test("commentsLabel picks the English plural form", () => {
  assert.equal(commentsLabel(0), "0 comments");
  assert.equal(commentsLabel(1), "1 comment");
  assert.equal(commentsLabel(2), "2 comments");
  assert.equal(commentsLabel(21), "21 comments");
  assert.equal(commentsLabel(111), "111 comments");
});

test("maskEmail keeps only the first letter of the address", () => {
  assert.equal(maskEmail("silentstep@example.com"), "s********");
  assert.equal(maskEmail("  a@b.co "), "a********");
  assert.equal(maskEmail(""), "");
  assert.equal(maskEmail("q@x.io").length, maskEmail("verylongaddress@example.org").length);
});

test("reputationValue reads the number out of the display string", () => {
  assert.equal(reputationValue("1 245"), 1245);
  assert.equal(reputationValue("0"), 0);
  assert.equal(reputationValue("no data"), 0);
});

test("votePercentages leaves the tally alone until the reader votes", () => {
  assert.deepEqual(votePercentages([82, 12, 6], null), [82, 12, 6]);
});

test("votePercentages re-normalises so the bar still fills exactly one track", () => {
  const withVote = votePercentages([82, 12, 6], "positive");
  assert.deepEqual(withVote, [82, 12, 6]);

  const situational = votePercentages([50, 30, 20], "situational");
  assert.equal(situational[0] + situational[1] + situational[2] <= 101, true);
  assert.equal(situational[1] > 30, true);
});

test("votePercentages survives a build with no votes at all", () => {
  assert.deepEqual(votePercentages([0, 0, 0], null), [0, 0, 0]);
  assert.deepEqual(votePercentages([0, 0, 0], "negative"), [0, 0, 100]);
});

test("pageItems lists every page of a short feed", () => {
  assert.deepEqual(pageItems(1, 1), [1]);
  assert.deepEqual(pageItems(3, 5), [1, 2, 3, 4, 5]);
});

test("pageItems keeps the first, last and current pages of a long feed", () => {
  assert.deepEqual(pageItems(1, 12), [1, 2, 3, "gap", 12]);
  assert.deepEqual(pageItems(6, 12), [1, "gap", 5, 6, 7, "gap", 12]);
  assert.deepEqual(pageItems(12, 12), [1, "gap", 10, 11, 12]);
});

test("createId never repeats itself", () => {
  const ids = new Set(Array.from({ length: 500 }, () => createId("local")));
  assert.equal(ids.size, 500);
  assert.equal([...ids].every((id) => id.startsWith("local-")), true);
});

const shop = [
  { id: "bfury", name: "Battle Fury", cost: 4100, category: "upgrade", shelf: "epic" },
  { id: "blink", name: "Blink Dagger", cost: 2250, category: "upgrade", shelf: "component" },
  { id: "tango", name: "Tango", cost: 90, category: "consumable", shelf: "consumable" },
  { id: "branches", name: "Iron Branch", cost: 50, category: "basic", shelf: "component" },
  { id: "relic", name: "Sacred Relic", cost: 3800, category: "basic", shelf: "secret_shop" },
  { id: "pogo_stick", name: "Pogo Stick", cost: 0, category: "neutral", shelf: "", tier: 1 },
  { id: "arcane_ring", name: "Arcane Ring", cost: 0, category: "neutral", shelf: "", tier: 2 },
];

const ids = (items) => items.map((item) => item.id);

test("every catalog item lands on exactly one shelf of one tab", () => {
  const shelved = ["basics", "upgrades", "neutrals"]
    .flatMap((tab) => shopSections(dotaItems, tab))
    .flatMap((section) => section.items.map((item) => item.id));

  assert.equal(shelved.length, dotaItems.length);
  assert.equal(new Set(shelved).size, dotaItems.length);
});

test("shopSections lays the basic items out across the shop shelves", () => {
  const sections = shopSections(shop, "basics");

  assert.deepEqual(sections.map((section) => section.label), ["Consumables", "Equipment", "Secret shop"]);
  assert.deepEqual(ids(sections[0].items), ["tango"]);
  assert.deepEqual(ids(sections[2].items), ["relic"]);
});

test("within a shelf the items run from cheap to expensive, as in the shop", () => {
  const priced = [
    { id: "b", name: "B", cost: 900, category: "upgrade", shelf: "rare" },
    { id: "a", name: "A", cost: 2100, category: "upgrade", shelf: "rare" },
    { id: "c", name: "C", cost: 150, category: "upgrade", shelf: "rare" },
  ];

  assert.deepEqual(ids(shopSections(priced, "upgrades")[0].items), ["c", "b", "a"]);
});

test("neutral items are grouped by tier", () => {
  const sections = shopSections(shop, "neutrals");

  assert.deepEqual(sections.map((section) => section.label), ["Tier 1", "Tier 2"]);
  assert.deepEqual(ids(sections[0].items), ["pogo_stick"]);
});

test("searchShop matches on name and id, preferring matches nearer the start", () => {
  assert.deepEqual(ids(searchShop(shop, "battle fury")), ["bfury"]);
  assert.deepEqual(ids(searchShop(shop, "BFURY")), ["bfury"]);
  assert.deepEqual(ids(searchShop(shop, "pogo stick")), ["pogo_stick"]);
  assert.deepEqual(ids(searchShop(shop, "ring")), ["arcane_ring"]);
  assert.deepEqual(searchShop(shop, "   "), []);
  assert.deepEqual(searchShop(shop, "no such item"), []);
});

test("heroRole reads the curated lane for a hero it knows", () => {
  assert.deepEqual(heroRole("antimage"), { role: "Carry", roleClass: "carry" });
  assert.deepEqual(heroRole("shadow_shaman"), { role: "Support", roleClass: "support" });
  assert.deepEqual(heroRole("leshrac", ["Carry", "Support"]), { role: "Mid", roleClass: "mid" });
});

test("heroRole falls back to OpenDota's tags for a hero it has never seen", () => {
  assert.deepEqual(heroRole("brand_new_hero", ["Initiator", "Durable"]), { role: "Offlane", roleClass: "offlane" });
  assert.deepEqual(heroRole("brand_new_hero", ["Support"]), { role: "Support", roleClass: "support" });
  assert.deepEqual(heroRole("brand_new_hero"), { role: "Carry", roleClass: "carry" });
});

test("canDeleteBuild gives an author their own build and an admin any build", () => {
  const build = { id: "b1", authorId: "user-1" };
  const author = { id: "user-1", role: "REGULAR" };
  const stranger = { id: "user-2", role: "REGULAR" };
  const admin = { id: "user-2", role: "ADMIN" };

  assert.equal(canDeleteBuild(build, author), true);
  assert.equal(canDeleteBuild(build, admin), true);
  assert.equal(canDeleteBuild(build, stranger), false);
  assert.equal(canDeleteBuild(build, null), false);
  assert.equal(canDeleteBuild({ id: "b2" }, author), false);
});

test("an item lands in exactly the slot it was dragged into", () => {
  const slots = placeInSlot(emptySlots(), "blade_mail", 4, null);
  assert.equal(slots[4], "blade_mail");
  assert.equal(slots[0], null);

  const swapped = placeInSlot(placeInSlot(slots, "manta", 1, null), "manta", 4, 1);
  assert.equal(swapped[4], "manta");
  assert.equal(swapped[1], "blade_mail");
});

test("the same item can be added several times, a blessing and a shard cannot", () => {
  const many = addItem(addItem(addItem(emptySlots(), "manta"), "manta"), "manta");
  assert.deepEqual(fromSlots(many), ["manta", "manta", "manta"]);

  const aghanims = addItem(addItem(emptySlots(), "ultimate_scepter_2"), "aghanims_shard");
  assert.deepEqual(fromSlots(addItem(aghanims, "ultimate_scepter_2")), ["ultimate_scepter_2", "aghanims_shard"]);
  assert.equal(canPlace("ultimate_scepter_2", 0), false);
  assert.equal(canPlace("aghanims_shard", neutralSlotIndex), false);
});

test("a plain Aghanim is an inventory item, not a blessing", () => {
  assert.equal(canPlace("ultimate_scepter", 0), true);
  assert.equal(canPlace("ultimate_scepter", scepterSlotIndex), false);
  assert.equal(addItem(emptySlots(), "ultimate_scepter")[0], "ultimate_scepter");

  const shown = splitInventory(["ultimate_scepter", "ultimate_scepter_2", "aghanims_shard"]);
  assert.equal(shown.main[0], "ultimate_scepter");
  assert.equal(shown.scepter, "ultimate_scepter_2");
  assert.equal(shown.shard, "aghanims_shard");
});

test("a neutral item lives only in its own slot", () => {
  assert.equal(canPlace("fallen_sky", 0), false);
  assert.equal(canPlace("fallen_sky", neutralSlotIndex), true);
  assert.deepEqual(placeInSlot(emptySlots(), "fallen_sky", 0, null), emptySlots());
  assert.equal(addItem(emptySlots(), "fallen_sky")[neutralSlotIndex], "fallen_sky");

  const replaced = addItem(addItem(emptySlots(), "fallen_sky"), "pogo_stick");
  assert.deepEqual(fromSlots(replaced), ["pogo_stick"]);

  const shown = splitInventory(["manta", "fallen_sky", "pogo_stick"]);
  assert.deepEqual(shown.main.filter(Boolean), ["manta"]);
  assert.equal(shown.neutral, "fallen_sky");
});

test("the blessing and shard slots reject any other item", () => {
  assert.deepEqual(placeInSlot(emptySlots(), "manta", scepterSlotIndex, null), emptySlots());
  assert.deepEqual(placeInSlot(emptySlots(), "manta", shardSlotIndex, null), emptySlots());
  assert.equal(placeInSlot(emptySlots(), "fallen_sky", neutralSlotIndex, null)[neutralSlotIndex], "fallen_sky");
});

test("a build holds 9 items, with the Aghanim and neutral slots on top", () => {
  let slots = emptySlots();
  for (let index = 0; index < 12; index += 1) slots = addItem(slots, "manta");

  assert.equal(carriedSize(slots), 9);
  assert.equal(canAdd(slots, "manta"), false);
  assert.equal(canAdd(slots, "ultimate_scepter_2"), true);
  assert.equal(canAdd(slots, "aghanims_shard"), true);
  assert.equal(canAdd(slots, "fallen_sky"), true);

  const full = addItem(addItem(addItem(slots, "ultimate_scepter_2"), "aghanims_shard"), "fallen_sky");
  assert.equal(carriedSize(full), 9);
  assert.equal(fromSlots(full).length, 12);
});
