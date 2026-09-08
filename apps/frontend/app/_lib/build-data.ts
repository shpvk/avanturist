import { isoDay } from "./api-mapping";
import { dotaItems, itemImageBase, type DotaItem } from "./dota-items";
import { createId } from "./id";
import type { Build, HeroOption, Vote } from "./types";

const seedBuilds: Array<Omit<Build, "heroId" | "createdAt" | "commentCount">> = [
  {
    id: "anti-mage-mana-pressure", hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", title: "Anti-Mage without the anti-magic",
    role: "Carry", roleClass: "carry",
    items: ["bloodstone", "kaya", "yasha_and_kaya", "arcane_blink", "butterfly", "moon_shard", "aghanims_shard", "conjurers_catalyst"],
    author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", reputation: "1 245", votes: [82, 12, 6], date: "20 May 2024", dateTime: "2024-05-20",
    comments: [
      { id: "am-c1", author: "MidOrFeed", avatar: "/assets/heroes/leshrac.png", date: "20 May", text: "I never took Kaya on Anti-Mage seriously, but with Bloodstone the mana genuinely never runs out. It works in long games." },
      { id: "am-c2", author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", date: "21 May", text: "Falls apart instantly against a pure-damage carry. Only worth it if the enemy line-up is all physical." },
      { id: "am-c3", author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", date: "22 May", text: "Moon Shard as the last item is mandatory, otherwise the damage falls off after minute 35." },
    ],
  },
  {
    id: "phantom-assassin-critical", hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", title: "Armour instead of evasion",
    role: "Carry", roleClass: "carry",
    items: ["blade_mail", "heart", "bloodstone", "pipe", "overwhelming_blink", "lotus_orb", "ultimate_scepter", "aghanims_shard", "cloak_of_flames"],
    author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", reputation: "980", votes: [76, 16, 8], date: "19 May 2024", dateTime: "2024-05-19",
    comments: [
      { id: "pa-c1", author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", date: "19 May", text: "A tanky PA sounds like trolling, but Blade Mail plus Blur really does send half the damage back. Weirdly effective." },
      { id: "pa-c2", author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", date: "20 May", text: "It needs at least one damage item, otherwise there is nothing for the crit to multiply." },
    ],
  },
  {
    id: "pudge-tank", hero: "Pudge", heroImage: "/assets/heroes/pudge.png", title: "Pudge built on attack speed",
    role: "Offlane", roleClass: "offlane",
    items: ["manta", "butterfly", "moon_shard", "greater_crit", "satanic", "overwhelming_blink", "aghanims_shard", "fallen_sky"],
    author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", reputation: "2 310", votes: [69, 20, 11], date: "18 May 2024", dateTime: "2024-05-18",
    comments: [
      { id: "pudge-c1", author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", date: "18 May", text: "Manta on Pudge is pure fun — the illusions pull creeps while you go looking for a hook." },
      { id: "pudge-c2", author: "MidOrFeed", avatar: "/assets/heroes/leshrac.png", date: "19 May", text: "Satanic is mandatory, otherwise you die before the attack speed ever matters." },
      { id: "pudge-c3", author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", date: "19 May", text: "Played three games — it worked twice and I fed all game once. Situational." },
    ],
  },
  {
    id: "shadow-shaman-push", hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", title: "Right-click Shadow Shaman",
    role: "Support", roleClass: "support",
    items: ["mask_of_madness", "desolator", "manta", "butterfly", "greater_crit", "arcane_blink", "ultimate_scepter", "defiant_shell"],
    author: "TotemPower", avatar: "/assets/heroes/shadow_shaman.png", reputation: "760", votes: [74, 18, 8], date: "17 May 2024", dateTime: "2024-05-17",
    comments: [
      { id: "ss-c1", author: "d3str0yer", avatar: "/assets/heroes/bloodseeker.png", date: "17 May", text: "A right-click Shaman looks absurd, but Mask of Madness and Desolator turn him into a carry by minute 20." },
      { id: "ss-c2", author: "SilentStep", avatar: "/assets/heroes/community-avatar.webp", date: "18 May", text: "You need a second support on the team, otherwise there will be no wards on the map at all." },
    ],
  },
  {
    id: "leshrac-zones", hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", title: "Physical Leshrac",
    role: "Mid", roleClass: "mid",
    items: ["invis_sword", "greater_crit", "butterfly", "moon_shard", "satanic", "overwhelming_blink"],
    author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", reputation: "1 530", votes: [46, 34, 20], date: "16 May 2024", dateTime: "2024-05-16",
    comments: [
      { id: "lesh-c1", author: "HookMaster", avatar: "/assets/heroes/spirit_breaker.png", date: "16 May", text: "Physical Leshrac only works until the enemy buys armour. After that it hurts." },
      { id: "lesh-c2", author: "ArcWardenX", avatar: "/assets/heroes/enigma.png", date: "17 May", text: "Shadow Blade for the initiation is great, but I would swap Butterfly for something with raw damage." },
    ],
  },
];

export const demoBuilds: Build[] = seedBuilds.map((build) => ({
  ...build,
  heroId: heroSlug(build.heroImage),
  commentCount: build.comments.length,
  createdAt: `${build.dateTime}T12:00:00.000Z`,
}));

const seedHeroes: Array<Omit<HeroOption, "id">> = [
  { hero: "Anti-Mage", heroImage: "/assets/heroes/antimage.png", role: "Carry", roleClass: "carry" },
  { hero: "Phantom Assassin", heroImage: "/assets/heroes/phantom_assassin.png", role: "Carry", roleClass: "carry" },
  { hero: "Pudge", heroImage: "/assets/heroes/pudge.png", role: "Offlane", roleClass: "offlane" },
  { hero: "Shadow Shaman", heroImage: "/assets/heroes/shadow_shaman.png", role: "Support", roleClass: "support" },
  { hero: "Leshrac", heroImage: "/assets/heroes/leshrac.png", role: "Mid", roleClass: "mid" },
];

export const demoHeroes: HeroOption[] = seedHeroes.map((hero) => ({ ...hero, id: heroSlug(hero.heroImage) }));

const itemsById = new Map(dotaItems.map((item) => [item.id, item]));

export const itemOptions: DotaItem[] = dotaItems;


export const voteOptions: Array<{ value: Vote; icon: string; label: string; hint: string }> = [
  { value: "positive", icon: "👍", label: "Like", hint: "The build is good" },
  { value: "situational", icon: "◐", label: "Situational", hint: "It will not always fit" },
  { value: "negative", icon: "👎", label: "Dislike", hint: "The build does not work" },
];

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
    author: "You",
    avatar: "/assets/heroes/community-avatar.webp",
    reputation: "0",
    votes: [0, 0, 0],
    commentCount: 0,
    comments: [],
    date: "today",
    dateTime: isoDay(now),
    createdAt: now.toISOString(),
  };
}

export function itemLabel(item: string): string {
  return itemsById.get(item)?.name ?? item.replaceAll("_", " ");
}

export function itemImage(item: string): string {
  return itemsById.get(item)?.image ?? `${itemImageBase}/${item}.png`;
}

export function heroSlug(heroImage: string): string {
  const fileName = heroImage.split("/").at(-1) ?? "";
  return fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "") || "antimage";
}
