import BaseLevelScene from './BaseLevelScene.js';
import { LEVELS } from '../systems/LevelConfig.js';

// Level 4: "Go Get Him."
//
// Opens on a scripted cutscene — Johnny and Felix at the Bandit's safehouse,
// Felix's death, the single enormous tear — then breaks into a pure-pursuit
// chase: no standard enemies, procedurally-placed suburban obstacle chunks,
// and the first damageable Bandit (health bar; flees wounded at zero).
//
// The cutscene is a simple beat array, not a framework. Each beat runs its
// action, holds for `hold` ms (skippable after `minHold` via any key).
export default class Level4Scene extends BaseLevelScene {
  constructor() {
    super('Level4', 4);
  }

  create() {
    // Generate procedural chunks BEFORE super.create() builds terrain once,
    // cleanly — avoids a double-build (which orphaned old terrain tiles and
    // broke bomb/terrain collisions).
    this.generateChunks();
    super.create(); // sets this.cfg, builds terrain with the chunks above

    this.buildCutsceneStage();
    this.startCutscene();
  }

  // ---- Procedural chunk placement -------------------------------------------
  generateChunks() {
    const cfg = LEVELS[4]; // mutate directly — this.cfg will reference the same object
    const obstacles = [];
    let x = cfg.chunkZone.from;
    while (x < cfg.chunkZone.to) {
      const type = Phaser.Math.RND.pick(cfg.chunkPool);
      const entry = { type, x };
      if (type === 'car') {
        entry.tint = Phaser.Math.RND.pick([0x9a4a4a, 0x4a6e9a, 0x6e6e6e, 0x8a8a5a]);
      }
      obstacles.push(entry);
      x += Phaser.Math.Between(cfg.chunkSpacing.min, cfg.chunkSpacing.max);
    }
    cfg.obstacles = obstacles; // regenerated fresh on every scene start
  }

  // ---- Cutscene ---------------------------------------------------------------
  buildCutsceneStage() {
    const cfg = this.cfg;
    const fy = cfg.floorY;

    // The safehouse: 1-story, two-car garage, sitting at x ~520
    const h = this.add.graphics().setDepth(2);
    h.fillStyle(0x14141a, 1); h.fillRect(380, fy - 164, 300, 164);          // outline
    h.fillStyle(0x847a6c, 1); h.fillRect(384, fy - 160, 292, 160);          // siding
    h.fillStyle(0x3a352e, 1); h.fillTriangle(370, fy - 160, 690, fy - 160, 530, fy - 214); // roof
    h.fillStyle(0x4a525c, 1); h.fillRect(398, fy - 120, 120, 120);          // garage 1+2
    h.fillStyle(0x14141a, 1);
    for (let gy = fy - 112; gy < fy - 8; gy += 18) h.fillRect(400, gy, 116, 3);
    h.fillStyle(0x5a4332, 1); h.fillRect(600, fy - 96, 44, 96);             // the door
    h.fillStyle(0xf2c14e, 1); h.fillRect(634, fy - 54, 5, 5);               // knob
    h.fillStyle(0xf2e08a, 0.6); h.fillRect(548, fy - 110, 32, 26);          // lit window
    this.houseDoorX = 622;

    // Felix, standing beside Johnny
    this.felix = this.add.sprite(190, cfg.floorY - 30, 'felix').setDepth(5);

    // Full-screen black overlay for the cuts (UI-space, above everything)
    this.blackout = this.add
      .rectangle(-1000, -1000, 4000, 3000, 0x000000, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0);
  }

  bubble(x, y, text, holdMs) {
    const b = this.add
      .text(x, y, text, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
        backgroundColor: '#10141c', padding: { x: 8, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setDepth(60);
    this.time.delayedCall(holdMs, () => b.destroy());
    return b;
  }

  startCutscene() {
    this.cutsceneActive = true;
    this.player.controlsLocked = true;
    this.bandit.setVisible(false);

    const fy = this.cfg.floorY;
    const beats = [
      // 0: the two of them walk up to the house
      {
        hold: 2200, minHold: 600,
        action: () => {
          this.tweens.add({ targets: this.player, x: 560, duration: 2100 });
          this.tweens.add({ targets: this.felix, x: 480, duration: 2100 });
        },
      },
      // 1: Felix: "Let's split up."
      {
        hold: 1700, minHold: 700,
        action: () => this.bubble(this.felix.x, this.felix.y - 48, 'Let\u2019s split up.', 1700),
      },
      // 2: Johnny: "Alright."
      {
        hold: 1300, minHold: 600,
        action: () => this.bubble(this.player.x, this.player.y - 52, 'Alright.', 1300),
      },
      // 3: Felix walks off-screen left
      {
        hold: 1600, minHold: 500,
        action: () => {
          this.felix.setFlipX(true);
          this.tweens.add({ targets: this.felix, x: -60, duration: 1600 });
        },
      },
      // 4: Johnny walks to the door... and the screen cuts to black
      {
        hold: 1500, minHold: 500,
        action: () => {
          this.tweens.add({ targets: this.player, x: this.houseDoorX, duration: 1000 });
          this.time.delayedCall(1050, () => this.blackout.setAlpha(1));
        },
      },
      // 5: over black: "No!"
      {
        hold: 1400, minHold: 800,
        action: () => {
          this.add
            .text(512, 250, 'No!', {
              fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
              backgroundColor: '#000000', padding: { x: 12, y: 8 }, fontStyle: 'bold',
            })
            .setOrigin(0.5).setScrollFactor(0).setDepth(60)
            .setName('noBubble');
        },
        cleanup: () => this.children.getByName('noBubble')?.destroy(),
      },
      // 6: dim interior. Felix is down. "Go get him, Johnny." Camera zooms in.
      {
        hold: 2600, minHold: 900,
        action: () => {
          // Build the interior in WORLD space, centered on Johnny's current
          // position, so the camera can actually pan/zoom into it.
          const cx = this.player.x;
          const fy = this.cfg.floorY;
          this.interior = this.add.graphics().setDepth(52);
          this.interior.fillStyle(0x1a1820, 1);
          this.interior.fillRect(cx - 360, 0, 720, fy + 64);
          this.interior.fillStyle(0x2a2630, 1);
          this.interior.fillRect(cx - 360, fy - 40, 720, 104); // floor band
          this.interior.fillStyle(0x12101a, 1);
          this.interior.fillRect(cx - 300, fy - 250, 120, 90);  // window
          this.interior.fillStyle(0x2a3a4a, 0.4);
          this.interior.fillRect(cx - 294, fy - 244, 108, 78);

          // Felix down + spreading blood pool (world space)
          const felixX = cx - 40, felixY = fy - 24;
          this.blood = this.add.graphics().setDepth(52.5);
          const drawBlood = (s) => {
            this.blood.clear();
            this.blood.fillStyle(0x8a1518, 0.9);
            this.blood.fillEllipse(felixX + 8, felixY + 18, 150 * s, 36 * s);
            this.blood.fillStyle(0xb02025, 0.85);
            this.blood.fillEllipse(felixX + 8, felixY + 16, 120 * s, 24 * s);
          };
          this.tweens.addCounter({
            from: 0.2, to: 1, duration: 1400, ease: 'Quad.easeOut',
            onUpdate: (tw) => drawBlood(tw.getValue()),
          });
          this.felixDown = this.add.sprite(felixX, felixY, 'felix').setAngle(90).setDepth(53);
          this.johnnyIn = this.add.sprite(cx + 120, fy - 70, 'player').setFlipX(true).setDepth(53);

          // Zoom/pan onto the pair
          const cam = this.cameras.main;
          cam.pan(cx + 40, fy - 70, 900, 'Sine.easeInOut');
          cam.zoomTo(1.9, 900);

          this.felixLineObj = this.add
            .text(felixX + 10, fy - 150, 'Go get him, Johnny.', {
              fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
              backgroundColor: '#000000', padding: { x: 7, y: 5 },
            })
            .setOrigin(0.5).setDepth(60);
        },
        cleanup: () => this.felixLineObj?.destroy(),
      },
      // 7: The Tear. Large, but not too large — scaled 50% down from before.
      {
        hold: 2000, minHold: 1200,
        action: () => {
          const tear = this.add
            .image(this.johnnyIn.x - 4, this.johnnyIn.y - 7, 'tear')
            .setDepth(61).setScale(0.2);
          this.tweens.add({ targets: tear, scale: 0.8, duration: 600, ease: 'Quad.easeOut' });
          this.tweens.add({
            targets: tear, y: tear.y + 35, alpha: 0, duration: 1400, delay: 500,
            ease: 'Quad.easeIn',
          });
        },
      },
      // 8: cut to the chase — reset the camera zoom
      {
        hold: 700, minHold: 600,
        action: () => {
          const cam = this.cameras.main;
          cam.zoomTo(1, 400);
          this.time.delayedCall(420, () => {
            cam.setZoom(1);
            this.interior?.destroy();
            this.blood?.destroy();
            this.felixDown?.destroy();
            this.johnnyIn?.destroy();
            this.felix.destroy();
            // hand the camera back to following Johnny
            cam.startFollow(this.player, true, 0.12, 0.12);
          });
          this.tweens.add({ targets: this.blackout, alpha: 0, duration: 500 });
        },
      },
    ];

    let i = -1;
    let beatStartedAt = 0;
    const next = () => {
      // run previous beat's cleanup
      if (i >= 0 && beats[i].cleanup) beats[i].cleanup();
      i++;
      if (i >= beats.length) return this.endCutscene();
      beatStartedAt = this.time.now;
      beats[i].action();
      this.beatTimer = this.time.delayedCall(beats[i].hold, next);
    };

    // Any key skips the current beat once its minHold has passed
    this.skipHandler = () => {
      if (!this.cutsceneActive || i < 0 || i >= beats.length) return;
      if (this.time.now - beatStartedAt < beats[i].minHold) return;
      this.beatTimer.remove(false);
      next();
    };
    this.input.keyboard.on('keydown', this.skipHandler);

    next();
  }

  endCutscene() {
    this.input.keyboard.off('keydown', this.skipHandler);
    this.cutsceneActive = false;
    this.player.controlsLocked = false;

    // The chase begins: damageable Bandit at a fixed fast pace (not anchored)
    this.bandit.startPursuit(
      this.cfg.pursuit.offsetX, this.cfg.floorY - 30, this.cfg.banditHp, "constant"
    );
    this.game.events.emit('bandit-engaged', 1);
    this.game.events.emit('show-toast', 'GO GET HIM', '#ff7849');
  }

  // ---- Repeating suburban backdrop -------------------------------------------
  buildBackdrop(cfg) {
    const m = this.add.graphics().setScrollFactor(0.45).setDepth(0);
    const span = cfg.worldWidth * 0.5 + 600;
    // Two alternating house variants, tiled the whole way — intentionally
    // repetitive; the chase carries this level, not the scenery.
    for (let x = 0, v = 0; x < span; x += 240, v ^= 1) {
      const fy = cfg.floorY;
      if (v === 0) {
        m.fillStyle(0x4a4338, 1); m.fillRect(x + 20, fy - 110, 150, 110);
        m.fillStyle(0x2e2a24, 1);
        m.fillTriangle(x + 10, fy - 110, x + 180, fy - 110, x + 95, fy - 150);
        m.fillStyle(0xf2e08a, 0.5); m.fillRect(x + 45, fy - 86, 22, 20);
        m.fillStyle(0x3a352e, 1); m.fillRect(x + 110, fy - 70, 30, 70);
      } else {
        m.fillStyle(0x3e4452, 1); m.fillRect(x + 30, fy - 95, 140, 95);
        m.fillStyle(0x262b36, 1);
        m.fillTriangle(x + 20, fy - 95, x + 180, fy - 95, x + 100, fy - 130);
        m.fillStyle(0xf2e08a, 0.5); m.fillRect(x + 120, fy - 74, 22, 18);
        // tree
        m.fillStyle(0x2e2620, 1); m.fillRect(x + 4, fy - 56, 8, 56);
        m.fillStyle(0x2e5a2a, 1); m.fillCircle(x + 8, fy - 70, 22);
      }
    }
    // Telephone wire running the whole way — one line, big suburban energy
    m.lineStyle(2, 0x14141a, 0.7);
    for (let x = 0; x < span; x += 300) {
      m.beginPath();
      m.moveTo(x, 220);
      m.lineTo(x + 150, 240);
      m.lineTo(x + 300, 220);
      m.strokePath();
      m.fillStyle(0x2e2620, 1); m.fillRect(x - 3, 210, 6, cfg.floorY - 210);
    }
  }
}
