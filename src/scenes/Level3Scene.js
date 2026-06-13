import BaseLevelScene from './BaseLevelScene.js';

// Level 3: The Rooftop Chase. High above the city at night — stars, moon,
// the skyline glowing far below the run line. All gameplay comes from
// BaseLevelScene + LEVELS[3] (pursuit mode, gaps, crumbling platforms).
export default class Level3Scene extends BaseLevelScene {
  constructor() {
    super('Level3', 3);
  }

  buildBackdrop(cfg) {
    // Stars: nearly static layer
    const stars = this.add.graphics().setScrollFactor(0.04).setDepth(0);
    stars.fillStyle(0xdfe8f0, 0.9);
    for (let i = 0; i < 90; i++) {
      const sx = Phaser.Math.Between(0, 1400);
      const sy = Phaser.Math.Between(10, 300);
      const r = Math.random() < 0.15 ? 2 : 1;
      stars.fillRect(sx, sy, r, r);
    }
    // Moon, big and high
    this.add.circle(760, 80, 38, 0xe8eef4, 1).setScrollFactor(0.04).setDepth(0);
    this.add.circle(774, 72, 33, 0x10141f, 1).setScrollFactor(0.04).setDepth(0);

    // Far skyline: the city DOWN there — squat silhouettes with a warm glow
    const far = this.add.graphics().setScrollFactor(0.15).setDepth(0);
    far.fillStyle(0xd8a85a, 0.06); // ambient city glow band
    far.fillRect(-200, cfg.floorY - 90, cfg.worldWidth * 0.25 + 400, 90);
    for (let x = -100; x < cfg.worldWidth * 0.22; x += Phaser.Math.Between(40, 90)) {
      const h = Phaser.Math.Between(30, 110);
      far.fillStyle(0x1a2030, 1);
      far.fillRect(x, cfg.floorY - h, Phaser.Math.Between(35, 70), h);
      far.fillStyle(0xf2e08a, 0.5);
      for (let wx = x + 4; wx < x + 30; wx += 10) {
        if (Math.random() < 0.3) far.fillRect(wx, cfg.floorY - h + 6, 3, 4);
      }
    }

    // Mid layer: neighboring rooftops below the run line — antennas, beacons,
    // water towers, billboard glow. Conveys "you are on TOP of the city."
    const m = this.add.graphics().setScrollFactor(0.45).setDepth(0);
    const midSpan = cfg.worldWidth * 0.5 + 600;
    for (let x = 0; x < midSpan; ) {
      const w = Phaser.Math.Between(110, 190);
      const h = Phaser.Math.Between(70, 170);
      m.fillStyle(Phaser.Math.RND.pick([0x1c2230, 0x202637, 0x181e2b]), 1);
      m.fillRect(x, cfg.floorY - h, w, h);
      m.fillStyle(0x2a3142, 1); m.fillRect(x, cfg.floorY - h, w, 6); // roof lip
      // sparse windows
      m.fillStyle(0xf2e08a, 0.45);
      for (let wx = x + 10; wx < x + w - 12; wx += 24) {
        if (Math.random() < 0.25) m.fillRect(wx, cfg.floorY - h + 14, 7, 8);
      }
      // rooftop furniture
      const roll = Math.random();
      if (roll < 0.25) {
        // antenna + red beacon
        m.fillStyle(0x4a5060, 1); m.fillRect(x + w / 2, cfg.floorY - h - 46, 3, 46);
        m.fillStyle(0xe84a4a, 0.95); m.fillRect(x + w / 2 - 2, cfg.floorY - h - 51, 7, 5);
      } else if (roll < 0.45) {
        // mini water tower
        m.fillStyle(0x2e2620, 1);
        m.fillRect(x + 16, cfg.floorY - h - 30, 30, 24);
        m.fillTriangle(x + 12, cfg.floorY - h - 30, x + 50, cfg.floorY - h - 30, x + 31, cfg.floorY - h - 42);
      } else if (roll < 0.55) {
        // AC unit
        m.fillStyle(0x343b48, 1); m.fillRect(x + w - 40, cfg.floorY - h - 14, 28, 14);
      }
      x += w + Phaser.Math.Between(18, 55);
    }

    // One glowing pickle billboard, face-on, far below ("...HERE")
    this.add
      .text(cfg.worldWidth * 0.36, cfg.floorY - 60, 'FRESH PICKLES \u2192 HERE', {
        fontFamily: 'monospace', fontSize: '12px', color: '#9ee87a', fontStyle: 'bold',
        backgroundColor: '#173312', padding: { x: 7, y: 4 },
      })
      .setScrollFactor(0.45)
      .setDepth(0);
  }
}
