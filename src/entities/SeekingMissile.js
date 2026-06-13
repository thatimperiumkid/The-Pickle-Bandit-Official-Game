import { BOSS } from '../config/constants.js';

// Stage 1's homing pickle missile. Launches at Johnny, then continuously
// steers toward his CURRENT position at a deliberately low turn rate: commit
// to a lateral dodge early and it overshoots; hesitate and it clips you.
// Detonates on player hit, terrain hit, or timeout — small telegraphed blast.
export default class SeekingMissile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'missile');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
    this.body.setAllowGravity(false);
    this.body.setSize(this.width * 0.8, this.height * 0.8);
    this.exploded = false;
    this.diesAt = scene.time.now + BOSS.MISSILE_LIFETIME_MS;

    // Initial heading: straight at Johnny
    const p = scene.player;
    const ang = Phaser.Math.Angle.Between(x, y, p.x, p.y - 8);
    this.setVelocity(Math.cos(ang) * BOSS.MISSILE_SPEED, Math.sin(ang) * BOSS.MISSILE_SPEED);
    this.setRotation(ang);

    // Exhaust sputter so it reads as a projectile, not a drifting pickle
    this.puffEvent = scene.time.addEvent({
      delay: 120, loop: true,
      callback: () => {
        if (!this.active) return;
        const puff = scene.add
          .circle(this.x - Math.cos(this.rotation) * 14, this.y - Math.sin(this.rotation) * 14,
            4, 0xaad46a, 0.6)
          .setDepth(5);
        scene.tweens.add({
          targets: puff, radius: 9, alpha: 0, duration: 300,
          onComplete: () => puff.destroy(),
        });
      },
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.exploded) return;
    if (time >= this.diesAt) return this.explode();

    const p = this.scene.player;
    const current = Math.atan2(this.body.velocity.y, this.body.velocity.x);
    const desired = Phaser.Math.Angle.Between(this.x, this.y, p.x, p.y - 8);
    // Steer toward Johnny, clamped to the turn rate
    const maxTurn = BOSS.MISSILE_TURN_RATE * (delta / 1000);
    const next = Phaser.Math.Angle.RotateTo(current, desired, maxTurn);
    this.setVelocity(Math.cos(next) * BOSS.MISSILE_SPEED, Math.sin(next) * BOSS.MISSILE_SPEED);
    this.setRotation(next);
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    this.puffEvent.remove(false);

    const scene = this.scene;
    const { x, y } = this;
    // Telegraphed blast circle, same family as PickleBomb's
    const blast = scene.add.circle(x, y, 12, 0xd7ff8a, 0.75).setDepth(7);
    scene.tweens.add({
      targets: blast, radius: BOSS.MISSILE_BLAST_RADIUS, alpha: 0, duration: 260,
      onComplete: () => blast.destroy(),
    });
    scene.cameras.main.shake(110, 0.004);

    const p = scene.player;
    if (Phaser.Math.Distance.Between(x, y, p.x, p.y) <= BOSS.MISSILE_BLAST_RADIUS + 12) {
      p.takeDamage(BOSS.MISSILE_DAMAGE, x);
    }
    this.destroy();
  }
}
