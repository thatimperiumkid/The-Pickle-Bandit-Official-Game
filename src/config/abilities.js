// The 8-ability pool offered after Levels 1-4 (3 random cards, pick 1).
// Six actives (input-gated, only respond once selected) and two passives
// (derived-stat modifiers). Repeat picks stack per the `stack` notes.
//
// Key bindings (documented in README too):
//   Revenge Scooter ...... G
//   Mini Pickle Bomb ..... F
//   Decoy Pickle ......... C   (F is taken by Mini Bomb, so Decoy uses C)
//   Suppressing Fire ..... hold + release the shoot button (Z / left-click)
//   Dash Strike .......... no key (modifies the existing dodge-roll)
//   Ground Slam .......... S (or Down) while airborne
export const ABILITIES = [
  {
    id: 'scooter', name: 'Revenge Scooter', type: 'active', key: 'G',
    desc: 'Throw a scooter that rams forward, then self-drives. Huge damage. 1 charge — retrieve it to reuse. (+1 charge per repeat.)',
  },
  {
    id: 'minibomb', name: 'Mini Pickle Bomb', type: 'active', key: 'F',
    desc: 'Lob a pickle bomb in your facing direction. ~3.5s cooldown. (-25% cooldown per repeat.)',
  },
  {
    id: 'dashstrike', name: 'Dash Strike', type: 'active', key: 'dodge',
    desc: 'Your dodge-roll deals damage to enemies you pass through. (+damage per repeat.)',
  },
  {
    id: 'suppress', name: 'Suppressing Fire', type: 'active', key: 'hold-shoot',
    desc: 'Hold and release fire to unleash a 1.5s burst at 2x fire rate. ~5.5s cooldown. (-cooldown per repeat.)',
  },
  {
    id: 'decoy', name: 'Decoy Pickle', type: 'active', key: 'C',
    desc: 'Drop a fake Johnny that pulls nearby enemy aggro for 3s. ~8s cooldown. (+duration per repeat.)',
  },
  {
    id: 'groundslam', name: 'Ground Slam', type: 'active', key: 'S (airborne)',
    desc: 'Slam down while airborne for an AoE hit + knockback on landing. (+radius/damage per repeat.)',
  },
  {
    id: 'maxheart', name: '+1 Max Heart', type: 'passive', key: '-',
    desc: 'Raises max hearts by 1 and heals 1 now. Stacks freely.',
  },
  {
    id: 'speed', name: 'Movement Speed +15%', type: 'passive', key: '-',
    desc: 'Move 15% faster. Stacks additively. (Also speeds up the chase in Levels 3-4.)',
  },
];

export const ABILITY_BY_ID = Object.fromEntries(ABILITIES.map((a) => [a.id, a]));

// Tunables for each active, with repeat-stack math baked into the derived
// getters in AbilitySystem.
export const ABILITY_TUNING = {
  scooter:    { baseCharges: 1 },
  minibomb:   { baseCooldownMs: 3500, cooldownMulPerStack: 0.75 },
  dashstrike: { baseDamage: 3, damagePerStack: 2 },
  suppress:   { baseCooldownMs: 5500, burstMs: 1500, fireRateMul: 0.5,
                cooldownMulPerStack: 0.8 },
  decoy:      { baseCooldownMs: 8000, durationMs: 3000, durationPerStackMs: 800 },
  groundslam: { baseRadius: 110, radiusPerStack: 30, baseDamage: 4, damagePerStack: 2,
                fallBoost: 900 },
  maxheart:   { perStack: 1 },
  speed:      { perStack: 0.15 },
};
