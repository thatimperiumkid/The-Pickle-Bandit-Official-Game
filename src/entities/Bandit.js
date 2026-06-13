import { BANDIT, ENEMY_BULLET_SPEED, BOMB } from '../config/constants.js';

// The Pickle Bandit. In Level 1 he is NOT a boss — he taunts, flees, lobs
// bombs over his shoulder, fires the occasional revolver shot, and escapes
// (scripted). He cannot be killed here; player bullets ping off him.
//
// Level 5 turns him into a real multi-phase boss via enterBossMode() below.
export default class Bandit extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bandit');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);
    this.setDepth(8);

    this.state = 'hidden';   // hidden -> taunt -> flee -> escaping -> gone
    this.nextThrowAt = 0;
    this.nextShotAt = 0;
    this.escapeX = Infinity;
    this.setVisible(false);
    this.body.enable = false;

    // His revolver (reference gun #2), shown in-hand once he's on screen and
    // pointed back at Johnny.
    this.heldGun = scene.add.image(x, y, 'gun_magnum').setDepth(9).setOrigin(0.15, 0.55).setScale(0.7);
    this.heldGun.setVisible(false);
  }

  // Point the revolver back toward Johnny (called from pursuit/chase update).
  aimRevolverAt(tx, ty) {
    if (!this.heldGun) return;
    if (!this.visible || this.state === 'gone') { this.heldGun.setVisible(false); return; }
    const ang = Math.atan2(ty - (this.y - 2), tx - this.x);
    this.heldGun.setPosition(this.x + Math.cos(ang) * 16, this.y - 2 + Math.sin(ang) * 16);
    this.heldGun.setRotation(ang);
    this.heldGun.setFlipY(Math.abs(ang) > Math.PI / 2);
    this.heldGun.setVisible(true);
  }


  appear(escapeX, taunt) {
    this.escapeX = escapeX;
    this.setVisible(true);
    this.body.enable = true;
    this.state = 'taunt';

    const line =
      taunt || 'You\u2019ll never catch me, Law!\nI\u2019m in a real... BIG DILL of a hurry!';
    const bubble = this.scene.add
      .text(this.x, this.y - 64, line, {
        fontFamily: 'monospace', fontSize: '14px', color: '#d7ff8a',
        backgroundColor: '#1d2412', padding: { x: 8, y: 6 }, align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(20);

    this.scene.time.delayedCall(BANDIT.TAUNT_MS, () => {
      bubble.destroy();
      if (this.state === 'taunt') this.state = 'flee';
    });
  }

  update(player, time) {
    if (this.state === 'pursuit' || this.state === 'climax') {
      this.updatePursuit(player, time);
      return;
    }
    if (this.state === 'flee') {
      this.setVelocityX(BANDIT.FLEE_SPEED);
      this.setFlipX(false);
      this.aimRevolverAt(player.x, player.y - 6);

      // Over-the-shoulder pickle bombs
      if (time >= this.nextThrowAt) {
        this.nextThrowAt = time + BANDIT.THROW_COOLDOWN_MS;
        const g = this.scene.physics.world.gravity.y;
        const airtime = (2 * Math.abs(BOMB.THROW_VY)) / g;
        let vx = (player.x - this.x) / airtime;
        vx = Phaser.Math.Clamp(vx, -BOMB.MAX_VX, BOMB.MAX_VX * 0.5);
        this.scene.spawnBomb(this.x - 20, this.y - 28, vx, BOMB.THROW_VY);
      }

      // Occasional revolver shot back at Johnny
      if (time >= this.nextShotAt) {
        this.nextShotAt = time + BANDIT.SHOOT_COOLDOWN_MS;
        this.scene.enemyShootAt(this.x - 24, this.y - 8, player.x, player.y, ENEMY_BULLET_SPEED);
      }

      // Hop over parked cars / barriers in the road
      if (this.body.blocked.right && this.body.blocked.down) {
        this.setVelocityY(-560);
      }

      if (this.x >= this.escapeX) this.beginEscape();
    } else if (this.state === 'escaping') {
      this.setVelocityX(BANDIT.ESCAPE_SPEED);
      if (this.body.blocked.right && this.body.blocked.down) this.setVelocityY(-560);
      if (this.x > this.escapeX + 600) {
        this.state = 'gone';
        this.setVisible(false);
        if (this.heldGun) this.heldGun.setVisible(false);
        this.body.enable = false;
        this.scene.onBanditEscaped();
      }
    } else {
      this.setVelocityX(0);
    }
  }

  beginEscape() {
    if (this.state === 'escaping' || this.state === 'gone') return;
    this.state = 'escaping';
  }

  // Player bullets can't hurt him in Level 1 — show a "ping" so it reads as
  // intentional, not as a bug.
  deflect(bullet) {
    bullet.kill();
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.active && this.clearTint());
    const ping = this.scene.add
      .text(this.x, this.y - 48, 'YOU MISSED!', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: ping, y: ping.y - 20, alpha: 0, duration: 500,
      onComplete: () => ping.destroy(),
    });
  }

  // Reset for checkpoint respawn during the finale
  resetForChase(x, y) {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.state = 'flee';
    this.setVisible(true);
    this.body.enable = true;
  }

  // ---- LEVEL 3 PURSUIT MODE -------------------------------------------------
  // Pace-anchored: each frame the Bandit lerps toward Johnny's position plus a
  // fixed offset, so he hangs at the right edge of the screen for the whole
  // level — never catchable by running, always visibly *right there*.
  startPursuit(offsetX, anchorY, hp = 0, mode = 'anchored') {
    this.state = 'pursuit';
    this.pursuitMode = mode;        // 'anchored' = match Johnny's pace (L3),
                                    // 'constant' = fixed fast pace (L4)
    this.pursuitOffset = offsetX;
    this.anchorY = anchorY;
    this.groundY = anchorY;         // his "running" height (Johnny's spawn height)
    this.setVisible(true);
    this.body.enable = true;
    this.body.setAllowGravity(false);
    this.setVelocity(0, 0);
    this.setPosition(this.scene.player.x + offsetX, anchorY);
    this.constantSpeed = 205;       // L4 fixed pace (px/s) — a touch slower
    this.jumpUntil = 0;             // timer for hop arcs
    this.nextJumpAt = this.scene.time.now + Phaser.Math.Between(900, 1600);

    // Level 4: first time he's damageable. 0 = invulnerable (Level 3).
    this.maxHp = hp;
    this.hp = hp;
    this.fled = false;

    this.nextThrowAt = this.scene.time.now + 2000;
    this.nextShotAt =
      this.scene.time.now +
      Phaser.Math.Between(BANDIT.PURSUIT_SHOT_MIN_MS, BANDIT.PURSUIT_SHOT_MAX_MS);
  }

  // Level 4: bullets and the Revenge Scooter chip away at him mid-chase.
  takePursuitDamage(amount, sourceLabel) {
    if (this.maxHp <= 0 || this.fled || this.state !== 'pursuit') return;
    this.hp = Math.max(0, this.hp - amount);
    this.scene.game.events.emit('bandit-health', this.hp / this.maxHp);

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.active && this.clearTint());

    if (this.hp <= 0) this.fleeWounded();
  }

  // HP zero: stagger, then a wounded sprint off-screen. Not a clean escape —
  // he's hurt, and the level ends on this beat.
  fleeWounded() {
    if (this.fled) return;
    this.fled = true;
    this.state = 'fleeingWounded';
    this.scene.game.events.emit('bandit-defeated');

    // Stagger: a couple of pained flinches in place
    this.setTintFill(0xff5050);
    this.scene.tweens.add({
      targets: this, angle: -14, duration: 90, yoyo: true, repeat: 3,
      onComplete: () => {
        if (!this.active) return;
        this.clearTint();
        this.setAngle(0);
        // Wounded sprint: fast but lurching (limp wobble on y)
        this.scene.tweens.add({
          targets: this, y: this.y - 5, duration: 110, yoyo: true, repeat: -1,
        });
        this.scene.tweens.add({
          targets: this, x: this.x + 1500, duration: 1600, ease: 'Quad.easeIn',
          onComplete: () => {
            this.state = 'gone';
            this.setVisible(false);
            if (this.heldGun) this.heldGun.setVisible(false);
            this.scene.onBanditFledWounded();
          },
        });
      },
    });
  }

  updatePursuit(player, time) {
    const dtFrame = 1 / 60;
    if (this.pursuitMode === 'constant') {
      // Level 4: fixed fast pace, no anchoring to Johnny
      this.x += this.constantSpeed * dtFrame;
    } else {
      // Level 3: pace-anchored — lerp toward Johnny + offset
      const targetX = player.x + this.pursuitOffset;
      this.x = Phaser.Math.Linear(this.x, targetX, BANDIT.PURSUIT_LERP);
    }
    this.setFlipX(false); // always running right, glancing back
    this.aimRevolverAt(player.x, player.y - 6);

    // Grounded running with periodic jumps (over obstacles), settling back to
    // Johnny's spawn height. Replaces the old floating bob.
    if (time >= this.nextJumpAt && time >= this.jumpUntil) {
      this.jumpUntil = time + 520;
      this.nextJumpAt = time + Phaser.Math.Between(1100, 2000);
    }
    if (time < this.jumpUntil) {
      // parabolic hop
      const t = 1 - (this.jumpUntil - time) / 520;
      const hop = Math.sin(t * Math.PI) * 70;
      this.y = this.groundY - hop;
    } else {
      // small running stride bob, mostly at ground height
      this.y = this.groundY - Math.abs(Math.sin(time / 90)) * 4;
    }

    if (this.state !== 'pursuit') return; // climax/escape skips attacks

    // Backward pickle bombs on the ThrowerGoon cadence
    if (time >= this.nextThrowAt) {
      this.nextThrowAt = time + BANDIT.PURSUIT_BOMB_COOLDOWN_MS;
      this.setTintFill(0xd7ff8a);
      this.scene.time.delayedCall(140, () => this.active && this.clearTint());
      const g = this.scene.physics.world.gravity.y;
      const airtime = (2 * Math.abs(BOMB.THROW_VY)) / g;
      let vx = (player.x - this.x) / airtime;
      vx = Phaser.Math.Clamp(vx, -BOMB.MAX_VX, BOMB.MAX_VX * 0.5);
      vx += Phaser.Math.FloatBetween(-30, 30);
      this.scene.spawnBomb(this.x - 18, this.y - 24, vx, BOMB.THROW_VY);
    }

    // Occasional single revolver shot: aim flash telegraph, then one bullet
    if (time >= this.nextShotAt) {
      this.nextShotAt =
        time + Phaser.Math.Between(BANDIT.PURSUIT_SHOT_MIN_MS, BANDIT.PURSUIT_SHOT_MAX_MS);
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(BANDIT.PURSUIT_AIM_FLASH_MS, () => {
        if (!this.active || this.state !== 'pursuit') return;
        this.clearTint();
        const p = this.scene.player;
        this.scene.enemyShootAt(this.x - 20, this.y - 8, p.x, p.y - 6, ENEMY_BULLET_SPEED);
      });
    }
  }

  // Climax: the gap visibly closes (offset shrinks), then after the speech
  // bubble beat he leaps off-screen and despawns.
  beginClimax(closeOffset, onGapClosed) {
    if (this.state !== 'pursuit') return;
    this.state = 'climax';
    this.clearTint();
    this.scene.tweens.add({
      targets: this,
      pursuitOffset: closeOffset,
      duration: 1300,
      ease: 'Sine.easeOut',
      onComplete: () => onGapClosed && onGapClosed(),
    });
  }

  escapeJump() {
    if (this.state === 'gone') return;
    this.state = 'escaping';
    if (this.bobTween) this.bobTween.stop();
    this.scene.tweens.add({
      targets: this,
      x: this.x + 340,
      y: this.y - 420,
      angle: -20,
      alpha: 0.2,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.state = 'gone';
        this.setVisible(false);
        if (this.heldGun) this.heldGun.setVisible(false);
        this.body.enable = false;
        this.scene.onBanditEscaped();
      },
    });
  }

  // ---- LEVEL 5 STUB ------------------------------------------------------
  // Full boss behavior lives here later: phases, hp bar, bomb barrages,
  // revolver fans, desperation phase. Level 1 never calls this.
  enterBossMode(/* phaseConfig */) {
    throw new Error('Bandit boss mode is a Level 5 feature — not implemented yet.');
  }
}
