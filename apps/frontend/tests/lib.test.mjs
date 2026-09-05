import assert from "node:assert/strict";
import test from "node:test";

// Node strips the types; these modules deliberately have no relative imports so they can
// be exercised straight from source, without a bundler in the way.
import { commentsLabel, reputationValue } from "../app/_lib/format.ts";
import { votePercentages } from "../app/_lib/votes.ts";
import { chatGPTSignInPath, chatGPTSignOutPath, safeRelativeReturnPath } from "../app/_lib/auth-paths.ts";
import { createId } from "../app/_lib/id.ts";
import { filterItems } from "../app/_lib/item-filter.ts";
import { heroRole } from "../app/_lib/hero-roles.ts";
import { pageItems } from "../app/_lib/pagination.ts";

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

test("safeRelativeReturnPath refuses anything that leaves the site", () => {
  assert.equal(safeRelativeReturnPath("/builds?sort=new"), "/builds?sort=new");
  assert.equal(safeRelativeReturnPath("https://evil.example/"), "/");
  assert.equal(safeRelativeReturnPath("//evil.example/"), "/");
  assert.equal(safeRelativeReturnPath("builds"), "/");
  assert.equal(safeRelativeReturnPath("/signin-with-chatgpt"), "/");
  assert.equal(safeRelativeReturnPath("/callback"), "/");
});

test("auth links encode the return path", () => {
  assert.equal(chatGPTSignInPath("/"), "/signin-with-chatgpt?return_to=%2F");
  assert.equal(chatGPTSignOutPath(), "/signout-with-chatgpt?return_to=%2F");
  assert.equal(chatGPTSignInPath("https://evil.example"), "/signin-with-chatgpt?return_to=%2F");
});

test("createId never repeats itself", () => {
  const ids = new Set(Array.from({ length: 500 }, () => createId("local")));
  assert.equal(ids.size, 500);
  assert.equal([...ids].every((id) => id.startsWith("local-")), true);
});

const shop = [
  { id: "bfury", name: "Battle Fury", category: "upgrade" },
  { id: "blink", name: "Blink Dagger", category: "basic" },
  { id: "tango", name: "Tango", category: "consumable" },
  { id: "pogo_stick", name: "Tumbler's Toy", category: "neutral" },
];

const ids = (items) => items.map((item) => item.id);

test("filterItems keeps the whole shop until something narrows it", () => {
  assert.deepEqual(ids(filterItems(shop, { query: "", category: "all" })), ["bfury", "blink", "tango", "pogo_stick"]);
  assert.deepEqual(ids(filterItems(shop, { query: "   ", category: "all" })), ["bfury", "blink", "tango", "pogo_stick"]);
});

test("filterItems searches the display name and the id a build is stored with", () => {
  assert.deepEqual(ids(filterItems(shop, { query: "battle fury", category: "all" })), ["bfury"]);
  assert.deepEqual(ids(filterItems(shop, { query: "BFURY", category: "all" })), ["bfury"]);
  assert.deepEqual(ids(filterItems(shop, { query: "pogo stick", category: "all" })), ["pogo_stick"]);
  assert.deepEqual(ids(filterItems(shop, { query: "blink", category: "consumable" })), []);
  assert.deepEqual(ids(filterItems(shop, { query: "нет такого", category: "all" })), []);
});

test("filterItems narrows by category", () => {
  assert.deepEqual(ids(filterItems(shop, { query: "", category: "neutral" })), ["pogo_stick"]);
  assert.deepEqual(ids(filterItems(shop, { query: "", category: "upgrade" })), ["bfury"]);
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
