#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const constantsUrl = 'https://api.opendota.com/api/constants';
const imageBaseUrl = 'https://cdn.cloudflare.steamstatic.com';
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function imageUrl(relativePath) {
    return `${imageBaseUrl}${relativePath.split('?')[0]}`;
}

async function fetchConstants(name) {
    const response = await fetch(`${constantsUrl}/${name}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`GET ${constantsUrl}/${name} → ${response.status}`);
    return response.json();
}

function collectHeroes(raw) {
    return Object.values(raw)
        .map((hero) => ({
            id: hero.name.replace('npc_dota_hero_', ''),
            name: hero.localized_name,
            image: imageUrl(hero.img),
            primaryAttr: hero.primary_attr,
            attackType: hero.attack_type,
            roles: hero.roles ?? [],
        }))
        .sort((first, second) => first.name.localeCompare(second.name, 'en'));
}

const retiredItems = new Set([
    'necronomicon',
    'necronomicon_2',
    'necronomicon_3',
    'pocket_roshan',
    'royale_with_cheese',
    'flying_courier',
    'tango_single',
]);

function itemName(id, dname) {
    const level = id.match(/_(\d)$/)?.[1];
    return level && !dname.endsWith(level) ? `${dname} ${level}` : dname;
}

function collectItems(raw) {
    const items = [];

    for (const [id, item] of Object.entries(raw)) {
        if (!item.dname || id.startsWith('recipe_')) continue;
        if (retiredItems.has(id) || id.endsWith('_roshan')) continue;

        const isNeutral = typeof item.tier === 'number';
        const cost = item.cost ?? 0;
        if (!isNeutral && cost <= 0) continue;

        const category = isNeutral
            ? 'neutral'
            : String(item.qual ?? '').startsWith('consumable')
              ? 'consumable'
              : item.components || /_\d$/.test(id)
                ? 'upgrade'
                : 'basic';

        items.push({
            id,
            name: itemName(id, item.dname),
            image: imageUrl(item.img),
            cost,
            category,
            shelf: String(item.qual ?? '').split(';')[0],
            ...(isNeutral ? { tier: item.tier } : {}),
        });
    }

    return items.sort((first, second) => first.name.localeCompare(second.name, 'en'));
}

function literal(value, quote) {
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return `[${value.map((entry) => literal(entry, quote)).join(', ')}]`;
    const escaped = String(value).replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), `\\${quote}`);
    return `${quote}${escaped}${quote}`;
}

function renderRecords(records, { indent, quote }) {
    return records
        .map((record) => {
            const fields = Object.entries(record).map(([key, value]) => `${key}: ${literal(value, quote)}`);
            return `${indent}{ ${fields.join(', ')} },`;
        })
        .join('\n');
}

function renderBackendHeroes(heroes) {
    return `export type HeroAttribute = 'str' | 'agi' | 'int' | 'all';

export type HeroAttackType = 'Melee' | 'Ranged';

export type Hero = {
    id: string;
    name: string;
    image: string;
    primaryAttr: HeroAttribute;
    attackType: HeroAttackType;
    roles: string[];
};

export const HEROES: Hero[] = [
${renderRecords(heroes, { indent: '    ', quote: "'" })}
];
`;
}

function renderBackendItems(items) {
    return `export type ItemCategory = 'basic' | 'upgrade' | 'consumable' | 'neutral';

export type Item = {
    id: string;
    name: string;
    image: string;
    cost: number;
    category: ItemCategory;
    shelf: string;
    tier?: number;
};

export const ITEMS: Item[] = [
${renderRecords(items, { indent: '    ', quote: "'" })}
];
`;
}

function renderFrontendItems(items) {
    return `export type ItemCategory = "basic" | "upgrade" | "consumable" | "neutral";

export type ItemShelf = "component" | "common" | "rare" | "epic" | "artifact" | "secret_shop" | "consumable" | "";

export type DotaItem = {
  id: string;
  name: string;
  image: string;
  cost: number;
  category: ItemCategory;
  shelf: ItemShelf;
  tier?: number;
};

export const itemImageBase = ${literal(`${imageBaseUrl}/apps/dota2/images/dota_react/items`, '"')};

export const dotaItems: DotaItem[] = [
${renderRecords(items, { indent: '  ', quote: '"' })}
];
`;
}

async function write(relativePath, contents) {
    const target = path.join(repositoryRoot, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
    console.log(`${relativePath} ← ${contents.split('\n').length} lines`);
}

const [rawHeroes, rawItems] = await Promise.all([fetchConstants('heroes'), fetchConstants('items')]);
const heroes = collectHeroes(rawHeroes);
const items = collectItems(rawItems);

if (heroes.length < 100) throw new Error(`Only ${heroes.length} heroes came back — refusing to write a truncated catalog.`);
if (items.length < 150) throw new Error(`Only ${items.length} items came back — refusing to write a truncated catalog.`);

await write('apps/backend/src/heroes/heroes.data.ts', renderBackendHeroes(heroes));
await write('apps/backend/src/items/items.data.ts', renderBackendItems(items));
await write('apps/frontend/app/_lib/dota-items.ts', renderFrontendItems(items));

console.log(`${heroes.length} heroes, ${items.length} items.`);
