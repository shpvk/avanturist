import assert from "node:assert/strict";
import test from "node:test";

// Node strips the types; these modules deliberately have no relative imports so they can
// be exercised straight from source, without a bundler in the way.
import { commentsLabel, reputationValue } from "../app/_lib/format.ts";
import { votePercentages, voteBarLabel } from "../app/_lib/votes.ts";
import { chatGPTSignInPath, chatGPTSignOutPath, safeRelativeReturnPath } from "../app/_lib/auth-paths.ts";
import { createId } from "../app/_lib/id.ts";

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

test("voteBarLabel reads out every share", () => {
  assert.equal(voteBarLabel([82, 12, 6]), "Лайк 82%, ситуативно 12%, дизлайк 6%");
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
