// The Revenge Scooter. A small kids' scooter, thrown with the fury of a
// grieving partner. Played completely straight.
//
// Lifecycle: thrown (arcs with gravity, big damage on Bandit contact)
//   -> driving (lands, then drives itself forward for ~1.2s, still damaging)
//   -> resting (a pickup; Johnny must walk back to it to rearm G)
export const SCOOTER = {
  THROW_VX: 520,
  THROW_VY: -260,
  IMPACT_DAMAGE: 15,        // the big swing — way past a full shotgun blast
  DRIVE_SPEED: 340,
  DRIVE_DURATION_MS: 1200,
  DRIVE_TICK_DAMAGE: 4,     // per touch during the drive phase
  DAMAGE_TICK_MS: 350,      // so the drive phase can't melt instantly
};

export default class Scooter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'scooter');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
    this.body.setSize(this.width * 0.9, this.height * 0.8);

    this.state = 'thrown';
    this.dir = dir;
    this.nextDamageAt = 0;
    this.setFlipX(dir < 0);
    this.setVelocity(SCOOTER.THROW_VX * dir, SCOOTER.THROW_VY);
    this.setAngularVelocity(dir * 320); // tumbling through the air
  }

  // Called when it first touches ground: begin the self-driving phase
  land() {
    if (this.state !== 'thrown') return;
    this.state = 'driving';
    this.setAngle(0);
    this.setAngularVelocity(0);
    this.setVelocity(SCOOTER.DRIVE_SPEED * this.dir, 0);
    // Wheel-spin read: quick little bounces as it speeds along
    this.driveTween = this.scene.tweens.add({
      targets: this, y: this.y - 3, duration: 90, yoyo: true, repeat: -1,
    });
    this.scene.time.delayedCall(SCOOTER.DRIVE_DURATION_MS, () => this.rest());
  }

  rest() {
    if (!this.active || this.state === 'resting') return;
    this.state = 'resting';
    if (this.driveTween) this.driveTween.stop();
    this.setVelocityX(0);
    this.setAngle(0);
    // Gentle glow pulse so it reads as "come get me"
    this.scene.tweens.add({
      targets: this, alpha: 0.55, duration: 500, yoyo: true, repeat: -1,
    });
  }

  // Damage check used by the scene's overlap with the Bandit
  hitBandit(bandit, time) {
    if (this.state === 'thrown') {
      bandit.takePursuitDamage(SCOOTER.IMPACT_DAMAGE);
      this.land(); // impact counts as landing; starts the drive
    } else if (this.state === 'driving' && time >= this.nextDamageAt) {
      this.nextDamageAt = time + SCOOTER.DAMAGE_TICK_MS;
      bandit.takePursuitDamage(SCOOTER.DRIVE_TICK_DAMAGE);
    }
    // resting scooters are harmless
  }
}
