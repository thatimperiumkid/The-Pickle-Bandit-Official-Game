import Enemy from './Enemy.js';
import { GOON, ENEMY_BULLET_SPEED } from '../config/constants.js';

// Armed mook. Advances on Johnny, holds at firing distance, and shoots —
// with a visible wind-up flash so every shot is dodgeable.
export default class Goon extends Enemy {
  constructor(scene, x, y, hpOverride) {
    super(scene, x, y, 'goon', hpOverride !== undefined ? hpOverride : GOON.HP);
    this.touchDamage = GOON.TOUCH_DAMAGE;
    this.nextShotAt = 0;
    this.attachGun('gun_pistol');
  }

  update(player, time) {
    if (this.isDead || !this.body) return;
    this.aimGunAt(player.x, player.y - 8);
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const dir = dx > 0 ? 1 : -1;
    this.setFlipX(dir < 0);

    // Mid-range: advance hard, ignore cover if it's in the way (push through/around)
    if (dist < GOON.AGGRO_RANGE && dist > GOON.STOP_RANGE) {
      this.setVelocityX(GOON.SPEED * dir * 1.3); // 30% faster approach
    } else if (dist <= GOON.STOP_RANGE) {
      // Close: hold position but try to strafe-reposition for a clean shot
      // If blocked, push sideways a bit to work around the obstacle
      if (this.body.blocked.left || this.body.blocked.right) {
        const strafeDir = this.body.blocked.left ? 1 : -1;
        this.setVelocityX(GOON.SPEED * strafeDir * 0.6); // sidestep around cover
      } else {
        this.setVelocityX(0);
      }
    } else {
      this.setVelocityX(0);
    }

    // Shoot when in range, same height, AND clear line of sight
    const sameHeight = Math.abs(player.y - this.y) < 60;
    if (dist < GOON.SHOOT_RANGE && sameHeight && time >= this.nextShotAt) {
      if (!this.scene.hasLineOfSight(this.x, this.y - 4, player.x, player.y - 8)) return;
      this.nextShotAt = time + GOON.SHOOT_COOLDOWN_MS;
      // Wind-up tell, then fire if still alive
      this.setTintFill(0xffd0d0);
      this.scene.time.delayedCall(GOON.SHOT_WINDUP_MS, () => {
        if (!this.active || this.isDead) return;
        this.clearTint();
        const muzzleDir = player.x > this.x ? 1 : -1;
        this.setFlipX(muzzleDir < 0);
        this.scene.enemyShootAt(
          this.x + muzzleDir * 22, this.y - 4,
          player.x, player.y - 8,
          ENEMY_BULLET_SPEED
        );
      });
    }
  }
}
