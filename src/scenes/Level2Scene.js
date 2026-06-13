import BaseLevelScene from './BaseLevelScene.js';

// Level 2: The City Hunt. Three visually distinct segments
// (street -> alley -> rooftops), cooler night palette than Level 1.
// All gameplay comes from BaseLevelScene + LEVELS[2].
export default class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2', 2);
  }

  buildBackdrop(cfg) {
    const far = this.add.graphics().setScrollFactor(0.18).setDepth(0);
    const m = this.add.graphics().setScrollFactor(0.45).setDepth(0);

    // Moon + far skyline (cool blue night)
    const moon = this.add.circle(820, 90, 34, 0xdfe8f0, 1).setScrollFactor(0.05).setDepth(0);
    this.add.circle(832, 84, 30, cfg.skyColor ? 0x1a1f2e : 0x1a1f2e, 1)
      .setScrollFactor(0.05).setDepth(0); // crescent bite
    moon.setDepth(0);

    for (let x = -100; x < cfg.worldWidth * 0.25; x += Phaser.Math.Between(50, 100)) {
      const h = Phaser.Math.Between(160, 300);
      far.fillStyle(0x202840, 1);
      far.fillRect(x, cfg.floorY - h, Phaser.Math.Between(50, 90), h);
    }

    // Mid layer: 3 segments mapped to world-space thirds of the run-and-gun
    // stretch, then rooftop styling for the chase.
    const midSpan = cfg.worldWidth * 0.5 + 600;
    const seg = (wx) => {
      const worldX = wx / 0.5; // un-shrink parallax to world space (approx)
      if (worldX < 2800) return 0;       // street
      if (worldX < 5600) return 1;       // alley
      if (worldX < 8550) return 2;       // rooftop access + arena
      return 3;                          // rooftop chase
    };

    for (let x = 0; x < midSpan; ) {
      const zone = seg(x);

      if (zone === 0) {
        // STREET: cool blue-gray facades, neon shop signs, streetlights
        const w = Phaser.Math.Between(120, 180);
        const h = Phaser.Math.Between(180, 280);
        const top = cfg.floorY - h;
        m.fillStyle(Phaser.Math.RND.pick([0x2a3248, 0x253047, 0x2e3850]), 1);
        m.fillRect(x, top, w, h);
        // roof lip so the top edge reads as a building, not a flat block
        m.fillStyle(0x353d52, 1); m.fillRect(x, top, w, 6);
        // windows: cool cyan-ish lights, dimmer and inset so they don't glare
        m.fillStyle(0x6a9ab0, 0.5);
        for (let wy = top + 18; wy < cfg.floorY - 30; wy += 26) {
          for (let wx = x + 12; wx < x + w - 16; wx += 24) {
            if (Math.random() < 0.3) m.fillRect(wx, wy, 8, 10);
          }
        }
        // neon sign (kept, it's intentional flavor)
        if (Math.random() < 0.5) {
          m.fillStyle(Phaser.Math.RND.pick([0xe84a8a, 0x4ae8c8, 0xe8d44a]), 0.8);
          m.fillRect(x + 14, cfg.floorY - 70, Phaser.Math.Between(40, 70), 12);
        }
        // streetlight: a pole rising FROM the building roof with a lamp head
        // on top of the pole — never a free-floating bright block.
        const poleH = 26;
        m.fillStyle(0x3a4254, 1);
        m.fillRect(x + w - 10, top - poleH, 4, poleH);
        m.fillStyle(0xd8c878, 0.8);
        m.fillRect(x + w - 16, top - poleH - 5, 16, 5);
        x += w + Phaser.Math.Between(14, 40);
      } else if (zone === 1) {
        // ALLEY: tight dark brick walls, fire escapes, hanging cables
        const w = Phaser.Math.Between(140, 200);
        const h = Phaser.Math.Between(240, 330); // taller, closes you in
        m.fillStyle(Phaser.Math.RND.pick([0x33282e, 0x2c2630, 0x362b28]), 1);
        m.fillRect(x, cfg.floorY - h, w, h);
        // fire escape zig-zags
        m.fillStyle(0x1c1c22, 1);
        for (let fy = cfg.floorY - h + 40; fy < cfg.floorY - 60; fy += 56) {
          m.fillRect(x + 12, fy, w - 34, 4);            // landing
          m.fillRect(x + 12 + ((fy / 56) % 2 === 0 ? 0 : w - 44), fy, 8, 40); // ladder
        }
        // dim amber windows
        m.fillStyle(0xd8a85a, 0.4);
        for (let wy = cfg.floorY - h + 18; wy < cfg.floorY - 40; wy += 48) {
          for (let wx = x + 16; wx < x + w - 16; wx += 36) {
            if (Math.random() < 0.25) m.fillRect(wx, wy, 8, 10);
          }
        }
        // cable across the gap
        m.fillStyle(0x14141a, 0.8);
        m.fillRect(x, cfg.floorY - h + Phaser.Math.Between(20, 60), w + 30, 2);
        x += w + Phaser.Math.Between(8, 22); // tight gaps
      } else if (zone === 2) {
        // ROOFTOP ACCESS: building tops at eye level — water towers, AC units
        const w = Phaser.Math.Between(160, 240);
        const top = cfg.floorY - Phaser.Math.Between(70, 120); // low rooflines
        m.fillStyle(0x262b36, 1);
        m.fillRect(x, top, w, cfg.floorY - top);
        m.fillStyle(0x303644, 1); m.fillRect(x, top, w, 8); // roof lip
        // water tower
        if (Math.random() < 0.4) {
          m.fillStyle(0x3a3026, 1);
          m.fillRect(x + 24, top - 54, 44, 36);
          m.fillTriangle(x + 20, top - 54, x + 72, top - 54, x + 46, top - 72);
          m.fillRect(x + 28, top - 18, 5, 18); m.fillRect(x + 60, top - 18, 5, 18);
        }
        // AC unit
        m.fillStyle(0x3e4450, 1); m.fillRect(x + w - 50, top - 18, 34, 18);
        x += w + Phaser.Math.Between(20, 50);
      } else {
        // ROOFTOP CHASE: city far BELOW — short silhouettes, antenna, vents.
        // Conveys height: the skyline drops away under the run line.
        const w = Phaser.Math.Between(90, 150);
        const h = Phaser.Math.Between(60, 130); // squat = far below
        m.fillStyle(0x202637, 1);
        m.fillRect(x, cfg.floorY - h, w, h);
        m.fillStyle(0xf2e08a, 0.5);
        for (let wx = x + 8; wx < x + w - 10; wx += 20) {
          if (Math.random() < 0.3) m.fillRect(wx, cfg.floorY - h + 10, 6, 7);
        }
        if (Math.random() < 0.3) {
          m.fillStyle(0x4a5060, 1);
          m.fillRect(x + w / 2, cfg.floorY - h - 40, 3, 40); // antenna
          m.fillStyle(0xe84a4a, 1);
          m.fillRect(x + w / 2 - 2, cfg.floorY - h - 44, 7, 5); // beacon
        }
        x += w + Phaser.Math.Between(24, 60);
      }
    }

    // A second pickle billboard for continuity ("...1 MI" — getting closer)
    this.add
      .text(cfg.worldWidth * 0.31, cfg.floorY - 190, 'FRESH PICKLES \u2192 1 MI', {
        fontFamily: 'monospace', fontSize: '13px', color: '#9ee87a', fontStyle: 'bold',
        backgroundColor: '#173312', padding: { x: 8, y: 5 },
      })
      .setScrollFactor(0.45)
      .setDepth(0);
  }
}
