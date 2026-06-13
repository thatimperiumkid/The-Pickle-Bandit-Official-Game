// Global tuning knobs. Touch these, not the entity code, when balancing.

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;

export const GRAVITY = 1500;

export const PLAYER = {
  SPEED: 270,
  JUMP_VELOCITY: 640,
  MAX_HEARTS: 5,
  IFRAMES_MS: 1200,        // forgiving: long invulnerability after a hit
  KNOCKBACK_X: 240,
  KNOCKBACK_Y: -260,
  DODGE_SPEED: 560,
  DODGE_MS: 320,           // dodge-roll duration (invulnerable for all of it)
  DODGE_COOLDOWN_MS: 750,
};

export const GOON = {
  HP: 4,                   // baseline
  SPEED: 95,
  AGGRO_RANGE: 460,
  TOUCH_DAMAGE: 1,
  SHOOT_RANGE: 420,
  STOP_RANGE: 190,
  SHOOT_COOLDOWN_MS: 1900,
  SHOT_WINDUP_MS: 220,
};

export const GOON_L1 = {
  HP: 2,                   // 50% (nerfed for Level 1 ease)
  SPEED: 95,
  AGGRO_RANGE: 460,
  TOUCH_DAMAGE: 1,
  SHOOT_RANGE: 420,
  STOP_RANGE: 190,
  SHOOT_COOLDOWN_MS: 1900,
  SHOT_WINDUP_MS: 220,
};

export const GOON_L2 = {
  HP: 8,                   // 2x (buffed for Level 2 challenge)
  SPEED: 95,
  AGGRO_RANGE: 460,
  TOUCH_DAMAGE: 1,
  SHOOT_RANGE: 420,
  STOP_RANGE: 190,
  SHOOT_COOLDOWN_MS: 1900,
  SHOT_WINDUP_MS: 220,
};

export const THROWER = {
  HP: 4,
  RANGE: 560,
  THROW_COOLDOWN_MS: 1600,
};

export const THROWER_L1 = {
  HP: 2,                   // 50% (nerfed for Level 1)
  RANGE: 560,
  THROW_COOLDOWN_MS: 1600,
};

export const THROWER_L2 = {
  HP: 8,                   // 2x (buffed for Level 2)
  RANGE: 560,
  THROW_COOLDOWN_MS: 1600,
};

export const BOMB = {
  FUSE_MS: 950,            // time on the ground before detonation
  BLINK_MS: 450,           // blink warning window before boom
  BLAST_RADIUS: 95,
  THROW_VY: -560,          // launch vertical velocity (gravity makes the arc)
  DAMAGE: 1,
  MAX_VX: 420,
  HITS_TO_DEFUSE: 2,       // shoot a bomb twice (any weapon) to disable it
};

export const BANDIT = {
  TAUNT_MS: 2000,
  FLEE_SPEED: 225,         // slightly slower than the player, so you gain on him
  THROW_COOLDOWN_MS: 2300,
  SHOOT_COOLDOWN_MS: 3600,
  ESCAPE_SPEED: 700,       // scripted blast-off at the end

  // Level 3 pursuit mode: pace-anchored to Johnny at a fixed offset
  PURSUIT_LERP: 0.07,           // smoothing toward the anchor point
  PURSUIT_BOMB_COOLDOWN_MS: 1500,
  PURSUIT_SHOT_MIN_MS: 4000,    // revolver shot every 4-6s
  PURSUIT_SHOT_MAX_MS: 6000,
  PURSUIT_AIM_FLASH_MS: 300,    // telegraph before the single shot
};

export const MARKSMAN = {
  HP: 10,                  // 2.5x base Goon (4)
  RANGE: 980,              // ~1 screen width
  AIM_WINDUP_MS: 300,      // aim flash telegraph
  BURST_SHOTS: 3,
  BURST_INTERVAL_MS: 100,
  BURST_COOLDOWN_MS: 2000, // after the burst completes
  BULLET_SPEED: 560,
};

// The Lieutenant is now a real two-phase boss fight: 3x sprite scale,
// health bar, phase transition at 50% HP into a machine-gun phase.
// Base stats are 2x the original mini-boss numbers per the buff pass.
export const LIEUTENANT = {
  HP: Math.round(GOON.HP * 4 * 2 * 1.5),  // 4x goon x2 buff x1.5 = 48 (was 32)
  SCALE: 3,                    // 3x sprite size
  CONTACT_DAMAGE: 1,

  // Phase 1: lunge + bomb, alternating (each cooldown 2x the old mini-boss)
  LUNGE_TELEGRAPH_MS: 500,
  LUNGE_SPEED: 190 * 2,        // 2x buffed
  LUNGE_DURATION_MS: 530,
  LUNGE_RECOVERY_MS: 1000,
  BOMB_COOLDOWN_MS: 1500,

  // Phase 2 (<=50% HP): drops bombs/lunge for sustained machine-gun fire
  PHASE2_HP_FRACTION: 0.5,
  MG_BURST_SHOTS: 8,
  MG_SHOT_INTERVAL_MS: 110,
  MG_BURST_COOLDOWN_MS: 1100,  // pause between bursts
  MG_BULLET_SPEED: 560,
  MG_SPREAD_DEG: 6,            // slight inaccuracy so it's dodgeable
};

// Level 5 final boss: the Pickle Bandit at 5x scale, two stages.
export const BOSS = {
  SCALE: 5,
  CONTACT_DAMAGE: 2,           // body-touch rule, both stages

  STAGE1_HP: 120,
  STAGE1_COOLDOWN_MS: 2600,    // between attack picks
  BURST1_SHOTS: 5,
  BURST_INTERVAL_MS: 100,
  BURST_TELEGRAPH_MS: 350,
  BURST_BULLET_SPEED: 540,

  MISSILE_SPEED: 300,
  MISSILE_TURN_RATE: 1.7,      // rad/s — committed lateral dodges beat it
  MISSILE_LIFETIME_MS: 6500,
  MISSILE_BLAST_RADIUS: 85,
  MISSILE_DAMAGE: 1,

  TRIPLE_BOMB_OFFSETS: [40, 170, 330], // close / medium / far from Johnny

  TRANSITION_MS: 1800,         // stage 1 down -> stage 2 bar up

  STAGE2_HP: 150,
  STAGE2_COOLDOWN_MS: 2300,
  BURST2_SHOTS: 10,

  SLUDGE_SPREAD_MS: 800,       // telegraph: sludge visibly spreading
  SLUDGE_DURATION_MS: 5000,
  SLUDGE_TICK_MS: 800,         // 1 heart per tick while grounded on the floor
  SLUDGE_DAMAGE: 1,

  JUMP_CROUCH_MS: 500,         // readable wind-up before the leap
  JUMP_AIR_MS: 600,
  MELEE_WINDUP_MS: 450,
  MELEE_RANGE: 150,            // from boss center; move or eat 2 hearts
  MELEE_DAMAGE: 2,
  RETURN_MS: 900,              // walk back to his mark after the punish

  ADDS_GOONS: 3,
  ADDS_MARKSMEN: 2,
  ADDS_CAP: 4,                 // never more than this many alive at once
};

export const ENEMY_BULLET_SPEED = 520;
