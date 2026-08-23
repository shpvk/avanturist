import type { RoleClass } from "./types";

type Role = { role: string; roleClass: RoleClass };

const roleLabels: Record<RoleClass, string> = {
  carry: "Керри",
  mid: "Мид",
  offlane: "Оффлейн",
  support: "Саппорт",
};

/**
 * Positions for the role badge. The API's hero catalog (apps/backend/src/heroes) carries
 * only id, name and image, so the usual lane for each hero lives here on the front end.
 */
const heroLanes: Record<string, RoleClass> = {
  antimage: "carry",
  bloodseeker: "carry",
  enigma: "offlane",
  leshrac: "mid",
  phantom_assassin: "carry",
  pudge: "offlane",
  shadow_shaman: "support",
  spectre: "carry",
  spirit_breaker: "offlane",
};

const fallbackLane: RoleClass = "carry";

export function heroRole(heroId: string): Role {
  const roleClass = heroLanes[heroId] ?? fallbackLane;
  return { role: roleLabels[roleClass], roleClass };
}
