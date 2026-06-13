import { PLAYER } from '../config/constants.js';
import WeaponSystem from '../systems/WeaponSystem.js';

// Johnny Law. Arrow keys/WASD to move, Space/Up/W to jump,
// Z or left-click to shoot, X or Shift to dodge-roll (i-frames).
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, startWeaponTier) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.body.setSize(26, 40);

    this.hearts = PLAYER.MAX_HEARTS;
    this.facing = 1;
    this.invulnerableUntil = 0;
    this.dodgeUntil = 0;
    this.dodgeReadyAt = 0;
    this.controlsLocked = false;
    this.dead = false;

    this.weapons = new WeaponSystem(scene);
    this.weapons.equipTier(startWeaponTier);

    // Held-gun sprite, shown at the muzzle, swapped per weapon and aimed
    // toward the cursor. Depth just above the body.
    this.heldGun = scene.add.image(x, y, this.gunTexFor(this.weapons.weapon))
      .setDepth(11).setOrigin(0.15, 0.55).setScale(0.7);

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      g: Phaser.Input.Keyboard.KeyCodes.G,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    // --- Abilities (post-level choice system) -------------------------------
    this.abilities = scene.abilities; // AbilitySystem, set up by the scene
    // Passive: bonus max hearts (heal applied on first equip below)
    if (this.abilities) {
      this.maxHearts = PLAYER.MAX_HEARTS + this.abilities.bonusMaxHearts;
    } else {
      this.maxHearts = PLAYER.MAX_HEARTS;
    }
    this.hearts = this.maxHearts;

    // Scooter is now ability-gated (no longer a guaranteed Level 4 mechanic).
    this.scooterCharges = this.abilities ? this.abilities.scooterCharges : 0;

    // Active-ability cooldown timestamps
    this.miniBombReadyAt = 0;
    this.decoyReadyAt = 0;
    this.suppressReadyAt = 0;
    this.suppressUntil = 0;       // burst active until this time
    this.suppressCharging = false;
    this.slamming = false;

    this.pointerDown = false;
    this.justClicked = false;
    this.shootHeldSince = 0;
    scene.input.on('pointerdown', () => {
      this.pointerDown = true;
      this.justClicked = true;
      this.shootHeldSince = scene.time.now;
    });
    scene.input.on('pointerup', () => {
      this.pointerDown = false;
      this.onShootRelease();
    });

    this.emitHearts();
  }

  emitHearts() {
    this.scene.registry.set('hearts', this.hearts);
    this.scene.registry.set('maxHearts', this.maxHearts);
    this.scene.game.events.emit('hearts-changed', this.hearts, this.maxHearts);
  }

  heal(amount) {
    if (this.dead) return;
    this.hearts = Math.min(this.maxHearts, this.hearts + amount);
    this.emitHearts();
    // Green pulse to read as a pickup
    this.setTint(0x9ee87a);
    this.scene.time.delayedCall(150, () => this.active && this.clearTint());
  }

  get isInvulnerable() {
    return this.scene.time.now < this.invulnerableUntil;
  }

  get isDodging() {
    return this.scene.time.now < this.dodgeUntil;
  }

  update(time) {
    if (this.dead || this.controlsLocked) {
      if (!this.dead && this.body.blocked.down) this.setVelocityX(0);
      if (this.heldGun) this.heldGun.setVisible(false);
      return;
    }

    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w);
    const dodge =
      Phaser.Input.Keyboard.JustDown(this.keys.x) ||
      Phaser.Input.Keyboard.JustDown(this.keys.shift);
    // Semiauto: click per shot, not held trigger
    const shootPress =
      Phaser.Input.Keyboard.JustDown(this.keys.z) || this.justClicked;
    this.justClicked = false; // clear flag after read
    // Track keyboard shoot-hold for Suppressing Fire charge
    if (Phaser.Input.Keyboard.JustDown(this.keys.z)) this.shootHeldSince = time;
    if (Phaser.Input.Keyboard.JustUp(this.keys.z)) this.onShootRelease();

    const A = this.abilities;

    // --- Revenge Scooter (G): ability-gated, charge-based ---
    if (A && A.has('scooter') && Phaser.Input.Keyboard.JustDown(this.keys.g)) {
      if (this.scooterCharges > 0) {
        this.scooterCharges--;
        this.scene.throwScooter(this.x + this.facing * 26, this.y - 10, this.facing);
      } else {
        this.scene.game.events.emit('show-toast', 'NO SCOOTER \u2014 GO GET IT', '#ffd0d0');
      }
    }

    // --- Mini Pickle Bomb (F) ---
    if (A && A.has('minibomb') && Phaser.Input.Keyboard.JustDown(this.keys.f)) {
      if (time >= this.miniBombReadyAt) {
        this.miniBombReadyAt = time + A.miniBombCooldownMs;
        const g = this.scene.physics.world.gravity.y;
        const airtime = (2 * 560) / g;
        const vx = Phaser.Math.Clamp(this.facing * 280, -420, 420);
        this.scene.spawnBomb(this.x + this.facing * 16, this.y - 16, vx, -560);
      } else {
        this.scene.game.events.emit('show-toast', 'BOMB ON COOLDOWN', '#ffd0d0');
      }
    }

    // --- Decoy Pickle (C) ---
    if (A && A.has('decoy') && Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      if (time >= this.decoyReadyAt) {
        this.decoyReadyAt = time + A.decoyCooldownMs;
        this.scene.spawnDecoy(this.x, this.y, A.decoyDurationMs);
      } else {
        this.scene.game.events.emit('show-toast', 'DECOY ON COOLDOWN', '#ffd0d0');
      }
    }

    // --- Ground Slam (S while airborne) ---
    if (
      A && A.has('groundslam') &&
      Phaser.Input.Keyboard.JustDown(this.keys.s) &&
      !this.body.blocked.down && !this.slamming
    ) {
      this.slamming = true;
      this.setVelocityY(A.groundSlamFallBoost);
    }
    if (this.slamming && this.body.blocked.down) {
      this.slamming = false;
      this.scene.groundSlamImpact(this.x, this.y, A.groundSlamRadius, A.groundSlamDamage);
    }

    // Dodge-roll: brief dash + full invulnerability. With Dash Strike, the
    // roll also deals contact damage (handled by the scene reading isDashStriking).
    if (dodge && time >= this.dodgeReadyAt) {
      this.dodgeUntil = time + PLAYER.DODGE_MS;
      this.dodgeReadyAt = time + PLAYER.DODGE_MS + PLAYER.DODGE_COOLDOWN_MS;
      this.invulnerableUntil = Math.max(this.invulnerableUntil, this.dodgeUntil);
      this.setVelocityX(PLAYER.DODGE_SPEED * this.facing);
      this.dashStrikeHits = new Set(); // reset per-roll hit tracking
      this.scene.tweens.add({
        targets: this, angle: 360 * this.facing, duration: PLAYER.DODGE_MS,
        onComplete: () => this.setAngle(0),
      });
    }

    if (!this.isDodging) {
      if (left) {
        this.setVelocityX(-PLAYER.SPEED * this.moveSpeedMul());
        this.facing = -1;
      } else if (right) {
        this.setVelocityX(PLAYER.SPEED * this.moveSpeedMul());
        this.facing = 1;
      } else {
        this.setVelocityX(0);
      }
      this.setFlipX(this.facing < 0);
    }

    if (jump && this.body.blocked.down) {
      this.setVelocityY(-PLAYER.JUMP_VELOCITY);
    }

    if (shootPress && !this.isDodging) {
      // Get cursor world position for aiming
      const pointer = this.scene.input.activePointer;
      const cam = this.scene.cameras.main;
      const worldX = pointer.x + cam.scrollX;
      const worldY = pointer.y + cam.scrollY;

      // Face toward cursor when shooting
      if (worldX > this.x) this.facing = 1;
      else if (worldX < this.x) this.facing = -1;
      this.setFlipX(this.facing < 0);

      const muzzleX = this.x + this.facing * 22;
      const muzzleY = this.y - 6;
      const fired = this.weapons.tryFireAt(
        time, muzzleX, muzzleY, worldX, worldY,
        this.scene.playerBullets
      );
      if (fired) {
        this.scene.cameras.main.shake(30, 0.0008);
      }
    }

    // Suppressing Fire burst: while active, auto-fire toward the cursor at 2x
    // the weapon's normal rate (temporarily override the fire delay).
    if (this.suppressUntil && time < this.suppressUntil && !this.isDodging) {
      const pointer = this.scene.input.activePointer;
      const cam = this.scene.cameras.main;
      const worldX = pointer.x + cam.scrollX;
      const worldY = pointer.y + cam.scrollY;
      this.weapons.suppressMul = this.abilities.suppressFireRateMul;
      const fired = this.weapons.tryFireAt(
        time, this.x + this.facing * 22, this.y - 6, worldX, worldY,
        this.scene.playerBullets
      );
      this.weapons.suppressMul = 1;
      if (fired) this.scene.cameras.main.shake(20, 0.001);
    } else if (this.suppressUntil && time >= this.suppressUntil) {
      this.suppressUntil = 0;
    }

    // i-frame blink
    this.setAlpha(this.isInvulnerable && !this.isDodging ? 0.5 : 1);

    this.updateHeldGun();
  }

  moveSpeedMul() {
    return this.abilities ? this.abilities.moveSpeedMul : 1;
  }

  // Dash Strike: true while mid-roll if the ability is owned.
  get isDashStriking() {
    return this.abilities && this.abilities.has('dashstrike') && this.isDodging;
  }

  // Suppressing Fire: releasing a held shoot (after a brief charge) triggers a
  // rapid-fire burst. Called on pointerup and Z keyup.
  onShootRelease() {
    if (!this.abilities || !this.abilities.has('suppress')) return;
    const now = this.scene.time.now;
    if (now < this.suppressReadyAt) return;            // on cooldown
    const held = now - this.shootHeldSince;
    if (held < 300) return;                            // needs a brief charge
    this.suppressUntil = now + this.abilities.suppressBurstMs;
    this.suppressReadyAt = now + this.abilities.suppressBurstMs
      + this.abilities.suppressCooldownMs;
    this.scene.game.events.emit('show-toast', 'SUPPRESSING FIRE!', '#ffe066');
  }

  gunTexFor(weapon) {
    const map = {
      pistol: 'gun_pistol', magnum: 'gun_magnum',
      carbine: 'gun_carbine', shotgun: 'gun_shotgun',
    };
    return (weapon && map[weapon.id]) || 'gun_pistol';
  }

  updateHeldGun() {
    if (!this.heldGun) return;
    // Keep texture in sync with the current weapon
    const tex = this.gunTexFor(this.weapons.weapon);
    if (this.heldGun.texture.key !== tex) this.heldGun.setTexture(tex);

    // Aim toward the cursor
    const pointer = this.scene.input.activePointer;
    const cam = this.scene.cameras.main;
    const worldX = pointer.x + cam.scrollX;
    const worldY = pointer.y + cam.scrollY;
    const ang = Math.atan2(worldY - (this.y - 4), worldX - this.x);

    this.heldGun.setVisible(!this.dead && !this.isDodging);
    this.heldGun.setPosition(this.x + Math.cos(ang) * 14, this.y - 4 + Math.sin(ang) * 14);
    this.heldGun.setRotation(ang);
    // Flip the gun art vertically when aiming left so it isn't upside-down
    this.heldGun.setFlipY(Math.abs(ang) > Math.PI / 2);
    this.heldGun.setAlpha(this.alpha);
  }

  takeDamage(amount, fromX = this.x) {
    if (this.dead || this.isInvulnerable) return;
    this.hearts = Math.max(0, this.hearts - amount);
    this.emitHearts();
    this.invulnerableUntil = this.scene.time.now + PLAYER.IFRAMES_MS;

    // Knockback, but no stun-lock: controls stay live
    const dir = this.x >= fromX ? 1 : -1;
    this.setVelocity(PLAYER.KNOCKBACK_X * dir, PLAYER.KNOCKBACK_Y);
    this.scene.cameras.main.shake(140, 0.006);
    this.setTintFill(0xff5555);
    this.scene.time.delayedCall(100, () => this.active && this.clearTint());

    if (this.hearts <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.setVelocityX(0);
    this.scene.tweens.add({ targets: this, angle: 90, alpha: 0.4, duration: 350 });
    this.scene.game.events.emit('player-died');
    this.scene.onPlayerDied();
  }

  // Respawn at checkpoint with full hearts (forgiving game)
  respawn(x, y) {
    this.dead = false;
    this.hearts = this.maxHearts;
    this.emitHearts();
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAngle(0);
    this.setAlpha(1);
    this.invulnerableUntil = this.scene.time.now + 1000;
  }
}
