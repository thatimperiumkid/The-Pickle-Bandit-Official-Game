import Enemy from './Enemy.js';
import { MARKSMAN } from '../config/constants.js';

// Stationary burst-fire rifleman positioned along the rooftop route, usually
// behind cover. When Johnny is within ~1 screen and line of sight is clear:
// 0.3s aim flash -> 3 quick shots at his position when each shot fires
// (straight bullets, not homing) -> 2s cooldown.
export default class Marksman extends Enemy {
  constructor(scene, x, y, hpOverride) {
    super(scene, x, y, 'marksman', hpOverride !== undefined ? hpOverride : MARKSMAN.HP);
    this.touchDamage = 1;
    this.nextBurstAt = 0;
    this.burstRemaining = 0;
    this.nextShotAt = 0;
    this.attachGun('gun_famas');
  }

  update(player, time) {
    if (this.isDead || !this.body) return;
    this.aimGunAt(player.x, player.y - 8);
    this.setVelocityX(0);

    const dx = player.x - this.x;
    this.setFlipX(dx < 0);

    // Mid-burst: fire on the interval, aiming at Johnny's current position
    if (this.burstRemaining > 0) {
      if (time >= this.nextShotAt) {
        this.burstRemaining--;
        this.nextShotAt = time + MARKSMAN.BURST_INTERVAL_MS;
        const dir = player.x > this.x ? 1 : -1;
        this.scene.enemyShootAt(
          this.x + dir * 24, this.y - 6,
          player.x, player.y - 8,
          MARKSMAN.BULLET_SPEED
        );
        // muzzle blink
        this.setTintFill(0xffe066);
        this.scene.time.delayedCall(45, () => this.active && this.clearTint());
        if (this.burstRemaining === 0) {
          this.nextBurstAt = time + MARKSMAN.BURST_COOLDOWN_MS;
        }
      }
      return;
    }

    if (Math.abs(dx) > MARKSMAN.RANGE || time < this.nextBurstAt) return;
    if (!this.scene.hasLineOfSight(this.x, this.y - 6, player.x, player.y - 8)) return;

    // Telegraph: aim flash, then open the burst
    this.nextBurstAt = Infinity; // locked until burst completes
    this.setTintFill(0xff8a8a);
    this.scene.time.delayedCall(MARKSMAN.AIM_WINDUP_MS, () => {
      if (!this.active || this.isDead) return;
      this.clearTint();
      this.burstRemaining = MARKSMAN.BURST_SHOTS;
      this.nextShotAt = this.scene.time.now;
    });
  }
}
