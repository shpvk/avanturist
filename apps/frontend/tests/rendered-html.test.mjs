import assert from "node:assert/strict";
import test from "node:test";

import { itemImageBase } from "../app/_lib/dota-items.ts";
import { heroImageBase } from "../app/_lib/dota-cdn.ts";
import { apiBaseUrl } from "../app/_lib/api-base.ts";

function commentList(html) {
  return html.match(/<ol id="comment-list-[^"]*"[\s\S]*?<\/ol>/)?.[0] ?? "";
}

async function render(path = "/app") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function renderWith(handler, path = "/app") {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/heroes") || url.includes("/builds") || url.includes("/users/")) return handler(url);
    return realFetch(input, init);
  };

  try {
    return await render(path);
  } finally {
    globalThis.fetch = realFetch;
  }
}

function renderOffline() {
  return renderWith(() => {
    throw new TypeError("fetch failed");
  });
}

test("server-renders the BuildVerdict app screen", async () => {
  const response = await renderOffline();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const html = await response.text();
  assert.match(html, /<html lang="en"/i);
  assert.doesNotMatch(html, /data-theme|buildverdict-theme/);
  assert.match(html, /<title>build verdict<\/title>/i);
  assert.doesNotMatch(html, /Hero or build name/);
  assert.doesNotMatch(html, /Add build/);
  assert.doesNotMatch(html, /class="delete-build/);
  assert.match(html, /href="\/profile" class="profile-button"/);
  assert.doesNotMatch(html, /signin-with-chatgpt/);
  assert.doesNotMatch(html, /type="password"|Continue with Google/);
  assert.match(html, /Anti-Mage/);
  assert.match(html, /Random build/);
  assert.match(html, /All builds/);
  assert.doesNotMatch(html, /How do you like this build|Rate the build|Thanks for voting/);
  assert.match(html, /Next build/);
  assert.match(html, /class="prev-build-button" type="button" disabled=""/);
  assert.match(html, /Previous build/);
  assert.doesNotMatch(html, /Write a comment/);
  assert.match(html, /placeholder="What do you make of this build\?"/);
  assert.match(html, /3 comments</);
  assert.match(html, /class="comment-item"/);
  assert.match(html, /I never took Kaya on Anti-Mage/);
  assert.equal((html.match(/class="comment-item"/g) ?? []).length, 3);
  assert.match(commentList(html), /Moon Shard as the last item/);
  assert.doesNotMatch(html, /Show all|Collapse|comments-toggle|comments-more/);
  assert.ok(html.indexOf('class="comment-composer"') < html.indexOf('class="comment-list"'));
  assert.doesNotMatch(html, />(?:27|34|38|41|56) comments</);
  assert.match(html, /Situational/);
  assert.match(html, /alt="Bloodstone"/);
  assert.match(html, /aria-label="Like 82%"/);
  assert.match(html, /aria-label="Situational 12%"/);
  assert.match(html, /aria-label="Dislike 6%"/);
  assert.doesNotMatch(html, /Author comment|Comment under the build/);
  assert.doesNotMatch(html, /class="theme-(toggle|icon)"/);
  assert.doesNotMatch(html, /☀|☾/);
  assert.doesNotMatch(html, /Maximise the farm|3000–7000/);
  assert.doesNotMatch(html, /\bRating\b|Exact rating/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders one random build with three vote actions", async () => {
  const response = await renderOffline();
  const html = await response.text();
  assert.equal((html.match(/class="random-card dota-stage"/g) ?? []).length, 1);
  assert.match(html, /class="hero-viewer loading"/);
  assert.doesNotMatch(html, /hero-model-poster/);
  assert.doesNotMatch(html, /\/assets\/heroes\/renders\/antimage\.webp/);
  assert.doesNotMatch(html, /Enable 3D/);
  assert.match(html, /Loading the 3D model/);
  assert.match(html, /class="dota-inventory-grid"/);
  assert.doesNotMatch(html, /class="brand"|class="hero-nameplate"/);
  assert.equal((html.match(/class="rating-button /g) ?? []).length, 3);
  assert.equal((html.match(/class="vote-bar"/g) ?? []).length, 0);
  assert.match(html, /<h1 class="dota-build-title">Anti-Mage without the anti-magic<\/h1>/);
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
    title: "Meat battering ram",
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
  assert.match(html, /Meat battering ram/);
  assert.match(html, /<h2>Pudge<\/h2>/);
  assert.doesNotMatch(html, /Anti-Mage without the anti-magic/);
  assert.match(html, /alt="Blade Mail"/);
  assert.match(html, /<strong><a href="\/users\/22222222-2222-4222-8222-222222222222"[^>]*>HookMaster<\/a><\/strong>/);
});

test("derives the tally and dates the API does not store", async () => {
  const html = await renderWithApi();
  assert.match(html, /aria-label="Like 75%"/);
  assert.match(html, /aria-label="Situational 0%"/);
  assert.match(html, /aria-label="Dislike 25%"/);
  assert.match(html, /1 comment</);
});

test("renders the author page with the builds of that author", async () => {
  const authorId = "22222222-2222-4222-8222-222222222222";
  const response = await renderWith(
    (url) =>
      Response.json(
        url.includes("/heroes")
          ? apiHeroes
          : url.includes(`/users/${authorId}`)
            ? { id: authorId, displayName: "HookMaster", picture: null, role: "REGULAR", createdAt: "2025-11-02T10:00:00.000Z", buildCount: 1 }
            : { items: apiBuilds, total: apiBuilds.length, page: 1, pageSize: 12 },
      ),
    `/users/${authorId}`,
  );

  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<h1 class="author-name">HookMaster<\/h1>/);
  assert.match(html, /class="author-meta">1 build/);
  assert.doesNotMatch(html, /member since/);
  assert.match(html, /aria-label="Sort order"/);
  assert.match(html, /Meat battering ram/);
});

test("survives an API with no builds published yet", async () => {
  const html = await renderWithApi(apiHeroes, []);
  assert.match(html, /No builds match these filters yet/);
  assert.doesNotMatch(html, /Anti-Mage without the anti-magic/);
  assert.doesNotMatch(html, /class="random-card dota-stage"/);
});

test("the CSP allows the CDN the item catalog loads icons from", async () => {
  const response = await renderOffline();
  const policy = response.headers.get("content-security-policy") ?? "";
  const imgSrc = policy.split(";").map((part) => part.trim()).find((part) => part.startsWith("img-src"));

  assert.ok(imgSrc, "the CSP has no img-src directive");
  for (const base of [itemImageBase, heroImageBase]) {
    assert.ok(
      imgSrc.includes(new URL(base).origin),
      `img-src does not allow ${new URL(base).origin}`,
    );
  }
});

test("the CSP allows avatars served by the backend", async () => {
  const response = await renderOffline();
  const policy = response.headers.get("content-security-policy") ?? "";
  const imgSrc = policy.split(";").map((part) => part.trim()).find((part) => part.startsWith("img-src"));

  const apiOrigin = new URL(apiBaseUrl).origin;

  assert.ok(imgSrc?.includes(apiOrigin), `img-src does not allow ${apiOrigin}`);
});

test("the CSP lets the hero models decompress their meshes", async () => {
  const response = await renderOffline();
  const policy = response.headers.get("content-security-policy") ?? "";
  const scriptSrc = policy.split(";").map((part) => part.trim()).find((part) => part.startsWith("script-src"));

  assert.ok(scriptSrc, "the CSP has no script-src directive");
  assert.ok(
    scriptSrc.includes("'wasm-unsafe-eval'"),
    "script-src blocks the WebAssembly meshopt decoder the hero models are compressed with",
  );
});

test("serves the landing page at the site root", async () => {
  const response = await renderWith(() => Response.json({ items: [], total: 0, page: 1, pageSize: 6 }), "/");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<html lang="en"/i);
  assert.match(html, /Builds that look wrong/);
  assert.match(html, /We rank ideas, not winrates\./);
  assert.match(html, /not affiliated with, endorsed by or sponsored by Valve Corporation/);
  assert.match(html, /href="\/app"/);
  for (const anchor of ["premise", "how", "rules", "faq"]) {
    assert.match(html, new RegExp(`id="${anchor}"`), `the landing has no #${anchor} section`);
  }
});

test("the landing omits the feed section instead of showing demo builds", async () => {
  const response = await renderWith(() => {
    throw new TypeError("fetch failed");
  }, "/");

  const html = await response.text();
  assert.doesNotMatch(html, /id="feed"/);
  assert.doesNotMatch(html, /class="build-card"/);
  assert.doesNotMatch(html, /Anti-Mage without the anti-magic/);
});

test("the landing keeps its content readable without client JavaScript", async () => {
  const response = await renderWith(() => Response.json({ items: [], total: 0, page: 1, pageSize: 6 }), "/");
  const html = await response.text();

  assert.doesNotMatch(html, /class="[^"]*\breveal\b[^"]*"[^>]*style="[^"]*opacity/);
  assert.doesNotMatch(html, /reveal-active/);
  assert.doesNotMatch(html, /opacity:\s*0/);
  assert.match(html, /We rank ideas, not winrates/);
});

test("the loading curtain stays out of the way until a script arms it", async () => {
  const response = await renderWith(() => Response.json({ items: [], total: 0, page: 1, pageSize: 6 }), "/");
  const html = await response.text();

  assert.match(html, /class="intro"/);
  assert.doesNotMatch(html, /<html[^>]*class="[^"]*intro-armed/);
});
