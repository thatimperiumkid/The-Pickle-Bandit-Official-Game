import { weaponByTier } from '../config/weapons.js';

// Owns "what gun does Johnny have and can he fire right now".
// Emits 'weapon-changed' on the game-wide event bus so the UI can react.
export default class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.weapon = null;
    this.lastFiredAt = -Infinity;
    this.suppressMul = 1;
  }

  equipTier(tier) {
    const w = weaponByTier(tier);
    const isUpgrade = !this.weapon || w.tier > this.weapon.tier;
    this.weapon = w;
    this.scene.registry.set('weapon', w);
    this.scene.game.events.emit('weapon-changed', w, isUpgrade);
    return w;
  }

  get name() {
    return this.weapon ? this.weapon.name : '';
  }

  canFire(now) {
    if (!this.weapon) return false;
    let delay = this.weapon.fireRateMs;
    // Shotgun has brutal pump-action delay (1s extra)
    if (this.weapon.id === 'shotgun') delay += 1000;
    // Suppressing Fire temporarily multiplies the delay down (e.g. x0.5 = 2x rate)
    if (this.suppressMul) delay *= this.suppressMul;
    return now - this.lastFiredAt >= delay;
  }

  // dir: -1 left, +1 right. Returns true if a shot happened.
  tryFire(now, x, y, dir, bulletGroup) {
    if (!this.canFire(now)) return false;
    this.lastFiredAt = now;

    const w = this.weapon;
    for (let i = 0; i < w.bulletsPerShot; i++) {
      const bullet = bulletGroup.get(x, y);
      if (!bullet) continue;
      const spreadRad = Phaser.Math.DegToRad(
        Phaser.Math.FloatBetween(-w.spread, w.spread)
      );
      bullet.fire(x, y, dir, w.projectileSpeed, w.damage, spreadRad);
    }
    return true;
  }

  // Cursor-aimed fire: shoots toward (tx, ty) in world space.
  tryFireAt(now, x, y, tx, ty, bulletGroup) {
    if (!this.canFire(now)) return false;
    this.lastFiredAt = now;

    const w = this.weapon;
    for (let i = 0; i < w.bulletsPerShot; i++) {
      const bullet = bulletGroup.get(x, y);
      if (!bullet) continue;
      // Apply spread around the aim angle
      const baseAngle = Phaser.Math.Angle.Between(x, y, tx, ty);
      const spread = Phaser.Math.DegToRad(
        Phaser.Math.FloatBetween(-w.spread, w.spread)
      );
      const angle = baseAngle + spread;
      bullet.fireAt(
        x, y,
        x + Math.cos(angle) * 800,
        y + Math.sin(angle) * 800,
        w.projectileSpeed, w.damage, 'player'
      );
    }
    return true;
  }
}
