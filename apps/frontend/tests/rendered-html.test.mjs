import assert from "node:assert/strict";
import test from "node:test";

import { itemImageBase } from "../app/_lib/dota-items.ts";
import { heroImageBase } from "../app/_lib/dota-cdn.ts";

function commentList(html) {
  return html.match(/<ol id="comment-list-[^"]*"[\s\S]*?<\/ol>/)?.[0] ?? "";
}

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

async function renderWith(handler) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/heroes") || url.includes("/builds")) return handler(url);
    return realFetch(input, init);
  };

  try {
    return await render();
  } finally {
    globalThis.fetch = realFetch;
  }
}

function renderOffline() {
  return renderWith(() => {
    throw new TypeError("fetch failed");
  });
}

test("server-renders the BuildVerdict homepage", async () => {
  const response = await renderOffline();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const html = await response.text();
  assert.match(html, /<html lang="ru" data-theme="dark">/i);
  assert.match(html, /<title>BuildVerdict — оцени билды Dota 2<\/title>/i);
  assert.doesNotMatch(html, /Поиск билдов и героев/);
  assert.doesNotMatch(html, /Добавить билд/);
  assert.doesNotMatch(html, /class="delete-build/);
  assert.match(html, /href="\/profile" class="profile-button"/);
  assert.doesNotMatch(html, /signin-with-chatgpt/);
  assert.doesNotMatch(html, /type="password"|Продолжить с Google/);
  assert.match(html, /Anti-Mage/);
  assert.match(html, /Случайный билд/);
  assert.match(html, /Все билды/);
  assert.doesNotMatch(html, /Как тебе эта сборка|Оценить билд|Спасибо за голос/);
  assert.match(html, /Следующий билд/);
  // История навигации пуста на первой сборке, поэтому «назад» отключено.
  assert.match(html, /class="prev-build-button" type="button" disabled=""/);
  assert.match(html, /Предыдущий билд/);
  assert.doesNotMatch(html, /Написать комментарий/);
  assert.match(html, /placeholder="Что думаете об этой сборке\?"/);
  assert.match(html, /3 комментария</);
  assert.match(html, /class="comment-item"/);
  assert.match(html, /Каю на антимаге/);
  assert.equal((html.match(/class="comment-item"/g) ?? []).length, 3);
  assert.match(commentList(html), /Муншард последним предметом/);
  assert.doesNotMatch(html, /Показать все|Свернуть|comments-toggle|comments-more/);
  assert.ok(html.indexOf('class="comment-composer"') < html.indexOf('class="comment-list"'));
  assert.doesNotMatch(html, />(?:27|34|38|41|56) комментариев</);
  assert.match(html, /Ситуативно/);
  assert.match(html, /alt="Bloodstone"/);
  assert.match(html, /aria-label="За 82%"/);
  assert.match(html, /aria-label="Ситуативно 12%"/);
  assert.match(html, /aria-label="Против 6%"/);
  assert.doesNotMatch(html, /Комментарий автора|Комментарий под билдом/);
  assert.match(html, /aria-label="Включить светлую тему"/);
  assert.match(html, /class="theme-icon"/);
  assert.doesNotMatch(html, /☀|☾/);
  assert.doesNotMatch(html, /Максимизируем фарм|3000–7000/);
  assert.doesNotMatch(html, /Рейтинг|рейтингов|Точный рейтинг/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders one random build with three vote actions", async () => {
  const response = await renderOffline();
  const html = await response.text();
  assert.equal((html.match(/class="random-card dota-stage"/g) ?? []).length, 1);
  assert.match(html, /class="hero-viewer loading"/);
  assert.doesNotMatch(html, /hero-model-poster/);
  assert.doesNotMatch(html, /\/assets\/heroes\/renders\/antimage\.webp/);
  assert.doesNotMatch(html, /Включить 3D/);
  assert.match(html, /Загружаем 3D-модель/);
  assert.match(html, /class="dota-inventory-grid"/);
  assert.doesNotMatch(html, /class="brand"|class="hero-nameplate"/);
  assert.equal((html.match(/class="rating-button /g) ?? []).length, 3);
  assert.equal((html.match(/class="vote-bar"/g) ?? []).length, 0);
  assert.match(html, /<h1 class="dota-build-title">Антимаг без антимагии<\/h1>/);
  assert.equal((html.match(/class="inventory-slot main"/g) ?? []).length, 6);
  assert.equal((html.match(/class="inventory-slot backpack/g) ?? []).length, 3);
  assert.match(html, /class="inventory-slot neutral"/);
  assert.match(html, /class="inventory-slot shard"/);
  assert.match(html, /class="inventory-slot scepter empty"/);
  assert.ok(html.indexOf('inventory-slot scepter') < html.indexOf('class="inventory-main"'));
  assert.ok(html.indexOf('class="inventory-main"') < html.indexOf('inventory-slot neutral'));
  assert.match(html, /alt="Conjurer&#x27;s Catalyst"/);
});

const apiHeroes = [
  { id: "pudge", name: "Pudge", image: "/assets/heroes/pudge.png" },
  { id: "leshrac", name: "Leshrac", image: "/assets/heroes/leshrac.png" },
];

const apiBuilds = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Мясной таран",
    heroId: "pudge",
    items: ["blade_mail", "heart"],
    author: "HookMaster",
    authorId: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-01-05T12:00:00.000Z",
    votes: { positive: 3, situational: 0, negative: 1 },
    commentCount: 1,
    authorReputation: 3,
  },
];

async function renderWithApi(heroes = apiHeroes, builds = apiBuilds) {
  const response = await renderWith((url) =>
    Response.json(
      url.includes("/heroes")
        ? heroes
        : { items: builds, total: builds.length, page: 1, pageSize: 12 },
    ),
  );
  return response.text();
}

test("renders the build the API returned, not the seeded demo one", async () => {
  const html = await renderWithApi();
  assert.match(html, /Мясной таран/);
  assert.match(html, /<h2>Pudge<\/h2>/);
  assert.doesNotMatch(html, /Антимаг без антимагии/);
  assert.match(html, /alt="Blade Mail"/);
  assert.match(html, /<strong title="Репутация: 3">HookMaster<\/strong>/);
});

test("derives the tally, verdict, reputation and dates the API does not store", async () => {
  const html = await renderWithApi();
  assert.match(html, /aria-label="За 75%"/);
  assert.match(html, /aria-label="Ситуативно 0%"/);
  assert.match(html, /aria-label="Против 25%"/);
  assert.match(html, /title="Репутация: 3"/);
  assert.match(html, /1 комментарий</);
});

test("survives an API with no builds published yet", async () => {
  const html = await renderWithApi(apiHeroes, []);
  assert.match(html, /Билдов с такими фильтрами пока нет/);
  assert.doesNotMatch(html, /Антимаг без антимагии/);
  assert.doesNotMatch(html, /class="random-card dota-stage"/);
});

test("CSP пропускает CDN, с которого каталог грузит иконки", async () => {
  const response = await renderOffline();
  const policy = response.headers.get("content-security-policy") ?? "";
  const imgSrc = policy.split(";").map((part) => part.trim()).find((part) => part.startsWith("img-src"));

  assert.ok(imgSrc, "в CSP нет директивы img-src");
  for (const base of [itemImageBase, heroImageBase]) {
    assert.ok(
      imgSrc.includes(new URL(base).origin),
      `img-src не пропускает ${new URL(base).origin}`,
    );
  }
});
