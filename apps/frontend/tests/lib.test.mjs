import assert from "node:assert/strict";
import test from "node:test";

import { commentsLabel, reputationValue } from "../app/_lib/format.ts";
import { votePercentages } from "../app/_lib/votes.ts";
import { createId } from "../app/_lib/id.ts";
import { searchShop, shopSections } from "../app/_lib/shop-order.ts";
import { dotaItems } from "../app/_lib/dota-items.ts";
import { heroRole } from "../app/_lib/hero-roles.ts";
import { pageItems } from "../app/_lib/pagination.ts";
import { canDeleteBuild } from "../app/_lib/ownership.ts";

test("commentsLabel picks the Russian plural form", () => {
  assert.equal(commentsLabel(0), "0 комментариев");
  assert.equal(commentsLabel(1), "1 комментарий");
  assert.equal(commentsLabel(2), "2 комментария");
  assert.equal(commentsLabel(4), "4 комментария");
  assert.equal(commentsLabel(5), "5 комментариев");
  assert.equal(commentsLabel(11), "11 комментариев");
  assert.equal(commentsLabel(14), "14 комментариев");
  assert.equal(commentsLabel(21), "21 комментарий");
  assert.equal(commentsLabel(102), "102 комментария");
  assert.equal(commentsLabel(111), "111 комментариев");
});

test("reputationValue reads the number out of the display string", () => {
  assert.equal(reputationValue("1 245"), 1245);
  assert.equal(reputationValue("0"), 0);
  assert.equal(reputationValue("нет данных"), 0);
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

test("каждый предмет каталога попадает ровно в одну полку одной вкладки", () => {
  const shelved = ["basics", "upgrades", "neutrals"]
    .flatMap((tab) => shopSections(dotaItems, tab))
    .flatMap((section) => section.items.map((item) => item.id));

  assert.equal(shelved.length, dotaItems.length);
  assert.equal(new Set(shelved).size, dotaItems.length);
});

test("shopSections раскладывает базовые предметы по полкам магазина", () => {
  const sections = shopSections(shop, "basics");

  assert.deepEqual(sections.map((section) => section.label), ["Расходники", "Снаряжение", "Секретная лавка"]);
  assert.deepEqual(ids(sections[0].items), ["tango"]);
  assert.deepEqual(ids(sections[2].items), ["relic"]);
});

test("внутри полки предметы идут от дешёвых к дорогим, как в магазине", () => {
  const priced = [
    { id: "b", name: "B", cost: 900, category: "upgrade", shelf: "rare" },
    { id: "a", name: "A", cost: 2100, category: "upgrade", shelf: "rare" },
    { id: "c", name: "C", cost: 150, category: "upgrade", shelf: "rare" },
  ];

  assert.deepEqual(ids(shopSections(priced, "upgrades")[0].items), ["c", "b", "a"]);
});

test("нейтральные предметы разложены по уровням", () => {
  const sections = shopSections(shop, "neutrals");

  assert.deepEqual(sections.map((section) => section.label), ["1 уровень", "2 уровень"]);
  assert.deepEqual(ids(sections[0].items), ["pogo_stick"]);
});

test("searchShop ищет по названию и по идентификатору, совпадением ближе к началу", () => {
  assert.deepEqual(ids(searchShop(shop, "battle fury")), ["bfury"]);
  assert.deepEqual(ids(searchShop(shop, "BFURY")), ["bfury"]);
  assert.deepEqual(ids(searchShop(shop, "pogo stick")), ["pogo_stick"]);
  assert.deepEqual(ids(searchShop(shop, "ring")), ["arcane_ring"]);
  assert.deepEqual(searchShop(shop, "   "), []);
  assert.deepEqual(searchShop(shop, "нет такого"), []);
});

test("heroRole reads the curated lane for a hero it knows", () => {
  assert.deepEqual(heroRole("antimage"), { role: "Керри", roleClass: "carry" });
  assert.deepEqual(heroRole("shadow_shaman"), { role: "Саппорт", roleClass: "support" });
  assert.deepEqual(heroRole("leshrac", ["Carry", "Support"]), { role: "Мид", roleClass: "mid" });
});

test("heroRole falls back to OpenDota's tags for a hero it has never seen", () => {
  assert.deepEqual(heroRole("brand_new_hero", ["Initiator", "Durable"]), { role: "Оффлейн", roleClass: "offlane" });
  assert.deepEqual(heroRole("brand_new_hero", ["Support"]), { role: "Саппорт", roleClass: "support" });
  assert.deepEqual(heroRole("brand_new_hero"), { role: "Керри", roleClass: "carry" });
});

test("canDeleteBuild отдаёт свою сборку автору и любую — администратору", () => {
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
