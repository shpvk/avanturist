import { isoDay } from "./api-mapping";
import { createId } from "./id";
import type { Build, HeroOption, RoleFilter, Vote } from "./types";

/**
 * Offline demo feed. The real content comes from the API (`_lib/api.ts`); these builds
 * only stand in when the backend cannot be reached, so the page is never blank.
 */
const seedBuilds: Array<Omit<Build, "heroId" | "createdAt">> = [
  {
    id: "anti-mage-mana-pressure", hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", title: "Антимаг без антимагии",
    role: "Керри", roleClass: "carry",
    items: ["bloodstone", "kaya", "yasha_and_kaya", "arcane_blink", "butterfly", "moon_shard"],
    author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", reputation: "1 245",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [82, 12, 6], date: "20 мая 2024", dateTime: "2024-05-20",
    comments: [
      { id: "am-c1", author: "MidOrFeed", avatar: "/assets/heroes/leshrac.png", date: "20 мая", text: "Каю на антимаге не воспринимал всерьёз, но с бладстоуном мана правда не кончается. В затяжных играх работает." },
      { id: "am-c2", author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", date: "21 мая", text: "Против керри с чистым уроном разваливается моментально. Только если враг весь физический." },
      { id: "am-c3", author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", date: "22 мая", text: "Муншард последним предметом — обязателен, иначе дпс проседает после 35 минуты." },
    ],
  },
  {
    id: "phantom-assassin-critical", hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", title: "Броня вместо уклонения",
    role: "Керри", roleClass: "carry",
    items: ["blade_mail", "heart", "bloodstone", "pipe", "overwhelming_blink", "lotus_orb"],
    author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", reputation: "980",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [76, 16, 8], date: "19 мая 2024", dateTime: "2024-05-19",
    comments: [
      { id: "pa-c1", author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", date: "19 мая", text: "Танковая ФА звучит как троллинг, но блейдмейл с блюром реально возвращает половину урона. Забавно работает." },
      { id: "pa-c2", author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", date: "20 мая", text: "Не хватает хотя бы одного предмета на урон, иначе крит нечем реализовывать." },
    ],
  },
  {
    id: "pudge-tank", hero: "Pudge", heroImage: "/assets/heroes/pudge.png", title: "Пудж через скорость атаки",
    role: "Оффлейн", roleClass: "offlane",
    items: ["manta", "butterfly", "moon_shard", "daedalus", "satanic", "overwhelming_blink"],
    author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", reputation: "2 310",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [69, 20, 11], date: "18 мая 2024", dateTime: "2024-05-18",
    comments: [
      { id: "pudge-c1", author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", date: "18 мая", text: "Манта на пудже — это чистое веселье, иллюзии тянут крипов, пока ты ищешь крюк." },
      { id: "pudge-c2", author: "MidOrFeed", avatar: "/assets/heroes/leshrac.png", date: "19 мая", text: "Сатаник обязателен, иначе умираешь раньше, чем успеваешь докрутить скорость атаки." },
      { id: "pudge-c3", author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", date: "19 мая", text: "Сыграл три катки — два раза сработало, один раз кормил всю игру. Ситуативно." },
    ],
  },
  {
    id: "shadow-shaman-push", hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", title: "Шаман с руки",
    role: "Саппорт", roleClass: "support",
    items: ["mask_of_madness", "desolator", "manta", "butterfly", "daedalus", "arcane_blink"],
    author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", reputation: "760",
    verdict: "Рекомендуется", verdictType: "recommended", votes: [74, 18, 8], date: "17 мая 2024", dateTime: "2024-05-17",
    comments: [
      { id: "ss-c1", author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", date: "17 мая", text: "Шаман с руки выглядит абсурдно, но маска безумия и десолятор превращают его в керри на 20 минуте." },
      { id: "ss-c2", author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", date: "18 мая", text: "Нужен второй саппорт в команде, иначе вардов на карте не будет вообще." },
    ],
  },
  {
    id: "leshrac-zones", hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", title: "Физический Лешрак",
    role: "Мид", roleClass: "mid",
    items: ["shadow_blade", "daedalus", "butterfly", "moon_shard", "satanic", "overwhelming_blink"],
    author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", reputation: "1 530",
    verdict: "Нейтрально", verdictType: "neutral", votes: [46, 34, 20], date: "16 мая 2024", dateTime: "2024-05-16",
    comments: [
      { id: "lesh-c1", author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", date: "16 мая", text: "Физический Лешрак работает только пока враги не купили армор. Дальше — боль." },
      { id: "lesh-c2", author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", date: "17 мая", text: "Шэдоу блейд для инициации — топ, но бабочку я бы поменял на что-то с уроном." },
    ],
  },
];

export const demoBuilds: Build[] = seedBuilds.map((build) => ({
  ...build,
  heroId: heroSlug(build.heroImage),
  // Seeded builds only carry a day; midday keeps them ordered the way they are written.
  createdAt: `${build.dateTime}T12:00:00.000Z`,
}));

const seedHeroes: Array<Omit<HeroOption, "id">> = [
  { hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", role: "Керри", roleClass: "carry" },
  { hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", role: "Керри", roleClass: "carry" },
  { hero: "Pudge", heroImage: "/assets/heroes/pudge.png", role: "Оффлейн", roleClass: "offlane" },
  { hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", role: "Саппорт", roleClass: "support" },
  { hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", role: "Мид", roleClass: "mid" },
];

export const demoHeroes: HeroOption[] = seedHeroes.map((hero) => ({ ...hero, id: heroSlug(hero.heroImage) }));

export const itemNames: Record<string, string> = {
  aether_lens: "Aether Lens",
  arcane_blink: "Arcane Blink",
  bfury: "Battle Fury",
  blade_mail: "Blade Mail",
  bloodstone: "Bloodstone",
  butterfly: "Butterfly",
  daedalus: "Daedalus",
  desolator: "Desolator",
  heart: "Heart of Tarrasque",
  kaya: "Kaya",
  lotus_orb: "Lotus Orb",
  manta: "Manta Style",
  mask_of_madness: "Mask of Madness",
  monkey_king_bar: "Monkey King Bar",
  moon_shard: "Moon Shard",
  overwhelming_blink: "Overwhelming Blink",
  pipe: "Pipe of Insight",
  power_treads: "Power Treads",
  ring_of_health: "Ring of Health",
  satanic: "Satanic",
  shadow_blade: "Shadow Blade",
  skadi: "Eye of Skadi",
  yasha_and_kaya: "Yasha and Kaya",
};

/** Every item with an icon in /public/assets/items — exactly what the picker can offer. */
export const itemOptions = Object.keys(itemNames);

/** A build can hold no more than a full Dota inventory. */
export const maxItemsPerBuild = 6;

/** Collapsed, the comment list stops here so the composer stays in view. */
export const collapsedCommentCount = 2;

export const roleOptions: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "Все позиции" },
  { value: "carry", label: "Керри" },
  { value: "mid", label: "Мид" },
  { value: "offlane", label: "Оффлейн" },
  { value: "support", label: "Саппорт" },
];

export const voteOptions: Array<{ value: Vote; icon: string; label: string; hint: string }> = [
  { value: "positive", icon: "👍", label: "Лайк", hint: "Билд хороший" },
  { value: "situational", icon: "◐", label: "Ситуативно", hint: "Подойдёт не всегда" },
  { value: "negative", icon: "👎", label: "Дизлайк", hint: "Билд не работает" },
];

/**
 * A build authored in this browser while the API is unreachable: it keeps the demo usable
 * offline and is replaced by the server's build as soon as the request goes through.
 */
export function createLocalBuild(hero: HeroOption, title: string, items: string[], now: Date): Build {
  return {
    id: createId("local"),
    heroId: hero.id,
    hero: hero.hero,
    heroImage: hero.heroImage,
    role: hero.role,
    roleClass: hero.roleClass,
    title,
    items,
    author: "Вы",
    avatar: "/assets/heroes/community-avatar.webp",
    reputation: "0",
    verdict: "Нет оценок",
    verdictType: "neutral",
    votes: [0, 0, 0],
    comments: [],
    date: "сегодня",
    dateTime: isoDay(now),
    createdAt: now.toISOString(),
  };
}

/** Readable item name for alt text and tooltips; unknown ids degrade to their slug. */
export function itemLabel(item: string): string {
  return itemNames[item] ?? item.replaceAll("_", " ");
}

/** Asset slug behind a hero image path: "/assets/heroes/pudge.png" -> "pudge". */
export function heroSlug(heroImage: string): string {
  const fileName = heroImage.split("/").at(-1) ?? "";
  return fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "") || "antimage";
}

