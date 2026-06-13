import BaseLevelScene from './BaseLevelScene.js';
import BanditBoss from '../entities/BanditBoss.js';
import Goon from '../entities/Goon.js';
import Marksman from '../entities/Marksman.js';
import Bullet from '../entities/Bullet.js';
import { BOSS } from '../config/constants.js';

// Level 5: The Reckoning. One arena. One enormous pickle-themed criminal.
// Two health bars between Johnny and the end of all this.
export default class Level5Scene extends BaseLevelScene {
  constructor() {
    super('Level5', 5);
  }

  create() {
    super.create();

    this.game.events.emit('boss-bar-hide'); // clear any stale bar on restart
    this.missiles = [];        // SeekingMissile registry (they self-update)
    this.sludgeActive = false;
    this.gameWon = false;

    // The boss. The regular bandit from BaseLevelScene stays hidden offstage.
    const cfg = this.cfg;
    const bossY = cfg.floorY - 85; // 5x sprite: half display height above floor
    this.boss = new BanditBoss(this, cfg.boss.x, bossY);

    // Player damage sources -> boss
    this.physics.add.overlap(this.playerBullets, this.boss, (a, b) => {
      const bullet = a instanceof Bullet ? a : b;
      if (!bullet.active) return;
      const dmg = bullet.damage || 1;
      bullet.kill();
      this.boss.takePursuitDamage(dmg);
    });

    // The body-contact rule: touch the giant, lose 2 hearts (i-frames apply)
    this.physics.add.overlap(this.player, this.boss, () => {
      if (this.boss.defeated) return;
      this.player.takeDamage(BOSS.CONTACT_DAMAGE, this.boss.x);
    });

    // A short beat, then the fight begins
    this.time.delayedCall(1600, () => {
      if (this.gameWon) return;
      this.boss.startFight();
      this.game.events.emit('show-toast', 'THE RECKONING', '#ff7849');
    });
  }

  // Register a player-overlap on each missile as it's created so it detonates
  // on contact (missiles are spawned dynamically by the boss).
  registerMissile(missile) {
    this.physics.add.overlap(this.player, missile, () => {
      if (missile.active && !missile.exploded) missile.explode();
    });
    this.physics.add.collider(missile, this.terrain, () => {
      if (missile.active && !missile.exploded) missile.explode();
    });
  }

  // Scooter targets the boss in this level
  throwScooter(x, y, dir) {
    super.throwScooter(x, y, dir);
    // Re-point the scooter's bandit overlap at the boss
    this.physics.add.overlap(this.scooter, this.boss, () => {
      if (!this.boss.defeated) this.scooter.hitBandit(this.boss, this.time.now);
    });
  }

  // ---- Stage 2: pickle sludge floor hazard -----------------------------------
  startSludge() {
    if (this.sludgeActive) return;
    this.sludgeActive = true;
    const cfg = this.cfg;

    // Spreading telegraph: sludge creeps across the floor
    this.sludgeGfx = this.add.graphics().setDepth(3);
    this.tweens.addCounter({
      from: 0, to: cfg.worldWidth, duration: BOSS.SLUDGE_SPREAD_MS,
      onUpdate: (tw) => {
        const w = tw.getValue();
        this.sludgeGfx.clear();
        this.sludgeGfx.fillStyle(0x4cc41f, 0.55);
        this.sludgeGfx.fillRect(0, cfg.floorY - 10, w, 10);
        this.sludgeGfx.fillStyle(0x9ee87a, 0.35);
        this.sludgeGfx.fillRect(0, cfg.floorY - 14, w, 4);
      },
    });
    this.game.events.emit('show-toast', 'SLUDGE \u2014 GET UP HIGH', '#4cc41f');

    // DoT while grounded on the main floor (platforms are safe)
    this.sludgeTick = this.time.addEvent({
      delay: BOSS.SLUDGE_TICK_MS, loop: true,
      callback: () => {
        const p = this.player;
        if (p.dead) return;
        // Safe if airborne, or standing on a refuge platform (not the floor)
        if (p.body.blocked.down && !this.onRefugePlatform(p)) {
          p.takeDamage(BOSS.SLUDGE_DAMAGE, p.x);
        }
      },
    });

    // Recede after the duration
    this.time.delayedCall(BOSS.SLUDGE_DURATION_MS, () => this.endSludge());
  }

  endSludge() {
    if (!this.sludgeActive) return;
    this.sludgeActive = false;
    if (this.sludgeTick) this.sludgeTick.remove(false);
    if (this.sludgeGfx) {
      this.tweens.add({
        targets: this.sludgeGfx, alpha: 0, duration: 400,
        onComplete: () => { this.sludgeGfx.destroy(); this.sludgeGfx = null; },
      });
    }
  }

  // True if the player is standing on top of a refuge platform (vs the floor).
  onRefugePlatform(p) {
    const feet = p.y + 20;
    return (this.cfg.platforms || []).some((plat) => {
      const onTop = Math.abs(feet - plat.y) < 16;
      const inX = p.x > plat.x - 10 && p.x < plat.x + plat.w + 10;
      return onTop && inX;
    });
  }

  // ---- Stage 2: adds ------------------------------------------------------------
  spawnBossAdds() {
    const alive = this.enemies.getChildren().filter((e) => !e.isDead).length;
    if (alive >= BOSS.ADDS_CAP) return; // arena's crowded enough

    const cfg = this.cfg;
    const goons = Math.random() < 0.5;
    this.game.events.emit('show-toast', goons ? 'GOONS!' : 'MARKSMEN!', '#ff5050');

    if (goons) {
      const xs = [40, 70, 960];
      for (let i = 0; i < BOSS.ADDS_GOONS; i++) {
        const g = new Goon(this, xs[i % xs.length], cfg.floorY - 30);
        this.enemies.add(g);
        // entrance pop so they don't just blink into existence
        g.setAlpha(0);
        this.tweens.add({ targets: g, alpha: 1, duration: 250 });
      }
    } else {
      const xs = [60, 950];
      for (let i = 0; i < BOSS.ADDS_MARKSMEN; i++) {
        const mk = new Marksman(this, xs[i % xs.length], cfg.floorY - 30);
        this.enemies.add(mk);
        mk.setAlpha(0);
        this.tweens.add({ targets: mk, alpha: 1, duration: 250 });
      }
    }
  }

  // ---- Defeat -> end of game -------------------------------------------------------
  onBossDefeated() {
    this.gameWon = true;
    this.endSludge();
    this.enemies.getChildren().slice().forEach((e) => {
      if (!e.isDead && e.die) e.die();
    });
    this.player.controlsLocked = true;
    this.levelCleared = true;
    this.game.events.emit('boss-bar-hide');

    this.playDeathCutscene();
  }

  // Scripted finale: slow-mo zoom on the fallen bandit, Johnny approaches,
  // a final word, the bandit fades, then the end card.
  playDeathCutscene() {
    const cam = this.cameras.main;
    cam.stopFollow();
    const bx = this.boss.x;
    const fy = this.cfg.floorY;

    // The bandit, downed where he fell (the collapse tween already faded the
    // boss sprite; drop a crumpled marker + a small green pickle-juice pool).
    const pool = this.add.graphics().setDepth(4);
    pool.fillStyle(0x2e6a1e, 0.0);
    let ps = 0;
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1200,
      onUpdate: (tw) => {
        ps = tw.getValue();
        pool.clear();
        pool.fillStyle(0x3a7a22, 0.7);
        pool.fillEllipse(bx, fy - 6, 130 * ps, 26 * ps);
        pool.fillStyle(0x5aa838, 0.5);
        pool.fillEllipse(bx, fy - 8, 96 * ps, 18 * ps);
      },
    });

    // Beat 1: zoom onto the spot where he fell
    cam.pan(bx - 30, fy - 60, 1400, 'Sine.easeInOut');
    cam.zoomTo(2.1, 1400);

    // Beat 2: Johnny strides into frame from the left
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.player, x: bx - 70, duration: 1400, ease: 'Sine.easeInOut',
      });
      this.player.setFlipX(false);
    });

    // Beat 3: Johnny's line
    this.time.delayedCall(3100, () => {
      const line = this.add.text(this.player.x, this.player.y - 54, 'For Felix.', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
        backgroundColor: '#000000', padding: { x: 8, y: 6 },
      }).setOrigin(0.5, 1).setDepth(60);
      this.time.delayedCall(1800, () => line.destroy());
    });

    // Beat 4: holster + a beat of quiet, fade pool, then the end card
    this.time.delayedCall(5200, () => {
      this.tweens.add({ targets: pool, alpha: 0, duration: 700 });
      cam.zoomTo(1, 800);
      cam.pan(this.player.x, this.player.y, 800);
    });
    this.time.delayedCall(6200, () => {
      cam.setZoom(1);
      this.game.events.emit(
        'show-end', this.cfg.endCard,
        'Revenge complete \u2014 THE END \u2022 R to replay the fight'
      );
    });
    // NOTE: a full credits screen is still a flagged follow-up; this is the
    // scripted death cutscene + placeholder end card.
  }

  // ---- Death = full restart from Stage 1 -------------------------------------------
  respawn() {
    // Final boss stakes: no partial progress. Fresh fight.
    this.scene.restart();
  }

  update(time) {
    super.update(time);
    if (this.boss && !this.cutsceneActive) this.boss.update(this.player, time);
    // prune dead missiles from the registry
    this.missiles = this.missiles.filter((m) => m.active);
  }

  // ---- Arena backdrop ---------------------------------------------------------------
  buildBackdrop(cfg) {
    const g = this.add.graphics().setDepth(0);

    // Industrial dead-end: the back wall of nowhere. Corrugated fence, one
    // flickering floodlight, pickle crates. No way out for either of them.
    g.fillStyle(0x161a22, 1);
    g.fillRect(0, 0, cfg.worldWidth, cfg.floorY);

    // Corrugated wall
    g.fillStyle(0x1f242e, 1);
    g.fillRect(0, cfg.floorY - 300, cfg.worldWidth, 300);
    g.fillStyle(0x181d26, 1);
    for (let x = 0; x < cfg.worldWidth; x += 26) {
      g.fillRect(x, cfg.floorY - 300, 9, 300);
    }
    // Wall cap
    g.fillStyle(0x2a3142, 1);
    g.fillRect(0, cfg.floorY - 306, cfg.worldWidth, 8);

    // Floodlight over the boss's side
    g.fillStyle(0x3a4150, 1);
    g.fillRect(790, cfg.floorY - 420, 8, 120);
    g.fillStyle(0x4a5260, 1);
    g.fillRect(770, cfg.floorY - 428, 48, 14);
    const cone = this.add.graphics().setDepth(0);
    cone.fillStyle(0xf2e8c0, 0.07);
    cone.fillTriangle(794, cfg.floorY - 414, 660, cfg.floorY, 930, cfg.floorY);
    this.tweens.add({
      targets: cone, alpha: 0.55, duration: 1800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pickle crates stacked in the corner — his life's work
    g.fillStyle(0x14141a, 1);
    g.fillRect(926, cfg.floorY - 120, 84, 120);
    g.fillStyle(0x2e4a22, 1);
    g.fillRect(930, cfg.floorY - 116, 76, 52);
    g.fillRect(930, cfg.floorY - 56, 76, 52);
    g.fillStyle(0x4cc41f, 0.6);
    g.fillRect(944, cfg.floorY - 102, 48, 8);
    g.fillRect(944, cfg.floorY - 42, 48, 8);

    // A thin moon. Witness.
    this.add.circle(140, 80, 26, 0xe8eef4, 1).setDepth(0);
    this.add.circle(152, 74, 23, 0x0d1117, 1).setDepth(0);
  }
}
