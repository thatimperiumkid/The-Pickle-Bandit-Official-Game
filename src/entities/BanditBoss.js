import Bandit from './Bandit.js';
import SeekingMissile from './SeekingMissile.js';
import { BOSS, BOMB } from '../config/constants.js';

// Level 5: The Reckoning. The Pickle Bandit at 5x scale — cornered, wounded,
// and done running. Two stages, each with its own HP pool and attack set,
// picked at random every cooldown cycle.
//
// Stage 1 ("still has tricks"): 5-bullet burst / seeking missile / triple
// tiered pickle bombs.
// Stage 2 ("throwing everything"): 10-bullet burst / floor sludge / the
// jump-behind melee punish / goon-or-marksman adds.
//
// Extends Bandit per the long-standing enterBossMode() promise. He keeps the
// sprite — just five times the man he used to be.
export default class BanditBoss extends Bandit {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.state = 'boss';
    this.setVisible(true);
    this.setScale(BOSS.SCALE);
    this.setFlipX(true); // facing left toward Johnny's side of the arena
    this.setDepth(5);
    this.body.enable = true;
    this.body.setAllowGravity(false);
    // Readable hitbox: close to the visible sprite, no invisible creep
    this.body.setSize(this.width * 0.74, this.height * 0.92);

    this.homeX = x;
    this.homeY = y;

    this.stage = 1;
    this.maxHp = BOSS.STAGE1_HP;
    this.hp = BOSS.STAGE1_HP;
    this.busy = false;        // true while an attack sequence is running
    this.invulnerable = true; // until the fight formally starts
    this.defeated = false;
    this.nextAttackAt = Infinity;
    this.nextAddsAllowedAt = 0;

    if (this.heldGun) this.heldGun.destroy(); // drop the inherited revolver
    this.heldGun = scene.add.image(x, y, 'gun_shotgun').setScale(1.8).setDepth(6).setOrigin(0.15, 0.55);
  }

  startFight() {
    this.invulnerable = false;
    this.nextAttackAt = this.scene.time.now + 1400; // a breath before round 1
    this.scene.game.events.emit('boss-bar-show', { label: 'THE PICKLE BANDIT', fraction: 1 });
  }

  // Unified damage entry — bullets and the scooter both land here.
  // (Named to match what Scooter already calls on the pursuit bandit.)
  takePursuitDamage(amount) {
    if (this.invulnerable || this.defeated) return;
    this.hp = Math.max(0, this.hp - amount);
    this.scene.game.events.emit('boss-bar-health', this.hp / this.maxHp);

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.active && this.clearTint());

    if (this.hp <= 0) {
      if (this.stage === 1) this.beginStageTransition();
      else this.beginDefeat();
    }
  }

  // ---- Stage transition -------------------------------------------------------
  beginStageTransition() {
    this.stage = 1.5; // limbo
    this.invulnerable = true;
    this.busy = true;
    this.nextAttackAt = Infinity;

    // Hit-stagger...
    this.setTintFill(0xff5050);
    this.scene.tweens.add({
      targets: this, angle: 6, duration: 90, yoyo: true, repeat: 3,
      onComplete: () => {
        if (!this.active) return;
        this.setAngle(0);
        // ...then the power-up: pulsing flash + screen shake. He's not done.
        this.scene.cameras.main.shake(BOSS.TRANSITION_MS * 0.6, 0.007);
        this.scene.tweens.add({
          targets: this, scaleX: BOSS.SCALE * 1.06, scaleY: BOSS.SCALE * 1.06,
          duration: 200, yoyo: true, repeat: 3,
        });
        let flashes = 0;
        const flasher = this.scene.time.addEvent({
          delay: 180, repeat: 6,
          callback: () => {
            flashes++;
            if (!this.active) return;
            if (flashes % 2) this.setTintFill(0x9ee87a);
            else this.clearTint();
          },
        });
        this.scene.time.delayedCall(BOSS.TRANSITION_MS, () => {
          flasher.remove(false);
          if (!this.active) return;
          this.clearTint();
          this.setScale(BOSS.SCALE);
          this.enterStage2();
        });
      },
    });
  }

  enterStage2() {
    this.stage = 2;
    this.maxHp = BOSS.STAGE2_HP;
    this.hp = BOSS.STAGE2_HP;
    this.invulnerable = false;
    this.busy = false;
    this.nextAttackAt = this.scene.time.now + 1100;
    this.scene.game.events.emit('boss-bar-show', { label: 'BANDIT \u2014 FINAL FORM', fraction: 1 });
    this.scene.game.events.emit('show-toast', 'STAGE 2', '#9ee87a');
  }

  // ---- Defeat ------------------------------------------------------------------
  beginDefeat() {
    this.defeated = true;
    this.invulnerable = true;
    this.busy = true;
    this.nextAttackAt = Infinity;
    if (this.heldGun) this.heldGun.destroy();
    this.scene.game.events.emit('boss-bar-hide');

    // A beat longer than any regular death — let it land.
    this.setTintFill(0xff5050);
    this.scene.cameras.main.shake(500, 0.008);
    this.scene.tweens.add({
      targets: this, angle: -8, duration: 120, yoyo: true, repeat: 5,
      onComplete: () => {
        if (!this.active) return;
        this.clearTint();
        this.setAngle(0);
        // The collapse: sink, squash, fade
        this.scene.tweens.add({
          targets: this,
          y: this.y + this.displayHeight * 0.3,
          scaleY: BOSS.SCALE * 0.25,
          scaleX: BOSS.SCALE * 1.1,
          alpha: 0,
          duration: 1600,
          ease: 'Quad.easeIn',
          onComplete: () => this.scene.onBossDefeated(),
        });
      },
    });
  }

  // ---- Attack loop ---------------------------------------------------------------
  update(player, time) {
    // Aim the gun whenever he's alive, even mid-attack
    if (this.heldGun && !this.defeated) {
      const ang = Math.atan2(player.y - 8 - (this.y - 20), player.x - this.x);
      this.heldGun.setPosition(this.x + Math.cos(ang) * 70, this.y - 20 + Math.sin(ang) * 70);
      this.heldGun.setRotation(ang);
      this.heldGun.setFlipY(Math.abs(ang) > Math.PI / 2);
      this.setFlipX(player.x > this.x);
    } else if (this.heldGun) {
      this.heldGun.setVisible(false);
    }

    if (this.defeated || this.busy || this.invulnerable) return;
    if (time < this.nextAttackAt) return;

    const cooldown = this.stage === 1 ? BOSS.STAGE1_COOLDOWN_MS : BOSS.STAGE2_COOLDOWN_MS;
    this.nextAttackAt = time + cooldown;

    if (this.stage === 1) {
      const pick = Phaser.Math.Between(0, 2);
      if (pick === 0) this.attackBurst(BOSS.BURST1_SHOTS);
      else if (pick === 1) this.attackMissile();
      else this.attackTripleBomb();
    } else {
      // Adds are rationed: only allowed every so often, and weighted low.
      const canSpawnAdds = time >= (this.nextAddsAllowedAt || 0);
      const roll = Math.random();
      if (roll < 0.34) this.attackBurst(BOSS.BURST2_SHOTS);
      else if (roll < 0.62) this.attackSludge();
      else if (roll < 0.88 || !canSpawnAdds) this.attackJumpBehind();
      else {
        this.nextAddsAllowedAt = time + 14000; // long gap between add waves
        this.attackSpawnAdds();
      }
    }
  }

  muzzle() {
    const dir = this.scene.player.x > this.x ? 1 : -1;
    this.setFlipX(dir > 0); // bandit art faces left by default
    return {
      x: this.x + dir * this.displayWidth * 0.3,
      y: this.y - this.displayHeight * 0.12,
      dir,
    };
  }

  // ---- Shared: N-bullet burst ----------------------------------------------------
  attackBurst(shots) {
    this.busy = true;
    this.setTintFill(0xffd0d0); // aim telegraph
    this.scene.time.delayedCall(BOSS.BURST_TELEGRAPH_MS, () => {
      if (!this.active || this.defeated) return (this.busy = false);
      this.clearTint();
      let fired = 0;
      const burst = this.scene.time.addEvent({
        delay: BOSS.BURST_INTERVAL_MS, repeat: shots - 1, startAt: BOSS.BURST_INTERVAL_MS,
        callback: () => {
          fired++;
          if (!this.active || this.defeated) return burst.remove(false);
          const m = this.muzzle();
          const p = this.scene.player;
          this.setTintFill(0xffe066);
          this.scene.time.delayedCall(40, () => this.active && this.clearTint());
          this.scene.enemyShootAt(m.x, m.y, p.x, p.y - 8, BOSS.BURST_BULLET_SPEED);
          if (fired >= shots) this.busy = false;
        },
      });
    });
  }

  // ---- Stage 1: seeking missile ----------------------------------------------------
  attackMissile() {
    this.busy = true;
    this.setTintFill(0x9ee87a);
    this.scene.time.delayedCall(300, () => {
      this.busy = false;
      if (!this.active || this.defeated) return;
      this.clearTint();
      const m = this.muzzle();
      const missile = new SeekingMissile(this.scene, m.x, m.y - 20);
      this.scene.missiles.push(missile);
      this.scene.registerMissile(missile);
    });
  }

  // ---- Stage 1: triple tiered bombs ---------------------------------------------
  attackTripleBomb() {
    this.busy = true;
    this.setTintFill(0xd7ff8a);
    this.scene.time.delayedCall(250, () => {
      this.busy = false;
      if (!this.active || this.defeated) return;
      this.clearTint();
      const p = this.scene.player;
      const g = this.scene.physics.world.gravity.y;
      const airtime = (2 * Math.abs(BOMB.THROW_VY)) / g;
      const w = this.scene.cfg.worldWidth;

      BOSS.TRIPLE_BOMB_OFFSETS.forEach((dist, i) => {
        // One close, one medium, one far — random side each, clamped in-arena
        const side = Phaser.Math.RND.pick([-1, 1]);
        const target = Phaser.Math.Clamp(p.x + side * dist, 60, w - 60);
        let vx = (target - this.x) / airtime;
        vx = Phaser.Math.Clamp(vx, -BOMB.MAX_VX, BOMB.MAX_VX);
        // Slight stagger so the three arcs read as a volley, not a blob
        this.scene.time.delayedCall(i * 120, () => {
          if (!this.active || this.defeated) return;
          this.scene.spawnBomb(this.x, this.y - this.displayHeight * 0.3, vx, BOMB.THROW_VY);
        });
      });
    });
  }

  // ---- Stage 2: floor sludge -------------------------------------------------------
  attackSludge() {
    this.busy = true;
    this.setTintFill(0x4cc41f);
    this.scene.time.delayedCall(300, () => {
      this.busy = false;
      if (!this.active || this.defeated) return;
      this.clearTint();
      this.scene.startSludge();
    });
  }

  // ---- Stage 2: jump-behind + melee punish ----------------------------------------
  attackJumpBehind() {
    this.busy = true;
    // Crouch telegraph: very readable squash + red tint
    this.setTintFill(0xff5050);
    this.scene.tweens.add({
      targets: this, scaleY: BOSS.SCALE * 0.8, duration: BOSS.JUMP_CROUCH_MS * 0.8,
    });

    this.scene.time.delayedCall(BOSS.JUMP_CROUCH_MS, () => {
      if (!this.active || this.defeated) return (this.busy = false);
      this.clearTint();
      this.setScale(BOSS.SCALE);

      // Land directly behind Johnny's current position (opposite his facing)
      const p = this.scene.player;
      const w = this.scene.cfg.worldWidth;
      const landX = Phaser.Math.Clamp(
        p.x - p.facing * 70, 90, w - 90  // right behind him, tight
      );

      // The leap: big arc tween
      this.scene.tweens.add({
        targets: this, x: landX, duration: BOSS.JUMP_AIR_MS, ease: 'Sine.easeInOut',
      });
      this.scene.tweens.add({
        targets: this, y: this.homeY - 200, duration: BOSS.JUMP_AIR_MS / 2,
        yoyo: true, ease: 'Quad.easeOut',
        onComplete: () => {
          if (!this.active || this.defeated) return (this.busy = false);
          this.y = this.homeY;
          this.scene.cameras.main.shake(150, 0.006); // landing thud

          // Melee wind-up: bright flash — MOVE.
          this.setTintFill(0xffe066);
          this.scene.time.delayedCall(BOSS.MELEE_WINDUP_MS, () => {
            if (!this.active || this.defeated) return (this.busy = false);
            this.clearTint();
            // The swing
            this.scene.tweens.add({
              targets: this, angle: this.flipX ? 12 : -12, duration: 80, yoyo: true,
            });
            const pl = this.scene.player;
            if (Math.abs(pl.x - this.x) <= BOSS.MELEE_RANGE) {
              pl.takeDamage(BOSS.MELEE_DAMAGE, this.x);
            }
            // Walk back to his mark
            this.scene.tweens.add({
              targets: this, x: this.homeX, duration: BOSS.RETURN_MS,
              onComplete: () => (this.busy = false),
            });
          });
        },
      });
    });
  }

  // ---- Stage 2: spawn adds -----------------------------------------------------------
  attackSpawnAdds() {
    this.busy = true;
    this.setTintFill(0x9ee87a);
    this.scene.time.delayedCall(300, () => {
      this.busy = false;
      if (!this.active || this.defeated) return;
      this.clearTint();
      this.scene.spawnBossAdds();
    });
  }
}
