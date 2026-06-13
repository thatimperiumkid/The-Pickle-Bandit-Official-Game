// Pooled bullet. Used by the player (texture 'bullet') and enemies
// (texture 'enemyBullet') — owner is set at fire time.
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    this.damage = 1;
    this.owner = 'player';
  }

  fire(x, y, dir, speed, damage, angleRad = 0, owner = 'player') {
    this.owner = owner;
    this.damage = damage;
    this.setTexture(owner === 'player' ? 'bullet' : 'enemyBullet');
    this.enableBody(true, x, y, true, true);
    this.body.setAllowGravity(false);
    this.setVelocity(
      Math.cos(angleRad) * speed * dir,
      Math.sin(angleRad) * speed
    );
    this.setFlipX(dir < 0);
    this.lifespan = 1600;
  }

  // Aimed shot: fires toward a world point. Works for player and enemies.
  fireAt(x, y, tx, ty, speed, damage, owner = 'enemy') {
    this.owner = owner;
    this.damage = damage;
    this.setTexture(owner === 'player' ? 'bullet' : 'enemyBullet');
    this.enableBody(true, x, y, true, true);
    this.body.setAllowGravity(false);
    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setRotation(angle);
    this.lifespan = 2200;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.lifespan -= delta;
    if (this.lifespan <= 0) this.kill();
  }

  kill() {
    this.disableBody(true, true);
  }
}
