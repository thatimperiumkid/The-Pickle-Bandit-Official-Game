import { ABILITY_TUNING } from '../config/abilities.js';

// Tracks which abilities the player has selected across the run and how many
// times (for stacking). Selections live in the Phaser game registry so they
// survive scene transitions between levels.
//
// Usage: `const abilities = new AbilitySystem(game);` then query derived stats.
const REGISTRY_KEY = 'abilityCounts';

export default class AbilitySystem {
  constructor(game) {
    this.game = game;
    if (!game.registry.has(REGISTRY_KEY)) {
      game.registry.set(REGISTRY_KEY, {});
    }
  }

  get counts() {
    return this.game.registry.get(REGISTRY_KEY) || {};
  }

  selectAbility(id) {
    const counts = { ...this.counts };
    counts[id] = (counts[id] || 0) + 1;
    this.game.registry.set(REGISTRY_KEY, counts);
  }

  has(id) {
    return (this.counts[id] || 0) > 0;
  }

  stacks(id) {
    return this.counts[id] || 0;
  }

  // Wipe everything (called on a fresh run / full restart from Level 1).
  reset() {
    this.game.registry.set(REGISTRY_KEY, {});
  }

  // ---- Derived stats ----------------------------------------------------------
  // Passive: bonus max hearts
  get bonusMaxHearts() {
    return this.stacks('maxheart') * ABILITY_TUNING.maxheart.perStack;
  }

  // Passive: movement speed multiplier (additive stacks: 1 + 0.15*n)
  get moveSpeedMul() {
    return 1 + this.stacks('speed') * ABILITY_TUNING.speed.perStack;
  }

  // Active: scooter charges
  get scooterCharges() {
    return this.has('scooter')
      ? ABILITY_TUNING.scooter.baseCharges + (this.stacks('scooter') - 1)
      : 0;
  }

  // Active: mini-bomb cooldown (each stack multiplies down)
  get miniBombCooldownMs() {
    const t = ABILITY_TUNING.minibomb;
    return t.baseCooldownMs * Math.pow(t.cooldownMulPerStack, this.stacks('minibomb') - 1);
  }

  // Active: dash-strike damage
  get dashStrikeDamage() {
    const t = ABILITY_TUNING.dashstrike;
    return t.baseDamage + (this.stacks('dashstrike') - 1) * t.damagePerStack;
  }

  // Active: suppressing fire cooldown + burst
  get suppressCooldownMs() {
    const t = ABILITY_TUNING.suppress;
    return t.baseCooldownMs * Math.pow(t.cooldownMulPerStack, this.stacks('suppress') - 1);
  }
  get suppressBurstMs() { return ABILITY_TUNING.suppress.burstMs; }
  get suppressFireRateMul() { return ABILITY_TUNING.suppress.fireRateMul; }

  // Active: decoy duration + cooldown
  get decoyDurationMs() {
    const t = ABILITY_TUNING.decoy;
    return t.durationMs + (this.stacks('decoy') - 1) * t.durationPerStackMs;
  }
  get decoyCooldownMs() { return ABILITY_TUNING.decoy.baseCooldownMs; }

  // Active: ground slam radius + damage
  get groundSlamRadius() {
    const t = ABILITY_TUNING.groundslam;
    return t.baseRadius + (this.stacks('groundslam') - 1) * t.radiusPerStack;
  }
  get groundSlamDamage() {
    const t = ABILITY_TUNING.groundslam;
    return t.baseDamage + (this.stacks('groundslam') - 1) * t.damagePerStack;
  }
  get groundSlamFallBoost() { return ABILITY_TUNING.groundslam.fallBoost; }
}
