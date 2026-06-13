import Enemy from './Enemy.js';
import { BOMB, LIEUTENANT, ENEMY_BULLET_SPEED } from '../config/constants.js';

// Real boss fight gating Level 2's chase finale. 3x scale, health bar, two
// phases:
//   Phase 1 (100%-50% HP): alternates a telegraphed melee lunge and a
//   telegraphed pickle-bomb throw, same tells as the original mini-boss
//   but with 2x-buffed numbers.
//   Phase 2 (<=50% HP): drops both attacks for sustained machine-gun bursts
//   — a permanent weapon swap, signaled with a one-time transition beat.
// Defeating him drops The Chief's Rifle pickup and opens the path forward.
export default class Lieutenant extends Enemy {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, 'lieutenant', LIEUTENANT.HP);
    this.setScale(LIEUTENANT.SCALE);
    // Body sized to the scaled sprite footprint (texture is 21x22 px at
    // scale 2 internally -> 42x44; x3 game scale -> 126x132)
    this.body.setSize(this.width * 0.7, this.height * 0.9);

    this.touchDamage = LIEUTENANT.CONTACT_DAMAGE;
    this.arenaLeft = cfg.arenaLeft;
    this.engaged = false;       // dormant until the player enters the arena
    this.nextActionAt = 0;
    this.attackToggle = 0;      // 0 = bullet next, 1 = bomb next
    this.startX = x;
    this.startY = y;
    this.startY = y;

    this.phase = 1;
    this.mgBurstRemaining = 0;
    this.nextMgShotAt = 0;

    this.attachGun('gun_famas');
    this.heldGun.setScale(1.0).setOrigin(0.15, 0.55).setVisible(false); // sized for the 3x boss
  }

  get healthFraction() {
    return Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }

  takeDamage(amount, fromX) {
    if (this.isDead) return;
    const before = this.healthFraction;
    super.takeDamage(amount, fromX);
    if (this.isDead) return;

    this.scene.game.events.emit('lieutenant-health', this.healthFraction);

    // Phase transition at 50% HP
    if (this.phase === 1 && this.healthFraction <= LIEUTENANT.PHASE2_HP_FRACTION) {
      this.enterPhase2();
    }
  }

  enterPhase2() {
    this.phase = 2;
    // Cancel anything queued in phase 1
    this.setVelocityX(0);
    this.clearTint();
    this.setScale(LIEUTENANT.SCALE, LIEUTENANT.SCALE);
    this.lungeEndsAt = 0;
    this.nextActionAt = this.scene.time.now + 900; // beat before MG opens up

    this.scene.game.events.emit('show-toast', 'LIEUTENANT: OPEN FIRE!', '#ff5050');
    this.scene.cameras.main.shake(200, 0.006);
    // Visual tell that he's swapped loadouts
    this.setTintFill(0xff5050);
    this.scene.time.delayedCall(180, () => this.active && this.clearTint());
  }

  update(player, time) {
    if (this.isDead || !this.body) return;
    if (this.engaged && this.heldGun) {
      const ang = Math.atan2(player.y - 8 - (this.y - 10), player.x - this.x);
      this.heldGun.setPosition(this.x + Math.cos(ang) * 50, this.y - 10 + Math.sin(ang) * 50);
      this.heldGun.setRotation(ang);
      this.heldGun.setFlipY(Math.abs(ang) > Math.PI / 2);
      this.heldGun.setVisible(true);
    }

    // Wake up when the player enters the arena
    if (!this.engaged) {
      if (player.x >= this.arenaLeft) {
        this.engaged = true;
        this.nextActionAt = time + 900; // beat to read the room
        this.scene.game.events.emit('show-toast', 'THE LIEUTENANT', '#ff7849');
        this.scene.game.events.emit('lieutenant-engaged', this.healthFraction);
      }
      return;
    }

    if (this.phase === 1) this.updatePhase1(player, time);
    else this.updatePhase2(player, time);
  }

  updatePhase1(player, time) {
    const dir = player.x > this.x ? 1 : -1;
    this.setVelocityX(0);
    this.setFlipX(dir < 0);

    if (time < this.nextActionAt) return;

    if (this.attackToggle === 0) {
      // --- Attack 1: single bullet shot ---
      this.attackToggle = 1;
      this.setTintFill(0xffd0d0); // red flash wind-up like a Goon
      this.nextActionAt = Infinity;

      this.scene.time.delayedCall(220, () => {
        if (!this.active || this.isDead) return;
        this.clearTint();
        const shootDir = this.scene.player.x > this.x ? 1 : -1;
        this.setFlipX(shootDir < 0);
        this.scene.enemyShootAt(
          this.x + shootDir * this.width * 0.32, this.y - this.height * 0.18,
          this.scene.player.x, this.scene.player.y - 8,
          ENEMY_BULLET_SPEED
        );
      });
      this.nextActionAt = time + 1900; // Goon-like cooldown
    } else {
      // --- Attack 2: pickle bomb (same tell as ThrowerGoon) ---
      this.attackToggle = 0;
      this.setTintFill(0xd7ff8a);
      this.scene.time.delayedCall(140, () => {
        if (!this.active || this.isDead) return;
        this.clearTint();
        const g = this.scene.physics.world.gravity.y;
        const airtime = (2 * Math.abs(BOMB.THROW_VY)) / g;
        let vx = (this.scene.player.x - this.x) / airtime;
        vx = Phaser.Math.Clamp(vx, -BOMB.MAX_VX, BOMB.MAX_VX);
        vx += Phaser.Math.FloatBetween(-30, 30);
        this.scene.spawnBomb(this.x, this.y - 40, vx, BOMB.THROW_VY);
      });
      this.nextActionAt = time + LIEUTENANT.BOMB_COOLDOWN_MS;
    }
  }

  updatePhase2(player, time) {
    const dir = player.x > this.x ? 1 : -1;
    this.setVelocityX(0);
    this.setFlipX(dir < 0);

    // Mid-burst: keep firing on the shot interval
    if (this.mgBurstRemaining > 0) {
      if (time >= this.nextMgShotAt) {
        this.mgBurstRemaining--;
        this.nextMgShotAt = time + LIEUTENANT.MG_SHOT_INTERVAL_MS;
        this.fireMgShot(player);
        // Muzzle flash
        this.setTintFill(0xffe066);
        this.scene.time.delayedCall(50, () => this.active && this.clearTint());
        if (this.mgBurstRemaining === 0) {
          this.nextActionAt = time + LIEUTENANT.MG_BURST_COOLDOWN_MS;
        }
      }
      return;
    }

    if (time >= this.nextActionAt) {
      // Start a new burst
      this.mgBurstRemaining = LIEUTENANT.MG_BURST_SHOTS;
      this.nextMgShotAt = time;
    }
  }

  fireMgShot(player) {
    const dir = player.x > this.x ? 1 : -1;
    const muzzleX = this.x + dir * this.width * 0.32;
    const muzzleY = this.y - this.height * 0.18;

    const spread = Phaser.Math.DegToRad(
      Phaser.Math.FloatBetween(-LIEUTENANT.MG_SPREAD_DEG, LIEUTENANT.MG_SPREAD_DEG)
    );
    const baseAngle = Phaser.Math.Angle.Between(muzzleX, muzzleY, player.x, player.y - 8);
    const angle = baseAngle + spread;
    const tx = muzzleX + Math.cos(angle) * 800;
    const ty = muzzleY + Math.sin(angle) * 800;

    this.scene.enemyShootAt(muzzleX, muzzleY, tx, ty, LIEUTENANT.MG_BULLET_SPEED);
  }

  // If the player dies mid-fight, put the Lieutenant back at his mark so the
  // retry starts clean (he keeps damage taken and phase — forgiving game).
  resetAfterPlayerDeath() {
    if (!this.active || !this.body) return; // safety: never touch a dead body
    this.setPosition(this.startX, this.startY);
    this.setVelocity(0, 0);
    this.clearTint();
    this.setScale(LIEUTENANT.SCALE, LIEUTENANT.SCALE);
    this.engaged = false;
    this.nextActionAt = 0;
    this.mgBurstRemaining = 0;
    // Full health + phase regen — the fight restarts clean from the checkpoint
    this.hp = this.maxHp;
    this.phase = 1;
    if (this.heldGun) this.heldGun.setVisible(false);
    this.scene.game.events.emit('lieutenant-health', 1);
    this.scene.game.events.emit('boss-bar-hide'); // bar reappears when re-engaged
  }

  die() {
    if (this.isDead) return;
    this.scene.onLieutenantDefeated();
    this.scene.game.events.emit('lieutenant-defeated');

    // Death tween adapted for the 3x scale (override base's scaleY-only tween
    // so the boss doesn't end up squashed-and-tiny mid-fade)
    this.isDead = true;
    this.body.enable = false;
    if (this.heldGun) this.heldGun.destroy();
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: LIEUTENANT.SCALE * 1.15,
      scaleY: LIEUTENANT.SCALE * 0.15,
      y: this.y + 30,
      duration: 320,
      onComplete: () => this.destroy(),
    });
  }
}
