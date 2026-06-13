import { LEVELS } from '../systems/LevelConfig.js';
import Player from '../entities/Player.js';
import Goon from '../entities/Goon.js';
import ThrowerGoon from '../entities/ThrowerGoon.js';
import Marksman from '../entities/Marksman.js';
import Lieutenant from '../entities/Lieutenant.js';
import Bandit from '../entities/Bandit.js';
import Bullet from '../entities/Bullet.js';
import PickleBomb from '../entities/PickleBomb.js';
import Scooter from '../entities/Scooter.js';
import AbilitySystem from '../systems/AbilitySystem.js';

const ENEMY_TYPES = { goon: Goon, thrower: ThrowerGoon, marksman: Marksman };

// Generic "build a level from config" scene. Every level subclasses this with
// just a key, a level id, and a buildBackdrop() override. All gameplay logic
// (combat, checkpoints, mini-boss gate, chase finale) is driven by LEVELS[id].
export default class BaseLevelScene extends Phaser.Scene {
  constructor(sceneKey, levelId) {
    super(sceneKey);
    this.sceneKey = sceneKey;
    this.levelId = levelId;
  }

  create() {
    this.game.events.emit('level-restarted');
    this.registry.set('currentLevel', this.sceneKey);
    this.cfg = LEVELS[this.levelId];
    const cfg = this.cfg;
    this.abilities = new AbilitySystem(this.game); // before Player reads it

    this.physics.world.setBounds(0, 0, cfg.worldWidth, cfg.worldHeight);
    this.cameras.main.setBounds(0, 0, cfg.worldWidth, cfg.worldHeight);
    this.cameras.main.setBackgroundColor(cfg.skyColor || '#241f2b');

    this.buildBackdrop(cfg);
    this.buildTerrain(cfg);

    // --- Groups -----------------------------------------------------------
    this.playerBullets = this.physics.add.group({
      classType: Bullet, maxSize: 40, runChildUpdate: true,
    });
    this.enemyBullets = this.physics.add.group({
      classType: Bullet, maxSize: 30, runChildUpdate: true,
    });
    this.bombs = this.add.group();
    this.enemies = this.add.group();
    this.heartDrops = this.physics.add.group();

    // --- Player -----------------------------------------------------------
    this.player = new Player(this, cfg.playerStart.x, cfg.playerStart.y, cfg.startWeaponTier);

    // --- Enemies from config ------------------------------------------------
    this.spawnEnemiesFrom(0);

    // --- Lieutenant mini-boss (optional, config-driven) ----------------------
    this.lieutenant = null;
    this.gateWall = null;
    if (cfg.lieutenant) {
      this.lieutenant = new Lieutenant(this, cfg.lieutenant.x, cfg.floorY - 90, cfg.lieutenant);
      this.enemies.add(this.lieutenant);
      // Visible blockade gating the path until the Lieutenant falls
      this.gateWall = this.terrain.create(
        cfg.lieutenant.gateX, cfg.floorY - 80, 'blockade'
      );
      this.gateWall.setDepth(3);
    }

    // --- Weapon pickup (optional — some levels gate the upgrade behind a boss) -
    this.pickup = null;
    this.pickupCollected = false;
    this.pickupCollectedAtCheckpoint = -1;
    if (cfg.weaponPickup) {
      this.pickup = this.physics.add
        .staticImage(cfg.weaponPickup.x, cfg.weaponPickup.y, 'pickup')
        .setDepth(4);
      this.pickupBob = this.tweens.add({
        targets: this.pickup, y: cfg.weaponPickup.y - 8,
        duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // --- Checkpoint flags (any number, config-driven) ------------------------
    this.checkpointFlags = (cfg.checkpoints || []).map((x) =>
      this.add.image(x, cfg.floorY - 32, 'checkpoint').setDepth(3).setAlpha(0.5)
    );
    this.lastCheckpoint = -1;
    this.checkpointWeaponTier = cfg.startWeaponTier;

    // --- The Bandit ---------------------------------------------------------
    // Chase-finale levels spawn him hidden at his chase mark; pursuit levels
    // (Levels 3-4) anchor him on-screen from the very first frame. Boss
    // levels (Level 5) create their own BanditBoss and leave this one hidden.
    const banditX = cfg.pursuit
      ? cfg.playerStart.x + cfg.pursuit.offsetX
      : cfg.chase ? cfg.chase.banditStartX : -500;
    this.bandit = new Bandit(this, banditX, cfg.floorY - 30);
    this.chaseStarted = false;
    this.climaxStarted = false;
    this.levelCleared = false;
    if (cfg.pursuit) {
      if (!cfg.pursuit.delayedStart) {
        this.bandit.startPursuit(cfg.pursuit.offsetX, cfg.floorY - 30, cfg.banditHp || 0);
      }
    }
    this.cutsceneActive = false; // Level 4 sets this during its opener

    // --- Collisions ---------------------------------------------------------
    this.physics.add.collider(this.player, this.terrain);
    this.physics.add.collider(this.player, this.crumblers, (player, plat) => {
      const p = plat.crumbleState !== undefined ? plat : player;
      // Only trigger when actually standing on top, not brushing the side
      if (this.player.body.blocked.down) this.triggerCrumble(p);
    });
    this.physics.add.collider(this.enemies, this.terrain);
    this.physics.add.collider(this.enemies, this.crumblers);
    // Pursuit bandit is scripted (no gravity, lerped) — terrain collisions
    // would shove him around. Chase-finale bandit runs on real physics.
    if (!cfg.pursuit) this.physics.add.collider(this.bandit, this.terrain);
    this.physics.add.collider(this.bombs, this.terrain, (a, b) => {
      const bomb = a.arm ? a : b;
      bomb.arm();
    });
    this.physics.add.collider(this.bombs, this.crumblers, (a, b) => {
      const bomb = a.arm ? a : b;
      bomb.arm();
    });

    this.physics.add.overlap(this.playerBullets, this.enemies, (enemy, bullet) => {
      const [b, e] = bullet instanceof Bullet ? [bullet, enemy] : [enemy, bullet];
      if (!b.active || e.isDead) return;
      e.takeDamage(b.damage, b.x);
      b.kill();
    });

    this.physics.add.overlap(this.playerBullets, this.bandit, (a, b2) => {
      const bullet = a instanceof Bullet ? a : b2;
      if (!bullet.active || !this.bandit.visible) return;
      if (this.bandit.maxHp > 0) {
        // Level 4: he bleeds now
        const dmg = bullet.damage || 1;
        bullet.kill();
        this.bandit.takePursuitDamage(dmg);
      } else {
        this.bandit.deflect(bullet);
      }
    });

    this.physics.add.overlap(this.enemyBullets, this.player, (a, b2) => {
      const bullet = a instanceof Bullet ? a : b2;
      if (!bullet.active) return;
      bullet.kill();
      this.player.takeDamage(1, bullet.x);
    });

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (enemy.isDead) return;
      // Dash Strike: rolling through an enemy damages it (once per roll per enemy)
      if (this.player.isDashStriking) {
        if (!this.player.dashStrikeHits.has(enemy)) {
          this.player.dashStrikeHits.add(enemy);
          enemy.takeDamage(this.abilities.dashStrikeDamage, this.player.x);
        }
        return; // no self-damage during a dash strike
      }
      player.takeDamage(enemy.touchDamage, enemy.x);
    });

    this.physics.add.overlap(this.player, this.heartDrops, (player, heart) => {
      heart.destroy();
      this.player.heal(1);
      this.game.events.emit('show-toast', '+1 \u2665', '#ff6b8a');
    });

    if (this.pickup) {
      this.physics.add.overlap(this.player, this.pickup, () => {
        if (this.pickupCollected) return;
        this.pickupCollected = true;
        this.pickupCollectedAtCheckpoint = this.lastCheckpoint;
        this.pickup.body.enable = false;
        this.pickup.setVisible(false);
        this.player.weapons.equipTier(cfg.weaponPickup.tier);
      });
    }

    const killBullet = (a, b) => {
      const bullet = a.kill && a.lifespan !== undefined ? a : b;
      if (bullet.active) bullet.kill();
    };
    this.physics.add.collider(this.playerBullets, this.terrain, killBullet);
    this.physics.add.collider(this.enemyBullets, this.terrain, killBullet);

    // Either side's bullets can shoot a bomb to defuse it (2 hits, any weapon)
    const bombHit = (a, b) => {
      const bullet = a.kill && a.lifespan !== undefined ? a : b;
      const bomb = bullet === a ? b : a;
      if (!bullet.active || !bomb.takeHit) return;
      bullet.kill();
      bomb.takeHit();
    };
    this.physics.add.overlap(this.playerBullets, this.bombs, bombHit);
    this.physics.add.overlap(this.enemyBullets, this.bombs, bombHit);

    // --- Camera -------------------------------------------------------------
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(140, 120);

    // --- Post-clear keys ------------------------------------------------------
    this.input.keyboard.on('keydown-R', () => {
      if (this.levelCleared) {
        if (this.levelId === 1) {
          // Full restart from Level 1 wipes the run's ability picks
          new AbilitySystem(this.game).reset();
        }
        this.scene.restart();
      }
    });
    this.input.keyboard.on('keydown-N', () => {
      if (!this.levelCleared || !this.cfg.nextLevel) return;
      // Levels 1-4 route through the ability-choice screen before the next
      // level. (Level 5 has nextLevel=null, so it never reaches this.)
      this.scene.start('AbilityChoice', { nextLevel: this.cfg.nextLevel });
    });

    if (cfg.title) this.game.events.emit('show-title', cfg.title);
    this.game.events.emit(
      'show-toast',
      'ARROWS/WASD move \u2022 SPACE jump \u2022 Z shoot \u2022 X/SHIFT dodge'
    );
  }

  // Override per level for its own look. Default: nothing.
  buildBackdrop(/* cfg */) {}

  buildTerrain(cfg) {
    this.terrain = this.physics.add.staticGroup();
    this.crumblers = this.physics.add.staticGroup();

    const groundTex = cfg.groundTex || 'ground';
    // Solid floor: either one continuous strip, or segments with gaps between
    // (rooftop levels). Gaps are lethal — see the pit check in update().
    const segments = cfg.floorSegments || [[0, cfg.worldWidth]];
    segments.forEach(([from, to]) => {
      for (let x = from; x + 64 <= to + 32; x += 64) {
        this.terrain.create(x + 32, cfg.floorY + 32, groundTex);
      }
    });

    cfg.platforms.forEach((p) => {
      const group = p.crumble ? this.crumblers : this.terrain;
      const img = group
        .create(p.x + p.w / 2, p.y + p.h / 2, 'platform')
        .setDisplaySize(p.w, p.h);
      img.refreshBody();
      if (p.crumble) {
        img.setTint(0xb09a7a); // visibly weathered — reads as unstable
        img.crumbleState = 'intact';
        img.homeY = img.y;
      }
    });

    (cfg.obstacles || []).forEach((o) => {
      const tex = this.textures.get(o.type).getSourceImage();
      const img = this.terrain.create(o.x, cfg.floorY - tex.height / 2, o.type);
      if (o.tint) img.setTint(o.tint);
      img.setDepth(2);
    });
  }

  // Telegraphed collapse: shake + flash for ~0.5s, then the platform drops
  // out. Restored on player respawn so checkpoint retries are fair.
  triggerCrumble(platform) {
    if (platform.crumbleState !== 'intact') return;
    platform.crumbleState = 'shaking';

    const baseX = platform.x;
    this.tweens.add({
      targets: platform, x: baseX + 3, duration: 40, yoyo: true, repeat: 5, // was repeat: 9
    });
    platform.setTint(0xd86a4a);

    this.time.delayedCall(300, () => { // was 550
      if (!platform.active || platform.crumbleState !== 'shaking') return;
      platform.crumbleState = 'gone';
      platform.body.enable = false;
      this.tweens.add({
        targets: platform, y: platform.homeY + 60, alpha: 0.12, duration: 320,
        ease: 'Quad.easeIn',
      });
    });
  }

  restoreCrumblers() {
    this.crumblers.getChildren().forEach((p) => {
      this.tweens.killTweensOf(p);
      p.crumbleState = 'intact';
      p.setPosition(p.x, p.homeY);
      p.setAlpha(1);
      p.setTint(0xb09a7a);
      p.body.enable = true;
    });
  }

  // ---- Hooks called by entities -------------------------------------------

  hasLineOfSight(ax, ay, bx, by) {
    const minX = Math.min(ax, bx);
    const maxX = Math.max(ax, bx);
    const checkY = (ay + by) / 2;
    const children = this.terrain.getChildren();
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!c.body) continue;
      const b = c.body;
      if (b.width >= 60 && b.y > ay) continue; // floor tiles
      if (b.right > minX && b.x < maxX) {
        if (checkY >= b.y && checkY <= b.bottom) return false;
      }
    }
    return true;
  }

  spawnBomb(x, y, vx, vy) {
    const bomb = new PickleBomb(this, x, y);
    this.bombs.add(bomb);
    bomb.launch(vx, vy);
  }

  enemyShootAt(x, y, tx, ty, speed) {
    const bullet = this.enemyBullets.get(x, y);
    if (bullet) bullet.fireAt(x, y, tx, ty, speed, 1, 'enemy');
  }

  // Spawn the config's enemies whose x is at or past `fromX`. Used at level
  // start (fromX=0) and on checkpoint respawn (fromX = checkpoint x) so that
  // every enemy ahead of the player is freshly restored.
  spawnEnemiesFrom(fromX) {
    const cfg = this.cfg;
    const HP_KEYS = { goon: 'goonHp', thrower: 'throwerHp', marksman: 'marksmanHp' };
    (cfg.enemies || []).forEach((e) => {
      if (e.x < fromX) return;
      const Type = ENEMY_TYPES[e.type];
      const hp = cfg[HP_KEYS[e.type]];
      this.enemies.add(new Type(this, e.x, cfg.floorY - 30, hp));
    });
  }

  // Ground Slam (ability): AoE damage + knockback on landing.
  groundSlamImpact(x, y, radius, damage) {
    const ring = this.add.circle(x, y + 18, 10, 0xffe066, 0.5).setDepth(7);
    this.tweens.add({
      targets: ring, radius, alpha: 0, duration: 280,
      onComplete: () => ring.destroy(),
    });
    this.cameras.main.shake(160, 0.006);
    this.enemies.getChildren().forEach((e) => {
      if (e.isDead) return;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radius) {
        e.takeDamage(damage, x);
        if (e.setVelocityX) e.setVelocityX(e.x < x ? -200 : 200);
      }
    });
    if (this.lieutenant && !this.lieutenant.isDead &&
        Phaser.Math.Distance.Between(x, y, this.lieutenant.x, this.lieutenant.y) <= radius) {
      this.lieutenant.takeDamage(damage, x);
    }
    if (this.boss && !this.boss.defeated &&
        Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y) <= radius) {
      this.boss.takePursuitDamage(damage);
    }
  }

  // A lightweight stand-in the enemy AI can read like the player. Enemies use
  // .x/.y for aiming; bullets/bombs aimed "at" it land on the decoy visually.
  decoyTarget(decoy) {
    return { x: decoy.x, y: decoy.y, facing: 1, dead: false, takeDamage() {} };
  }

  // Decoy Pickle (ability): a fake Johnny that pulls enemy aggro.
  spawnDecoy(x, y, durationMs) {
    const decoy = this.add.sprite(x, y, 'player').setDepth(9).setAlpha(0.7).setTint(0x88ff88);
    this.tweens.add({ targets: decoy, alpha: 0.4, duration: 300, yoyo: true, repeat: -1 });
    this.decoy = decoy;
    this.decoyUntil = this.time.now + durationMs;
    this.game.events.emit('show-toast', 'DECOY DEPLOYED', '#9ee87a');
    this.time.delayedCall(durationMs, () => {
      if (decoy === this.decoy) this.decoy = null;
      this.tweens.killTweensOf(decoy);
      decoy.destroy();
    });
  }

  // Pickle bomb explosion damage check against the player.
  onBombExploded(x, y, radius, damage) {
    const d = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    if (d <= radius + 18) this.player.takeDamage(damage, x);
  }

  // ~22% chance an enemy drops a heart on death. Floats down, bobs, despawns
  // after a while if uncollected. Collecting heals 1 heart.
  maybeDropHeart(x, y) {
    if (Math.random() > 0.22) return;
    const heart = this.heartDrops.create(x, y, 'heart').setDepth(7);
    heart.body.setAllowGravity(false);
    heart.setVelocityY(-60);
    this.tweens.add({
      targets: heart, y: y - 6, duration: 500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 350,
    });
    this.time.delayedCall(8000, () => {
      if (!heart.active) return;
      this.tweens.add({
        targets: heart, alpha: 0, duration: 600,
        onComplete: () => heart.destroy(),
      });
    });
  }

  // Level 4: the Revenge Scooter. Thrown by the player (G), damages the
  // Bandit, self-drives, then rests until retrieved.
  throwScooter(x, y, dir) {
    this.scooter = new Scooter(this, x, y, dir);

    this.physics.add.collider(this.scooter, this.terrain, () => {
      this.scooter.land();
    });
    this.physics.add.overlap(this.scooter, this.bandit, () => {
      if (this.bandit.visible) this.scooter.hitBandit(this.bandit, this.time.now);
    });
    this.physics.add.overlap(this.player, this.scooter, () => {
      if (this.scooter.state !== 'resting') return;
      this.scooter.destroy();
      this.scooter = null;
      this.player.scooterCharges += 1;
      this.game.events.emit('show-toast', 'SCOOTER RETRIEVED', '#4cc41f');
    });
  }

  onLieutenantDefeated() {
    if (!this.gateWall) return;
    const wall = this.gateWall;
    this.gateWall = null;
    this.tweens.add({
      targets: wall, alpha: 0, y: wall.y + 30, duration: 500,
      onComplete: () => wall.destroy(),
    });
    wall.body.enable = false;
    this.game.events.emit('show-toast', 'PATH CLEAR', '#4cc41f');
    this.cameras.main.shake(200, 0.005);

    // The Chief's Rifle drops here — only obtainable by beating the boss
    if (this.cfg.bossWeaponDrop) {
      const drop = this.physics.add
        .staticImage(this.lieutenant.x, this.cfg.floorY - 50, 'pickup')
        .setDepth(4);
      this.tweens.add({
        targets: drop, y: drop.y - 8,
        duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      const overlap = this.physics.add.overlap(this.player, drop, () => {
        overlap.destroy();
        drop.destroy();
        this.player.weapons.equipTier(this.cfg.bossWeaponDrop.tier);
      });
    }
  }

  onPlayerDied() {
    this.time.delayedCall(900, () => this.respawn());
  }

  respawn() {
    this.bombs.getChildren().slice().forEach((b) => b.destroy());
    this.enemyBullets.getChildren().forEach((b) => b.active && b.kill());
    this.heartDrops.getChildren().slice().forEach((h) => h.destroy());
    if (this.decoy) { this.tweens.killTweensOf(this.decoy); this.decoy.destroy(); this.decoy = null; }
    this.restoreCrumblers();

    const cfg = this.cfg;
    const x =
      this.lastCheckpoint >= 0 ? cfg.checkpoints[this.lastCheckpoint] : cfg.playerStart.x;

    // --- Regenerate all enemies ahead of the checkpoint ---------------------
    // Wipe survivors and respawn the full set past the respawn x, so the
    // stretch ahead is fresh every attempt. The Lieutenant is config-driven
    // separately (not in cfg.enemies) — leave him alone here; he's reset below.
    this.enemies.getChildren().slice().forEach((e) => {
      if (e === this.lieutenant) return;
      if (e.heldGun) e.heldGun.destroy();
      e.destroy();
    });
    this.spawnEnemiesFrom(x);

    // --- Revoke a gun picked up after the last checkpoint -------------------
    if (
      this.pickupCollected &&
      this.pickupCollectedAtCheckpoint >= this.lastCheckpoint
    ) {
      // The pickup was grabbed in the segment we're restarting — give it back
      this.pickupCollected = false;
      this.pickupCollectedAtCheckpoint = -1;
      if (this.pickup) {
        this.pickup.body.enable = true;
        this.pickup.setVisible(true);
      }
    }
    // Reset the player's weapon to whatever they held at the checkpoint
    const tier = this.checkpointWeaponTier != null
      ? this.checkpointWeaponTier : cfg.startWeaponTier;
    this.player.weapons.equipTier(tier);

    this.player.respawn(x, cfg.playerStart.y);

    if (cfg.pursuit && !this.levelCleared && !this.climaxStarted && !this.bandit.fled) {
      // Snap the pace anchor instead of letting the lerp drag him across the map
      this.bandit.x = x + cfg.pursuit.offsetX;
    } else if (this.chaseStarted && !this.levelCleared) {
      this.bandit.resetForChase(cfg.chase.banditStartX, cfg.floorY - 30);
    }
    if (this.lieutenant && !this.lieutenant.isDead) {
      this.lieutenant.resetAfterPlayerDeath();
    }
  }

  onBanditEscaped() {
    if (this.levelCleared) return;
    this.levelCleared = true;
    this.player.controlsLocked = true;
    const sub = this.cfg.nextLevel
      ? 'Level clear \u2014 N for next level \u2022 R to replay'
      : 'Level clear \u2014 press R to replay';
    this.game.events.emit('show-end', this.cfg.endCard, sub);
  }

  // Level 4: the chase ends when his health hits zero and he limps off.
  onBanditFledWounded() {
    this.onBanditEscaped(); // same clear flow, different endCard text via config
  }

  // ---- Main loop ------------------------------------------------------------

  update(time) {
    this.player.update(time);

    // Decoy Pickle: enemies near an active decoy chase/attack it instead of
    // Johnny. We pass the decoy as a stand-in "player" to those enemies.
    const decoyActive = this.decoy && this.time.now < this.decoyUntil;
    this.enemies.getChildren().forEach((e) => {
      let target = this.player;
      if (decoyActive && Phaser.Math.Distance.Between(e.x, e.y, this.decoy.x, this.decoy.y) < 360) {
        // mimic the player shape the enemy AI expects (x, y, facing, body)
        target = this.decoyTarget(this.decoy);
      }
      e.update(target, time);
    });

    // Pit death: falling into a rooftop gap (only on levels with gaps)
    if (
      this.cfg.floorSegments &&
      !this.player.dead &&
      this.player.y > this.cfg.floorY + 30
    ) {
      this.player.die(); // fall = death regardless of i-frames; checkpoint respawn
    }

    // Checkpoints (in order; furthest reached wins)
    (this.cfg.checkpoints || []).forEach((cx, i) => {
      if (i > this.lastCheckpoint && this.player.x >= cx) {
        this.lastCheckpoint = i;
        this.checkpointFlags[i].setAlpha(1);
        // Remember the weapon held AT this checkpoint — a gun picked up after
        // it is forfeited on death (and the pickup is restored, below).
        this.checkpointWeaponTier = this.player.weapons.weapon
          ? this.player.weapons.weapon.tier : this.cfg.startWeaponTier;
        this.game.events.emit('show-toast', 'CHECKPOINT', '#4cc41f');
      }
    });

    // --- Pursuit mode (Levels 3-4): Bandit anchored all level ----------------
    if (this.cfg.pursuit) {
      if (this.cutsceneActive) return; // Level 4 opener owns the stage
      if (this.bandit.state !== 'hidden') this.bandit.update(this.player, time);

      if (
        this.cfg.pursuit.closeTriggerX &&
        !this.climaxStarted &&
        this.player.x >= this.cfg.pursuit.closeTriggerX
      ) {
        this.climaxStarted = true;
        this.bandit.beginClimax(this.cfg.pursuit.closeOffsetX, () => {
          // Gap visibly closed — Johnny calls it...
          const bubble = this.add
            .text(this.player.x, this.player.y - 56, 'I\u2019ve got you now, Bandit.', {
              fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
              backgroundColor: '#10141c', padding: { x: 8, y: 6 },
            })
            .setOrigin(0.5, 1)
            .setDepth(20);
          // ...and the Bandit immediately makes him regret saying it
          this.time.delayedCall(1500, () => {
            bubble.destroy();
            this.bandit.escapeJump();
          });
        });
      }

      // Level 4: ran out of road before finishing him off — end it anyway.
      // No closeTrigger is set for this level, so this only fires there.
      if (
        !this.cfg.pursuit.closeTriggerX &&
        !this.levelCleared &&
        !this.bandit.fled &&
        this.bandit.maxHp > 0 &&
        this.player.x >= this.cfg.worldWidth - 600
      ) {
        this.bandit.fleeWounded(); // same wounded-retreat, regardless of remaining HP
      }
      return; // pursuit levels have no separate chase finale
    }

    // --- Chase-finale mode (Levels 1-2) --------------------------------------
    if (!this.cfg.chase) return; // boss levels handle their own finale
    if (!this.chaseStarted && this.player.x >= this.cfg.chase.triggerX) {
      this.chaseStarted = true;
      this.bandit.appear(this.cfg.chase.escapeX, this.cfg.chase.taunt);
    }

    if (this.chaseStarted) this.bandit.update(this.player, time);

    if (
      this.chaseStarted &&
      !this.levelCleared &&
      this.player.x >= this.cfg.chase.escapeX - 220
    ) {
      this.bandit.beginEscape();
    }
  }
}
