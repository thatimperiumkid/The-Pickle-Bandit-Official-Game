// Weapon escalation table. One entry per tier; every level's reward weapon is
// strictly better than the last. Levels 2-5: just append stronger entries here.

export const WEAPONS = [
  {
    tier: 1,
    id: 'pistol',
    name: 'Standard-Issue Pistol',
    damage: 1,
    fireRateMs: 420,
    projectileSpeed: 620,
    spread: 0,          // degrees of random spread
    bulletsPerShot: 1,
    ammo: Infinity,
  },
  {
    tier: 2,
    id: 'magnum',
    name: "Lt.'s Magnum",   // Level 1 reward
    damage: 2,
    fireRateMs: 300,
    projectileSpeed: 800,
    spread: 0,
    bulletsPerShot: 1,
    ammo: Infinity,
  },
  {
    tier: 3,
    id: 'carbine',
    name: "The Chief's Rifle",   // drops only after defeating the Lieutenant
    damage: 2.5,
    fireRateMs: 270,
    projectileSpeed: 900,
    spread: 0,
    bulletsPerShot: 1,
    ammo: Infinity,
  },
  {
    tier: 4,
    id: 'shotgun',
    name: "Johnny's Shotgun",    // Level 3 reward (platforming detour)
    damage: 2.6,                 // per pellet; 5 pellets = 13.0 point-blank (2nd buff)
    fireRateMs: 240,
    projectileSpeed: 700,
    spread: 9,                   // narrowed from 16 — tighter ~18 degree fan
    bulletsPerShot: 5,
    ammo: Infinity,
  },
  // { tier: 5, ... }  <- Level 4 reward goes here
];

export function weaponByTier(tier) {
  return WEAPONS.find((w) => w.tier === tier) || WEAPONS[0];
}
