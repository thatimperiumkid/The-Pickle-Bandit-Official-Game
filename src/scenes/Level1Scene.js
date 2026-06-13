import BaseLevelScene from './BaseLevelScene.js';

// Level 1: The Robbery. All gameplay comes from BaseLevelScene + LEVELS[1];
// this file only owns the look of the level.
export default class Level1Scene extends BaseLevelScene {
  constructor() {
    super('Level1', 1);
  }

  buildBackdrop(cfg) {
    const g = this.add.graphics().setScrollFactor(0.18).setDepth(0);
    const m = this.add.graphics().setScrollFactor(0.45).setDepth(0);

    // Far skyline
    for (let x = -100; x < cfg.worldWidth * 0.25; x += Phaser.Math.Between(60, 110)) {
      const h = Phaser.Math.Between(140, 260);
      g.fillStyle(0x232838, 1);
      g.fillRect(x, cfg.floorY - h, Phaser.Math.Between(50, 90), h);
    }

    // Mid layer changes character across four zones of the level
    const zoneOf = (wx) => Math.min(3, Math.floor((wx / (cfg.worldWidth * 0.5)) * 4));
    const midSpan = cfg.worldWidth * 0.5 + 600;

    const billboards = [];

    for (let x = 0; x < midSpan; ) {
      const zone = zoneOf(x);

      if (zone === 0) {
        // Downtown: tall dark towers, scattered lit windows (grid-aligned,
        // inset from edges so lights never overlap the building border)
        const w = Phaser.Math.Between(90, 150);
        const h = Phaser.Math.Between(220, 330);
        m.fillStyle(Phaser.Math.RND.pick([0x262e44, 0x2b3450]), 1);
        m.fillRect(x, cfg.floorY - h, w, h);
        m.fillStyle(0xf2e08a, 0.85);
        for (let wy = cfg.floorY - h + 16; wy <= cfg.floorY - 26; wy += 24) {
          for (let wx = x + 12; wx <= x + w - 20; wx += 22) {
            if (Math.random() < 0.35) m.fillRect(wx, wy, 8, 10);
          }
        }
        x += w + Phaser.Math.Between(16, 50);
      } else if (zone === 1) {
        // Shopfronts: short, colorful, striped awnings
        const w = Phaser.Math.Between(110, 170);
        const h = Phaser.Math.Between(95, 150);
        const body = Phaser.Math.RND.pick([0x3a2f3f, 0x2f3a44, 0x44383a, 0x33403a]);
        m.fillStyle(body, 1);
        m.fillRect(x, cfg.floorY - h, w, h);
        const awn = Phaser.Math.RND.pick([0xa84a4a, 0x4a7aa8, 0x4aa86a]);
        for (let s = 0; s < w - 8; s += 16) {
          m.fillStyle(s % 32 === 0 ? awn : 0xd8d2c0, 1);
          m.fillRect(x + 4 + s, cfg.floorY - h + 18, 16, 10);
        }
        m.fillStyle(0xf2e08a, 0.7);
        m.fillRect(x + 14, cfg.floorY - 52, w - 28, 30);
        x += w + Phaser.Math.Between(12, 36);
      } else if (zone === 2) {
        // Industrial: wide low warehouses + smokestacks
        const w = Phaser.Math.Between(180, 260);
        const h = Phaser.Math.Between(120, 180);
        m.fillStyle(0x2c2f33, 1);
        m.fillRect(x, cfg.floorY - h, w, h);
        m.fillStyle(0x23262a, 1);
        m.fillTriangle(x, cfg.floorY - h, x + w, cfg.floorY - h, x + w / 2, cfg.floorY - h - 36);
        m.fillStyle(0x3a3e44, 1);
        m.fillRect(x + w - 40, cfg.floorY - h - 90, 16, 90);
        m.fillRect(x + 20, cfg.floorY - 60, 34, 60);
        x += w + Phaser.Math.Between(30, 70);
      } else {
        // Outskirts: chain-link fences + the pickle billboard
        m.fillStyle(0x3a3e44, 1);
        m.fillRect(x, cfg.floorY - 46, 4, 46);
        m.fillStyle(0x4a4f56, 0.7);
        m.fillRect(x, cfg.floorY - 44, 120, 2);
        m.fillRect(x, cfg.floorY - 28, 120, 2);
        m.fillRect(x, cfg.floorY - 12, 120, 2);
        x += 120;
        if (Math.random() < 0.18) {
          m.fillStyle(0x2a2d33, 1); m.fillRect(x + 20, cfg.floorY - 150, 8, 150);
          m.fillStyle(0x14141a, 1); m.fillRect(x - 30, cfg.floorY - 210, 180, 70);
          m.fillStyle(0x4cc41f, 1); m.fillRect(x - 24, cfg.floorY - 204, 168, 58);
          // Record the panel's actual position so the text can be centered on it
          billboards.push({ cx: x - 24 + 168 / 2, cy: cfg.floorY - 204 + 58 / 2 });
          x += 170;
        }
      }
    }

    // Place billboard copy on every panel actually drawn, perfectly centered
    billboards.forEach((b) => {
      this.add
        .text(b.cx, b.cy, 'FRESH PICKLES\n\u2192 2 MI', {
          fontFamily: 'monospace', fontSize: '13px', color: '#0e2e08',
          fontStyle: 'bold', align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0.45)
        .setDepth(0);
    });
  }
}
