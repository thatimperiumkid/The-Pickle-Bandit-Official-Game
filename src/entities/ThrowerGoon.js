import Enemy from './Enemy.js';
import { THROWER, BOMB } from '../config/constants.js';

// Stays put and lobs pickle bombs in an arc at Johnny.
// Teaches the player to read arcs and dodge-roll out of blast circles.
export default class ThrowerGoon extends Enemy {
  constructor(scene, x, y, hpOverride) {
    super(scene, x, y, 'throwerGoon', hpOverride !== undefined ? hpOverride : THROWER.HP);
    this.touchDamage = 1;
    this.nextThrowAt = 0;
  }

  update(player, time) {
    if (this.isDead || !this.body) return;
    this.setVelocityX(0);
    const dx = player.x - this.x;
    this.setFlipX(dx < 0);

    if (Math.abs(dx) < THROWER.RANGE && time >= this.nextThrowAt) {
      this.nextThrowAt = time + THROWER.THROW_COOLDOWN_MS;
      this.throwBombAt(player);
    }
  }

  throwBombAt(player) {
    // Solve for the horizontal velocity that lands the bomb near the player,
    // given a fixed launch vy and gravity. Slightly fuzzed so it's dodgeable.
    const g = this.scene.physics.world.gravity.y;
    const vy = BOMB.THROW_VY;
    const airtime = (2 * Math.abs(vy)) / g; // up-and-down to same height
    let vx = (player.x - this.x) / airtime;
    vx = Phaser.Math.Clamp(vx, -BOMB.MAX_VX, BOMB.MAX_VX);
    vx += Phaser.Math.FloatBetween(-30, 30);

    // Wind-up tell so the throw is readable
    this.setTintFill(0xd7ff8a);
    this.scene.time.delayedCall(140, () => this.active && this.clearTint());

    this.scene.spawnBomb(this.x, this.y - 24, vx, vy);
  }
}
