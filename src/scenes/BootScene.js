// Generates all art at boot in a Gungeon-ish style: chunky pixels, hard
// dark outlines, top-lit highlights, muted palette. Sprites are defined as
// character maps below — swap a map, get a new sprite, zero gameplay changes.

// Draw a pixel-map texture. rows = array of strings, chars index `palette`,
// '.' is transparent. Ragged rows are tolerated.
function pixelTexture(scene, g, key, rows, palette, scale = 2) {
  g.clear();
  const w = Math.max(...rows.map((r) => r.length));
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x];
      if (c === '.' || palette[c] === undefined) continue;
      g.fillStyle(palette[c], 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  g.generateTexture(key, w * scale, rows.length * scale);
}


// --- Johnny Law: navy cap, AVIATOR sunglasses (teardrop lenses + bridge),
// --- darker blue shirt under a gray-brown jacket, gold badge. ---------------
const JOHNNY = [
  '....KKKKKKKK....',
  '...KNNNNNNNNK...',
  '..KNNNNNNNNNNK..',
  '..KNNNNNNNNNNNK.',
  '..KKKKKKKKKKKK..',
  '..KFKAAKAAKFK...', // aviator bridge + teardrop tops
  '..KKAAAAAAAAKK..', // full teardrop lenses
  '..KF.KAAKKAAK.FK', // tapered lens bottoms
  '...KFFFFFFFFK...',
  '..KJTSSSSSSTJK..',
  '.KJJTSSSSSSTJJK.',
  '.KJK.TSSSSST.KJK',
  '.KJK.TSBBSST.KJK',
  '.KJK.TSSSSST.KJK',
  '.KFK.TSSSSST.KFK',
  '....KTSSSSSTK...',
  '....KPPPPPPK....',
  '...KPPPKKPPPK...',
  '...KPPK..KPPK...',
  '...KPPK..KPPK...',
  '..KHHHK..KHHHK..',
];
const JOHNNY_PAL = {
  K: 0x14141a, N: 0x16294d, F: 0xe8c39a, S: 0x1d3a6e,
  J: 0x6e655a, T: 0x847a6c, B: 0xf2c14e, P: 0x23232b, H: 0x2e2620,
  A: 0x2a2a32, // dark aviator lens tint
};

// Felix: Johnny's partner. Same silhouette (same map), warmer palette —
// brown cap, tan jacket, no-nonsense. Dies in Level 4. RIP Felix.
const FELIX_PAL = {
  K: 0x14141a, N: 0x4d3a16, F: 0xdfae84, S: 0x6e5a1d,
  J: 0x7a6a55, T: 0x96856e, B: 0xc0c0c8, P: 0x2b2823, H: 0x26221c,
  A: 0x3a3228,
};

// --- Goon: beanie, scowl, armored vest, and now A GUN. ----------------------
const GOON = [
  '....KKKKKKKK....',
  '...KVVVVVVVVK...',
  '...KVVVVVVVVK...',
  '...KFFFFFFFFK...',
  '...KFKKFFKKFK...', // angry eyes
  '...KFFFFFFFFK...',
  '....KFFFFFFK....',
  '...KUWWWWWWUK...',
  '..KUUWWWWWWUUK..',
  '..KUK WWWWW KUK.'.replace(/ /g, 'W'),
  '..KUK.WWWWW.KUK.',
  '..KFK.WWWWWKFKGG',
  '..KKK.WWWWWKGGGG', // arm out, gun barrel
  '......WWWWW..KG.',
  '....KPPPPPPK....',
  '...KPPPKKPPPK...',
  '...KPPK..KPPK...',
  '...KPPK..KPPK...',
  '..KHHHK..KHHHK..',
];
const GOON_PAL = {
  K: 0x14141a, V: 0x2c2c31, F: 0xdfae84, W: 0x8d97a3,
  U: 0x4a525c, G: 0x35383d, P: 0x3c352c, H: 0x241f19,
};

// --- ThrowerGoon: purple hoodie, bomb satchel, pickle in hand. --------------
const THROWER = [
  '....KDDDDDDK....',
  '...KDDDDDDDDK...',
  '..KDDFFFFFFDDK..',
  '..KDDFKFFKFDDK..',
  '..KDDFFFFFFDDK..',
  '...KDFFFFFFDK...',
  '..KPDDDDDDDDPK..',
  '.KPPVVVVVVVVPPK.',
  '.KPK.VVSVVV.KPK.',
  '.KPK.VVVSVV.KPK.', // satchel strap
  '.KPK.VVVVSV.KPK.',
  '.KFKGVVVVVV.KFK.', // G = pickle in hand
  '..GGKVVVVVVK....',
  '....KBBBBBBK....',
  '...KBBBKKBBBK...',
  '...KBBK..KBBK...',
  '...KBBK..KBBK...',
  '..KHHHK..KHHHK..',
];
const THROWER_PAL = {
  K: 0x14141a, D: 0x4a2a78, P: 0x6a3fa8, V: 0x7c4dbe, F: 0xdfae84,
  S: 0x8a5a2b, G: 0x4cc41f, B: 0x35303c, H: 0x241f19,
};

// --- The Pickle Bandit: SHORT, hooded, masked. Gungeon-style detail:
// --- dark outline, top-lit hood, glowing eyes under the mask, pickle-green
// --- coat with bumpy texture, belt with buckle, stubby legs. ----------------
const BANDIT = [
  '....KKKKKKK.....',
  '...KDDDDDDDK....',   // deep hood
  '..KDDDDDDDDDK...',
  '.KDDDHHHHHDDDK..',   // hood interior shadow
  '.KDDHHHHHHHDDK..',
  '.KDHHSSSSSHHDK..',   // dark face in shadow
  '.KDHSEEKEEKSHDK.',   // glowing eyes E
  '.KDHSSSSSSSSHDK.',
  '.KDDHSSSSSHDDK..',
  '..KDDCCCCCDDK.RK',   // cloak shoulders; R = revolver
  '.KDCCGLGGCCDKRRK',   // cloak with pickle-green L bumps
  '.KCCGGLGGGCCKKK.',
  '.KCCGGGLGGCCK...',
  '.KDCCGGGGGCCDK..',
  '..KKCCCCCCCKK...',
  '...KPPK.KPPK....',
  '..KZZZK.KZZZK...',   // boots
];
const BANDIT_PAL = {
  K: 0x0a0a0c, D: 0x141418, H: 0x1e1e24, S: 0x0e0e10,
  E: 0xc8e840, C: 0x16321a, G: 0x1e4a22,
  L: 0x3a7a3e, P: 0x121216, Z: 0x0c0a08, R: 0x2a2530, W: 0xf0f0e0, M: 0x0e0e0e, F: 0xccb88a,
};

// --- The Lieutenant: mini-boss. Broad-shouldered, red beret, heavy vest.
// --- Visibly bigger and meaner than a Goon. ---------------------------------
const LT = [
  '......KKKKKKKK......',
  '....KBBBBBBBBBBK....',
  '...KBBBBBBBBBBBBK...',
  '....KKKKKKKKKKKK....',
  '....KFFFFFFFFFFK....',
  '....KFKKFFFFKKFK....',  // hard eyes
  '....KFFFFFFFFFFK....',
  '.....KFFFFFFFFK.....',
  '...KUUVVVVVVVVUUK...',
  '..KUUUVVVVVVVVUUUK..',
  '..KUK.VVVVVVVV.KUK..',
  '..KUK.VVKVVKVV.KUK..',  // vest straps
  '..KUK.VVVVVVVV.KUK..',
  '..KUK.VVKVVKVV.KUK..',
  '..KFK.VVVVVVVV.KFK..',
  '.....KVVVVVVVVK.....',
  '....KPPPPPPPPPPK....',
  '....KPPPKKKKPPPK....',
  '....KPPK....KPPK....',
  '....KPPK....KPPK....',
  '....KPPK....KPPK....',
  '...KHHHK....KHHHK...',
];
const LT_PAL = {
  K: 0x14141a, B: 0x8a2a2a, F: 0xd8a878, V: 0x4a4f58,
  U: 0x343941, P: 0x2c2c33, H: 0x1e1a16,
};

// --- Marksman: rooftop burst-fire rifleman. Flat cap, scarf, long rifle
// --- with a scope glint. -----------------------------------------------------
const MARKSMAN_SPR = [
  '....KKKKKKKK....',
  '...KCCCCCCCCK...',
  '..KCCCCCCCCCCK..',
  '...KFFFFFFFFK...',
  '...KFKKFFKKFK...',
  '...KFFFFFFFFK...',
  '....KFFFFFFK....',
  '...KSSVVVVSSK...',
  '..KSSVVVVVVSSK..',
  '..KVK.VVVV.KVK..',
  '..KVK.VVVVKRRRRR', // rifle out
  '..KFK.VVVVKRRRRG', // G = scope glint at the muzzle end
  '......VVVV..KK..',
  '....KPPPPPPK....',
  '...KPPPKKPPPK...',
  '...KPPK..KPPK...',
  '...KPPK..KPPK...',
  '..KHHHK..KHHHK..',
];
const MARKSMAN_PAL = {
  K: 0x14141a, C: 0x3a4a3a, F: 0xdfae84, S: 0x6a4a3a,
  V: 0x44503e, R: 0x2a2a30, G: 0x9ad4e8, P: 0x353830, H: 0x241f19,
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Real gun art (traced-out references), keyed transparent. Loaded as
    // images instead of the old procedurally-drawn textures.
    this.load.image('gun_pistol', 'assets/guns/pistol.png');
    this.load.image('gun_magnum', 'assets/guns/revolver.png');
    this.load.image('gun_carbine', 'assets/guns/sawn.png');
    this.load.image('gun_shotgun', 'assets/guns/pump.png');
    this.load.image('gun_famas', 'assets/guns/famas.png');
  }

  create() {
    const g = this.add.graphics();

    // Helper for drawing bordered rectangles with custom contents
    const rect = (key, w, h, fill, draw) => {
      g.clear();
      g.fillStyle(fill, 1);
      g.fillRect(0, 0, w, h);
      if (draw) draw(g, w, h);
      g.generateTexture(key, w, h);
    };

    pixelTexture(this, g, 'player', JOHNNY, JOHNNY_PAL);
    pixelTexture(this, g, 'goon', GOON, GOON_PAL);
    pixelTexture(this, g, 'throwerGoon', THROWER, THROWER_PAL);
    pixelTexture(this, g, 'bandit', BANDIT, BANDIT_PAL);
    pixelTexture(this, g, 'lieutenant', LT, LT_PAL);
    pixelTexture(this, g, 'marksman', MARKSMAN_SPR, MARKSMAN_PAL);
    pixelTexture(this, g, 'felix', JOHNNY, FELIX_PAL);

    // --- Level 4 props ---------------------------------------------------------
    // The Tear. Oversized on purpose. This is the emotional climax of the game.
    g.clear();
    g.fillStyle(0x9ad4f0, 1);
    g.fillTriangle(14, 0, 4, 22, 24, 22);
    g.fillCircle(14, 24, 10);
    g.fillStyle(0xd8eefa, 0.9);
    g.fillCircle(10, 22, 3); // glint
    g.generateTexture('tear', 28, 36);

    // The Revenge Scooter: deck, two wheels, stem, handlebar. A child's toy.
    g.clear();
    g.fillStyle(0x14141a, 1);
    g.fillRect(2, 12, 26, 5);                 // deck outline
    g.fillStyle(0xd84a4a, 1); g.fillRect(3, 13, 24, 3); // red deck
    g.fillStyle(0x14141a, 1);
    g.fillCircle(6, 19, 4); g.fillCircle(24, 19, 4);    // wheels
    g.fillStyle(0x4a525c, 1);
    g.fillCircle(6, 19, 2); g.fillCircle(24, 19, 2);    // hubs
    g.fillStyle(0x14141a, 1);
    g.fillRect(24, 0, 3, 13);                 // stem
    g.fillRect(18, 0, 12, 3);                 // handlebar
    g.generateTexture('scooter', 32, 24);

    // Suburban chunk props (Level 4 chase obstacles)
    rect('trashcans', 52, 34, 0x4a525c, (gg) => {
      gg.lineStyle(2, 0x14141a, 1);
      gg.strokeRect(2, 6, 22, 26); gg.strokeRect(28, 6, 22, 26);
      gg.fillStyle(0x5a6470, 1); gg.fillRect(0, 2, 26, 5); gg.fillRect(26, 2, 26, 5);
    });
    rect('hedge', 90, 40, 0x2e5a2a, (gg) => {
      gg.fillStyle(0x3a703a, 1);
      gg.fillCircle(15, 10, 10); gg.fillCircle(45, 7, 12); gg.fillCircle(75, 10, 10);
      gg.fillStyle(0x244a22, 1); gg.fillRect(0, 28, 90, 12);
    });
    rect('mailboxes', 40, 44, 0x14141a, (gg) => {
      gg.fillStyle(0x6e655a, 1); gg.fillRect(8, 16, 4, 28); gg.fillRect(28, 16, 4, 28);
      gg.fillStyle(0x4a6ea8, 1); gg.fillRect(2, 6, 16, 12); gg.fillRect(22, 6, 16, 12);
      gg.fillStyle(0xd84a4a, 1); gg.fillRect(16, 2, 3, 8);
    });
    rect('lowwall', 80, 30, 0x847a6c, (gg) => {
      gg.fillStyle(0x6e655a, 1);
      gg.fillRect(0, 0, 80, 4);
      gg.fillRect(0, 12, 80, 2); gg.fillRect(0, 22, 80, 2);
      gg.fillRect(20, 4, 2, 8); gg.fillRect(50, 4, 2, 8);
      gg.fillRect(35, 14, 2, 8); gg.fillRect(65, 14, 2, 8);
    });
    rect('debris', 64, 26, 0x3a352e, (gg) => {
      gg.fillStyle(0x524c44, 1);
      gg.fillTriangle(4, 26, 30, 26, 18, 6);
      gg.fillTriangle(28, 26, 60, 26, 44, 10);
      gg.fillStyle(0x6e655a, 1); gg.fillRect(10, 18, 14, 4); gg.fillRect(38, 14, 16, 4);
    });

    // Bullets
    g.clear();
    g.fillStyle(0x14141a, 1); g.fillRect(0, 0, 14, 7);
    g.fillStyle(0xffe066, 1); g.fillRect(1, 1, 12, 5);
    g.fillStyle(0xfff5c0, 1); g.fillRect(1, 1, 12, 2);
    g.generateTexture('bullet', 14, 7);

    g.clear();
    g.fillStyle(0x14141a, 1); g.fillRect(0, 0, 14, 8);
    g.fillStyle(0xff7849, 1); g.fillRect(1, 1, 12, 6);
    g.fillStyle(0xffc0a0, 1); g.fillRect(1, 1, 12, 2);
    g.generateTexture('enemyBullet', 14, 8);

    // Pickle bomb: outlined, top-lit, unmistakably a pickle
    g.clear();
    g.fillStyle(0x14141a, 1); g.fillRoundedRect(0, 3, 32, 17, 8);
    g.fillStyle(0x4cc41f, 1); g.fillRoundedRect(1, 4, 30, 15, 7);
    g.fillStyle(0x8fe55a, 1); g.fillRoundedRect(3, 5, 26, 4, 3); // highlight
    g.fillStyle(0x2f8f10, 1);
    g.fillCircle(8, 13, 2); g.fillCircle(16, 15, 2); g.fillCircle(24, 13, 2);
    g.fillStyle(0x8a5a2b, 1); g.fillRect(14, 0, 4, 5); // fuse nub
    g.generateTexture('pickleBomb', 32, 21);

    // Weapon pickup crate
    rect('pickup', 30, 30, 0xf2c14e, (gg) => {
      gg.lineStyle(3, 0x14141a, 1); gg.strokeRect(1, 1, 28, 28);
      gg.fillStyle(0xfff0b0, 1); gg.fillRect(2, 2, 26, 4);
      gg.fillStyle(0x8a5a2b, 1); gg.fillRect(13, 4, 4, 22); gg.fillRect(4, 13, 22, 4);
    });

    // Ground & platform tiles: asphalt with lane wear
    rect('ground', 64, 64, 0x33343b, (gg) => {
      gg.fillStyle(0x3d3e46, 1); gg.fillRect(0, 0, 64, 8);
      gg.fillStyle(0x14141a, 1); gg.fillRect(0, 8, 64, 3);
      gg.fillStyle(0x2a2b31, 1);
      gg.fillRect(8, 24, 14, 3); gg.fillRect(38, 40, 18, 3); // cracks
    });
    rect('platform', 64, 32, 0x5a4a38, (gg) => {
      gg.fillStyle(0x6f5c46, 1); gg.fillRect(0, 0, 64, 8);
      gg.fillStyle(0x14141a, 1); gg.fillRect(0, 8, 64, 2);
      gg.fillStyle(0x4a3c2d, 1); gg.fillRect(20, 14, 3, 18); gg.fillRect(44, 14, 3, 18);
    });

    // --- Road obstacles ------------------------------------------------------
    // Parked car (tint per instance for variety)
    g.clear();
    g.fillStyle(0x14141a, 1); g.fillRoundedRect(0, 10, 100, 24, 6);
    g.fillStyle(0x8d97a3, 1); g.fillRoundedRect(1, 11, 98, 22, 5);   // body (tintable)
    g.fillStyle(0x14141a, 1); g.fillRoundedRect(18, 0, 60, 16, 6);
    g.fillStyle(0x8d97a3, 1); g.fillRoundedRect(19, 1, 58, 14, 5);   // cabin
    g.fillStyle(0x9fd4e8, 1); g.fillRect(24, 3, 22, 10); g.fillRect(50, 3, 22, 10); // windows
    g.fillStyle(0x14141a, 1); g.fillCircle(22, 34, 9); g.fillCircle(78, 34, 9);
    g.fillStyle(0x3a3a40, 1); g.fillCircle(22, 34, 5); g.fillCircle(78, 34, 5);
    g.generateTexture('car', 100, 44);

    // Dumpster
    rect('dumpster', 56, 36, 0x2f6b33, (gg) => {
      gg.lineStyle(2, 0x14141a, 1); gg.strokeRect(1, 1, 54, 34);
      gg.fillStyle(0x3d8542, 1); gg.fillRect(2, 2, 52, 7);   // lid highlight
      gg.fillStyle(0x14141a, 1); gg.fillRect(0, 9, 56, 3);
      gg.fillStyle(0x265529, 1); gg.fillRect(12, 16, 6, 16); gg.fillRect(38, 16, 6, 16);
    });

    // Traffic barrier
    rect('barrier', 26, 34, 0xd2622a, (gg) => {
      gg.lineStyle(2, 0x14141a, 1); gg.strokeRect(1, 1, 24, 32);
      gg.fillStyle(0xf0ead8, 1); gg.fillRect(2, 6, 22, 6); gg.fillRect(2, 18, 22, 6);
    });

    // Blockade: stacked crates gating the Lieutenant arena
    g.clear();
    const crate = (cx, cy) => {
      g.fillStyle(0x14141a, 1); g.fillRect(cx, cy, 40, 40);
      g.fillStyle(0x6b4a2e, 1); g.fillRect(cx + 2, cy + 2, 36, 36);
      g.fillStyle(0x7d583a, 1); g.fillRect(cx + 2, cy + 2, 36, 7);
      g.fillStyle(0x14141a, 1);
      g.fillRect(cx + 2, cy + 18, 36, 3);
      g.fillRect(cx + 18, cy + 2, 3, 36);
    };
    crate(4, 120); crate(4, 80); crate(4, 40); crate(4, 0);
    g.generateTexture('blockade', 48, 160);

    // Level 2 ground: cool concrete (rooftop/city, vs L1 warm asphalt)
    rect('ground2', 64, 64, 0x3a3f4a, (gg) => {
      gg.fillStyle(0x454b58, 1); gg.fillRect(0, 0, 64, 8);
      gg.fillStyle(0x14141a, 1); gg.fillRect(0, 8, 64, 3);
      gg.fillStyle(0x2f3440, 1);
      gg.fillRect(14, 28, 16, 3); gg.fillRect(42, 46, 14, 3);
      gg.fillRect(31, 11, 2, 53); // expansion joint
    });

    // --- Level 3 rooftop props -----------------------------------------------
    // Roof vent: metal box with slats (Marksman cover)
    rect('vent', 44, 48, 0x4a525c, (gg) => {
      gg.lineStyle(2, 0x14141a, 1); gg.strokeRect(1, 1, 42, 46);
      gg.fillStyle(0x5a6470, 1); gg.fillRect(2, 2, 40, 8);
      gg.fillStyle(0x14141a, 1);
      gg.fillRect(6, 16, 32, 3); gg.fillRect(6, 24, 32, 3); gg.fillRect(6, 32, 32, 3);
    });

    // Water tank: wooden tank on legs with a cone top (bigger cover)
    g.clear();
    g.fillStyle(0x14141a, 1); g.fillRect(8, 26, 58, 44);          // outline body
    g.fillStyle(0x5a4332, 1); g.fillRect(10, 28, 54, 40);          // staves
    g.fillStyle(0x6b523e, 1);
    g.fillRect(14, 28, 5, 40); g.fillRect(28, 28, 5, 40); g.fillRect(42, 28, 5, 40); g.fillRect(56, 28, 5, 40);
    g.fillStyle(0x14141a, 1);
    g.fillRect(8, 38, 58, 3); g.fillRect(8, 54, 58, 3);            // hoops
    g.fillTriangle(4, 26, 70, 26, 37, 4);                          // cone roof
    g.fillStyle(0x3a3026, 1); g.fillTriangle(8, 25, 66, 25, 37, 7);
    g.fillStyle(0x14141a, 1);
    g.fillRect(14, 70, 6, 18); g.fillRect(54, 70, 6, 18);          // legs
    g.generateTexture('watertank', 74, 88);

    // Rooftop gravel ground: gray-brown with tar seams
    rect('roof', 64, 64, 0x46413a, (gg) => {
      gg.fillStyle(0x524c44, 1); gg.fillRect(0, 0, 64, 8);
      gg.fillStyle(0x14141a, 1); gg.fillRect(0, 8, 64, 3);
      gg.fillStyle(0x3a352e, 1);
      gg.fillRect(10, 22, 4, 4); gg.fillRect(30, 36, 4, 4); gg.fillRect(50, 18, 4, 4);
      gg.fillRect(20, 50, 4, 4); gg.fillRect(44, 44, 4, 4);
      gg.fillStyle(0x2a2620, 1); gg.fillRect(0, 30, 64, 3); // tar seam
    });

    // Seeking pickle missile (Level 5): a pickle with fins. Sure. Why not.
    g.clear();
    g.fillStyle(0x14141a, 1); g.fillEllipse(16, 9, 28, 14);
    g.fillStyle(0x4cc41f, 1); g.fillEllipse(16, 9, 24, 10);
    g.fillStyle(0x9ee87a, 1); g.fillEllipse(20, 7, 8, 4);   // highlight
    g.fillStyle(0x14141a, 1);
    g.fillTriangle(2, 9, -4, 2, -4, 16);                     // tail fin
    g.fillStyle(0xd84a4a, 1); g.fillCircle(29, 9, 3);        // angry nose cone
    g.generateTexture('missile', 34, 18);

    // Gun textures are now loaded as real PNGs in preload() — no procedural
    // generation needed. 'gun_enemy' is just an alias for the pistol; entities
    // that referenced it now use 'gun_pistol' directly.

    // Checkpoint flag
    rect('checkpoint', 10, 64, 0xcccccc, (gg) => {
      gg.fillStyle(0x4cc41f, 1); gg.fillTriangle(10, 4, 10, 24, 34, 14);
    });

    // Heart for the UI
    g.clear();
    g.fillStyle(0xe23b3b, 1);
    g.fillCircle(7, 7, 7);
    g.fillCircle(17, 7, 7);
    g.fillTriangle(0, 10, 24, 10, 12, 24);
    g.fillStyle(0xff8a8a, 1); g.fillCircle(7, 6, 3);
    g.generateTexture('heart', 24, 24);

    g.destroy();

    // Boot finished generating textures — hand off to the title screen.
    this.scene.start('Title');
  }
}
