import type { RoleClass } from "./types";

type Role = { role: string; roleClass: RoleClass };

const roleLabels: Record<RoleClass, string> = {
  carry: "Керри",
  mid: "Мид",
  offlane: "Оффлейн",
  support: "Саппорт",
};

/**
 * The lane each hero is usually played in. The API's catalog (apps/backend/src/heroes) comes
 * from OpenDota, which tags heroes by what they do — "Carry", "Nuker", "Durable" — and never
 * by lane, so the lane itself is curated here. Heroes plenty of teams play in two positions
 * are filed under the more common one; the badge is a hint, not a rule.
 */
const lanesByRole: Record<RoleClass, string[]> = {
  carry: [
    "alchemist", "antimage", "arc_warden", "bloodseeker", "chaos_knight", "clinkz", "drow_ranger", "faceless_void",
    "gyrocopter", "juggernaut", "kez", "life_stealer", "lone_druid", "luna", "medusa", "monkey_king", "morphling",
    "muerta", "naga_siren", "phantom_assassin", "phantom_lancer", "riki", "skeleton_king", "slark", "sniper",
    "spectre", "sven", "terrorblade", "troll_warlord", "ursa", "weaver",
  ],
  mid: [
    "death_prophet", "dragon_knight", "ember_spirit", "huskar", "invoker", "kunkka", "leshrac", "lina", "meepo",
    "necrolyte", "nevermore", "obsidian_destroyer", "puck", "pugna", "queenofpain", "razor", "storm_spirit",
    "templar_assassin", "tinker", "tiny", "viper", "void_spirit", "zuus",
  ],
  offlane: [
    "abaddon", "axe", "batrider", "beastmaster", "brewmaster", "bristleback", "broodmother", "centaur", "dark_seer",
    "dawnbreaker", "doom_bringer", "elder_titan", "enigma", "furion", "legion_commander", "lycan", "magnataur",
    "mars", "night_stalker", "pangolier", "primal_beast", "pudge", "rattletrap", "sand_king", "shredder", "slardar",
    "spirit_breaker", "tidehunter", "abyssal_underlord",
  ],
  support: [
    "ancient_apparition", "bane", "bounty_hunter", "chen", "crystal_maiden", "dark_willow", "dazzle", "disruptor",
    "earth_spirit", "earthshaker", "enchantress", "grimstroke", "hoodwink", "jakiro", "keeper_of_the_light", "lich",
    "lion", "marci", "mirana", "nyx_assassin", "ogre_magi", "omniknight", "oracle", "phoenix", "ringmaster",
    "rubick", "shadow_demon", "shadow_shaman", "silencer", "skywrath_mage", "snapfire", "techies", "treant", "tusk",
    "undying", "vengefulspirit", "venomancer", "visage", "warlock", "windrunner", "winter_wyvern", "witch_doctor",
    "wisp",
  ],
};

const heroLanes = new Map<string, RoleClass>(
  Object.entries(lanesByRole).flatMap(([lane, heroes]) => heroes.map((hero) => [hero, lane as RoleClass] as const)),
);

/**
 * A hero the map has not caught up with yet — one straight out of a patch — falls back to
 * OpenDota's own tags, which list the hero's most significant role first.
 */
const lanesByTag: Record<string, RoleClass> = {
  Carry: "carry",
  Nuker: "mid",
  Escape: "mid",
  Disabler: "mid",
  Initiator: "offlane",
  Durable: "offlane",
  Pusher: "offlane",
  Jungler: "offlane",
  Support: "support",
};

const fallbackLane: RoleClass = "carry";

export function heroRole(heroId: string, roles: string[] = []): Role {
  const roleClass = heroLanes.get(heroId) ?? lanesByTag[roles[0] ?? ""] ?? fallbackLane;
  return { role: roleLabels[roleClass], roleClass };
}
