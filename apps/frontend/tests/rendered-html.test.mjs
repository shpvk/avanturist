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
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const html = await response.text();
  assert.match(html, /<html lang="ru" data-theme="dark">/i);
  assert.match(html, /<title>BuildVerdict — оцени билды Dota 2<\/title>/i);
  assert.doesNotMatch(html, /Поиск билдов и героев/);
  assert.match(html, /Добавить билд/);
  assert.match(html, /href="\/signin-with-chatgpt\?return_to=%2F"/);
  assert.doesNotMatch(html, /type="password"|Продолжить с Google/);
  assert.match(html, /Anti-Mage/);
  assert.match(html, /Случайный билд/);
  assert.match(html, /Все билды/);
  assert.doesNotMatch(html, /Как тебе эта сборка/);
  assert.match(html, /Написать комментарий/);
  assert.match(html, />0 комментариев</);
  assert.doesNotMatch(html, />(?:27|34|38|41|56) комментариев</);
  assert.match(html, /Ситуативно/);
  assert.match(html, /alt="Bloodstone"/);
  assert.match(html, /aria-label="Лайк 82%, ситуативно 12%, дизлайк 6%"/);
  assert.doesNotMatch(html, /Комментарий автора|Комментарий под билдом/);
  assert.match(html, /aria-label="Включить светлую тему"/);
  assert.match(html, /class="theme-icon"/);
  assert.doesNotMatch(html, /☀|☾/);
  assert.doesNotMatch(html, /Максимизируем фарм|3000–7000/);
  assert.doesNotMatch(html, /Рейтинг|рейтингов|Точный рейтинг/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders one random build with three vote actions", async () => {
  const response = await render();
  const html = await response.text();
  assert.equal((html.match(/class="random-card dota-stage"/g) ?? []).length, 1);
  assert.match(html, /class="hero-viewer loading"/);
  assert.match(html, /\/assets\/heroes\/renders\/antimage\.webp/);
  assert.doesNotMatch(html, /Включить 3D/);
  assert.match(html, /Загружаем 3D-модель/);
  assert.match(html, /class="item-row inventory"/);
  assert.doesNotMatch(html, /class="brand"|class="hero-nameplate"/);
  assert.equal((html.match(/class="rating-button /g) ?? []).length, 3);
  assert.equal((html.match(/class="vote-bar"/g) ?? []).length, 1);
});
