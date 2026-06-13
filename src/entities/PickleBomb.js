import { BOMB } from '../config/constants.js';

// The franchise's signature hazard. Arcs through the air, lands, blinks,
// then detonates with a clearly telegraphed blast circle. Player deaths to
// bombs should always feel avoidable: long fuse, loud blink, visible radius.
export default class PickleBomb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'pickleBomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setBounce(0.25);
    this.setDepth(5);
    this.armed = false;
    this.exploded = false;
    this.fuseEvent = null;
    this.blinkTween = null;
    this.spin = Phaser.Math.FloatBetween(-220, 220);
    this.hitsTaken = 0;
    this.defused = false;
  }

  // Called when a player or enemy bullet hits the bomb. After
  // BOMB.HITS_TO_DEFUSE hits it fizzles out harmlessly instead of detonating.
  takeHit() {
    if (this.exploded || this.defused) return;
    this.hitsTaken++;

    // Visible feedback per hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.active && this.clearTint());

    if (this.hitsTaken >= BOMB.HITS_TO_DEFUSE) this.defuse();
  }

  defuse() {
    if (this.exploded || this.defused) return;
    this.defused = true;
    if (this.fuseEvent) this.fuseEvent.remove(false);
    if (this.blinkTween) this.blinkTween.stop();

    // Fizzle: little puff of smoke, no blast, no damage
    const scene = this.scene;
    const { x, y } = this;
    const puff = scene.add.circle(x, y, 14, 0xaaaaaa, 0.5).setDepth(6);
    scene.tweens.add({
      targets: puff, radius: 30, alpha: 0, duration: 280,
      onComplete: () => puff.destroy(),
    });
    this.destroy();
  }

  // vx/vy launch velocity; gravity does the arc
  launch(vx, vy) {
    this.setVelocity(vx, vy);
  }

  // Called by the scene when the bomb touches the ground
  arm() {
    if (this.armed || this.exploded) return;
    this.armed = true;
    this.setVelocityX(this.body.velocity.x * 0.3); // skid a little, then sit

    this.fuseEvent = this.scene.time.delayedCall(BOMB.FUSE_MS, () => this.explode());

    // Blink warning in the last stretch of the fuse
    this.scene.time.delayedCall(Math.max(0, BOMB.FUSE_MS - BOMB.BLINK_MS), () => {
      if (this.exploded || !this.active) return;
      this.blinkTween = this.scene.tweens.add({
        targets: this,
        alpha: 0.25,
        duration: 70,
        yoyo: true,
        repeat: -1,
      });
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(80, () => this.active && this.clearTint());
    });
  }

  explode() {
    if (this.exploded || !this.active) return;
    this.exploded = true;
    if (this.blinkTween) this.blinkTween.stop();

    const { x, y } = this;
    const scene = this.scene;

    // Blast visual: expanding ring + flash
    const blast = scene.add.circle(x, y, BOMB.BLAST_RADIUS, 0x9be564, 0.45).setDepth(6);
    const ring = scene.add.circle(x, y, 18, 0xffffff, 0).setDepth(7);
    ring.setStrokeStyle(5, 0xd7ff8a, 1);
    scene.tweens.add({
      targets: ring, radius: BOMB.BLAST_RADIUS, alpha: { from: 1, to: 0 },
      duration: 260, onComplete: () => ring.destroy(),
    });
    scene.tweens.add({
      targets: blast, alpha: 0, duration: 320, onComplete: () => blast.destroy(),
    });
    scene.cameras.main.shake(120, 0.004);

    // AoE damage check — the scene knows who's vulnerable
    scene.onBombExploded(x, y, BOMB.BLAST_RADIUS, BOMB.DAMAGE);

    this.destroy();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.armed) this.rotation += (this.spin * delta) / 1000;
    // Fell into a rooftop gap / off-world: clean up quietly
    if (this.y > this.scene.physics.world.bounds.height + 80) this.destroy();
  }

  destroy(fromScene) {
    if (this.fuseEvent) this.fuseEvent.remove(false);
    if (this.blinkTween) this.blinkTween.stop();
    super.destroy(fromScene);
  }
}
