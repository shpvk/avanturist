import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the BuildVerdict homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>BuildVerdict — билды Dota 2<\/title>/i);
  assert.match(html, /Поиск билдов и героев/);
  assert.match(html, /Добавить билд/);
  assert.match(html, /Anti-Mage/);
  assert.match(html, /Phantom Assassin/);
  assert.match(html, /Shadow Shaman/);
  assert.match(html, /Распределение голосов/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders five complete build cards", async () => {
  const response = await render();
  const html = await response.text();
  assert.equal((html.match(/class="build-card"/g) ?? []).length, 5);
  assert.equal((html.match(/class="vote-bar"/g) ?? []).length, 5);
  assert.equal((html.match(/class="author-section"/g) ?? []).length, 5);
});
