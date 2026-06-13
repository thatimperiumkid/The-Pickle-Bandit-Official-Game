// Base class for all enemies: hp, hit flash, knockback, death pop.
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, hp) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.hp = hp;
    this.maxHp = hp;
    this.isDead = false;
    this.heldGun = null;
  }

  // Opt-in: gun-wielding enemies call this to show a weapon at their hands.
  attachGun(tex = 'gun_pistol') {
    this.heldGun = this.scene.add.image(this.x, this.y, tex)
      .setDepth(this.depth + 1).setOrigin(0.15, 0.55).setScale(0.65);
    return this;
  }

  // Aim the held gun at a target (called from subclass update)
  aimGunAt(tx, ty) {
    if (!this.heldGun) return;
    if (this.isDead) { this.heldGun.setVisible(false); return; }
    const ang = Math.atan2(ty - (this.y - 2), tx - this.x);
    this.heldGun.setPosition(this.x + Math.cos(ang) * 12, this.y - 2 + Math.sin(ang) * 12);
    this.heldGun.setRotation(ang);
    this.heldGun.setFlipY(Math.abs(ang) > Math.PI / 2);
    this.heldGun.setVisible(true);
  }

  takeDamage(amount, fromX = this.x) {
    if (this.isDead) return;
    this.hp -= amount;

    // Hit feedback: flash white + tiny knockback
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.active && this.clearTint());
    const dir = this.x >= fromX ? 1 : -1;
    this.setVelocityX(120 * dir);

    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.body.enable = false;
    if (this.heldGun) this.heldGun.destroy();
    // Chance to drop a heart pickup (scene decides)
    if (this.scene.maybeDropHeart) this.scene.maybeDropHeart(this.x, this.y);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.2,
      y: this.y + 16,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}
