// Per-level data. The goal: a new level is a new entry here + a thin scene,
// NOT new systems code.

export const LEVELS = {
  1: {
    key: 'Level1',
    title: 'Level 1: The Robbery',
    endCard: 'He got away...',
    nextLevel: 'Level2',
    skyColor: '#241f2b',

    worldWidth: 6400,
    worldHeight: 576,
    floorY: 512,

    playerStart: { x: 120, y: 440 },
    startWeaponTier: 1,

    // Level 1 enemy HP (re-tuned: doubled from the old 50% nerf)
    goonHp: 4,
    throwerHp: 4,

    weaponPickup: { x: 2350, y: 330, tier: 2 },

    platforms: [
      { x: 700,  y: 420, w: 160, h: 32 },
      { x: 1350, y: 400, w: 200, h: 32 },
      { x: 2250, y: 380, w: 220, h: 32 },
      { x: 2900, y: 420, w: 160, h: 32 },
      { x: 3450, y: 390, w: 200, h: 32 },
    ],

    obstacles: [
      { type: 'car',      x: 1120, tint: 0x7a4a4a },
      { type: 'barrier',  x: 1720 },
      { type: 'dumpster', x: 2080 },
      { type: 'car',      x: 2580, tint: 0x4a5a7a },
      { type: 'barrier',  x: 3060 },
      { type: 'dumpster', x: 3330 },
      { type: 'car',      x: 3920 },
      { type: 'barrier',  x: 4600 },
      { type: 'car',      x: 5150, tint: 0x5a7a4a },
      { type: 'dumpster', x: 5650 },
    ],

    enemies: [
      { type: 'goon',    x: 850 },
      { type: 'goon',    x: 1450 },
      { type: 'thrower', x: 1950 },
      { type: 'goon',    x: 2700 },
      { type: 'thrower', x: 3200 },
      { type: 'goon',    x: 3550 },
      { type: 'goon',    x: 3700 },
    ],

    checkpoints: [4250],

    chase: {
      triggerX: 4400,
      banditStartX: 4800,
      escapeX: 6150,
      taunt: 'You\u2019ll never catch me, Law!\nI\u2019m in a real... BIG DILL of a hurry!',
    },
  },

  2: {
    key: 'Level2',
    title: 'Level 2: The City Hunt',
    endCard: '"Why won\u2019t you QUIT, Law?!"',
    nextLevel: 'Level3',
    skyColor: '#1a1f2e', // cooler night-city tone

    worldWidth: 10500,
    worldHeight: 576,
    floorY: 512,
    groundTex: 'ground2', // cool concrete instead of L1 asphalt

    playerStart: { x: 120, y: 440 },
    startWeaponTier: 2, // walks in with the Lt.'s Magnum from Level 1

    // Level 2 is harder — enemies have 2x HP (buffed)
    goonHp: 8,
    throwerHp: 8,
    // after the Lieutenant falls (see bossWeaponDrop below).
    bossWeaponDrop: { tier: 3 },

    // Segments: street 0-2800 | alley 2800-5600 | rooftop access 5600-7600
    // | Lieutenant arena 7600-8550 (flat) | rooftop chase 8750+
    platforms: [
      // Street
      { x: 900,  y: 420, w: 180, h: 32 },
      { x: 1900, y: 400, w: 200, h: 32 },
      // Alley (tighter spacing)
      { x: 3050, y: 420, w: 140, h: 32 },
      { x: 3600, y: 400, w: 150, h: 32 },
      { x: 3950, y: 360, w: 140, h: 32 },   // detour stair 1
      { x: 4100, y: 290, w: 150, h: 32 },   // detour stair 2 — pickup above
      { x: 4700, y: 410, w: 160, h: 32 },
      // Rooftop access (climbing feel)
      { x: 5800, y: 420, w: 170, h: 32 },
      { x: 6400, y: 390, w: 180, h: 32 },
      { x: 7000, y: 340, w: 120, h: 32 },
      // Lieutenant arena (7600-8550): deliberately FLAT — no platforms
      // Rooftop chase: sparse hop ledges
      { x: 9450, y: 420, w: 150, h: 32 },
    ],

    obstacles: [
      // Street: parked traffic
      { type: 'car',      x: 600,  tint: 0x4a5a7a },
      { type: 'barrier',  x: 1300 },
      { type: 'car',      x: 1650, tint: 0x7a4a4a },
      { type: 'dumpster', x: 2350 },
      // Alley: dumpsters everywhere, tight cover
      { type: 'dumpster', x: 3300 },
      { type: 'barrier',  x: 3800 },
      { type: 'dumpster', x: 4450 },
      { type: 'dumpster', x: 5100 },
      { type: 'barrier',  x: 5400 },
      // Rooftop access: AC-unit-ish clutter (dumpster tex reads fine)
      { type: 'barrier',  x: 6100 },
      { type: 'dumpster', x: 6700 },
      { type: 'barrier',  x: 7300 },
      // Chase rooftop hurdles
      { type: 'barrier',  x: 9050 },
      { type: 'dumpster', x: 9700 },
    ],

    // ~1.5x Level 1 density across the run-and-gun stretch (17 vs L1's 7
    // over ~1.7x the distance).
    enemies: [
      // Segment 1 — street: mostly Goons, 1 ThrowerGoon
      { type: 'goon',    x: 750 },
      { type: 'goon',    x: 1150 },
      { type: 'goon',    x: 1550 },
      { type: 'thrower', x: 1850 },
      { type: 'goon',    x: 2250 },
      { type: 'goon',    x: 2600 },
      // Segment 2 — alley: mixed, tighter
      { type: 'goon',    x: 3100 },
      { type: 'thrower', x: 3450 },
      { type: 'goon',    x: 3850 },   // guards the detour stair
      { type: 'goon',    x: 4050 },   // goon cluster under the pickup
      { type: 'thrower', x: 4350 },
      { type: 'goon',    x: 4900 },
      { type: 'thrower', x: 5300 },
      // Segment 3 — rooftop access: primarily ThrowerGoons (chase training)
      { type: 'thrower', x: 5900 },
      { type: 'goon',    x: 6250 },
      { type: 'thrower', x: 6600 },
      { type: 'thrower', x: 6850 },
      { type: 'thrower', x: 7300 },
      // Chase-route hazard: stationary lobbers along the rooftop pursuit
      { type: 'thrower', x: 9300 },
      { type: 'thrower', x: 9850 },
    ],

    // Boss gate before the chase. Arena widened for the 3x-scale Lieutenant
    // and his lunge range.
    lieutenant: {
      x: 8100,          // his mark in the arena
      arenaLeft: 7700,  // crossing this wakes him
      gateX: 8600,      // blockade position until he's down
    },

    checkpoints: [7550, 8650], // before the Lieutenant; at chase start

    chase: {
      triggerX: 8750,
      banditStartX: 9100,
      escapeX: 10350,
      taunt: 'You AGAIN?!\nWhat does it take to LOSE you?!',
    },
  },

  3: {
    key: 'Level3',
    title: 'Level 3: The Rooftop Chase',
    endCard: 'So close...',
    nextLevel: 'Level4',
    skyColor: '#10141f', // deep night, high above the streets

    worldWidth: 10500,
    worldHeight: 576,
    floorY: 512,
    groundTex: 'roof',

    playerStart: { x: 120, y: 440 },
    startWeaponTier: 3, // walks in with The Chief's Rifle

    // This level is enemy-light, obstacle-heavy. Marksmen are the only
    // enemies, at 2.5x base Goon HP.
    marksmanHp: 10,

    // Johnny's Shotgun: segment 2, up a two-jump detour off the main line
    weaponPickup: { x: 6010, y: 250, tier: 4 },

    // Rooftop floor with lethal gaps between segments. Gap widths step up:
    // segment 1 ~100px (gentle), segments 2-3 ~140-160px (committed jumps).
    floorSegments: [
      [0, 1400],     // segment 1: intro
      [1500, 2600],
      [2700, 3500],
      [3640, 4600],  // segment 2: gauntlet
      [4740, 5500],
      [5650, 6300],
      [6450, 7000],
      [7150, 7900],  // segment 3: climax run
      [8050, 8700],
      [8850, 10500], // solid ground for the scripted ending
    ],

    platforms: [
      // Segment 1: generous helpers over the easy gaps
      { x: 900,  y: 420, w: 160, h: 32 },
      { x: 1420, y: 430, w: 150, h: 32 },                 // bridges gap 1
      { x: 2630, y: 430, w: 140, h: 32 },                 // bridges gap 2
      // Segment 2: crumbling bridges + narrow ledges
      { x: 3580, y: 425, w: 140, h: 32, crumble: true },  // over gap 3
      { x: 4620, y: 425, w: 150, h: 32, crumble: true },  // over gap 4
      { x: 5560, y: 420, w: 140, h: 32, crumble: true },  // over gap 5
      { x: 6320, y: 440, w: 100, h: 32 },                 // narrow ledge, gap 6
      // Shotgun detour: two-jump climb off the main path (requires commitment)
      { x: 5750, y: 380, w: 90, h: 32 },                  // first commit jump
      { x: 5960, y: 310, w: 85, h: 32 },                  // second narrow jump up
      // Segment 3: tightest jumps of the level
      { x: 7400, y: 400, w: 80,  h: 32 },                 // narrow ledge
      { x: 7920, y: 425, w: 110, h: 32, crumble: true },  // over gap 7
      { x: 8720, y: 425, w: 110, h: 32, crumble: true },  // over gap 8
    ],

    // Vents and water tanks double as Marksman cover
    obstacles: [
      { type: 'vent',      x: 2040 },
      { type: 'vent',      x: 3900 },
      { type: 'watertank', x: 5140 },
      { type: 'vent',      x: 7580 },
      { type: 'watertank', x: 8440 },
    ],

    enemies: [
      // Segment 1: one Marksman to teach the burst pattern (behind a vent)
      { type: 'marksman', x: 2100 },
      // Segment 2: two, with cover
      { type: 'marksman', x: 5200 },
      { type: 'marksman', x: 3960 },
      // Segment 3: final encounters guarding the climax run
      { type: 'marksman', x: 7640 },
      { type: 'marksman', x: 8500 },
    ],

    // Checkpoint at the start of each segment (platforming-death friendly)
    checkpoints: [200, 3700, 7200],

    // Pace-anchored Bandit: on-screen at the right edge the whole level.
    pursuit: {
      offsetX: 430,        // his anchor distance ahead of Johnny
      closeOffsetX: 130,   // the gap after the climax trigger
      closeTriggerX: 9600, // crossing this starts the scripted ending
    },
  },

  4: {
    key: 'Level4',
    title: null, // no title card — the cutscene IS the opener
    endCard: 'He\u2019s hurt. Finish it.',
    nextLevel: 'Level5',
    skyColor: '#2a3144', // overcast suburban evening

    worldWidth: 16000, // much longer chase
    worldHeight: 576,
    floorY: 512,
    groundTex: 'ground', // back to street asphalt

    playerStart: { x: 120, y: 440 },
    startWeaponTier: 4, // Johnny's Shotgun from Level 3

    // Pure pursuit: NO standard enemies this level. Only him.
    enemies: [],
    platforms: [],
    // obstacles are generated procedurally by Level4Scene from the chunk pool
    obstacles: [],

    // Revenge Scooter unlocked (G key)

    // Tuned for shotgun (13/hit @ ~1.24s cd) + scooter (15 impact) across the
    // much longer chase: ~12-15 solid hits, paced across the whole level.
    banditHp: 160,

    // Chase starts after the cutscene; Level4Scene calls startPursuit itself.
    pursuit: {
      offsetX: 410,
      delayedStart: true,
      // no closeTriggerX: this level ends on Bandit HP zero, not position
    },

    // One checkpoint right where gameplay begins, so chase deaths never
    // replay the cutscene.
    checkpoints: [950, 8000],

    // Chunk pool for procedural obstacle placement (Level4Scene reads this)
    chunkPool: ['car', 'trashcans', 'hedge', 'mailboxes', 'lowwall', 'debris', 'barrier'],
    chunkSpacing: { min: 420, max: 700 },
    chunkZone: { from: 1400, to: 15700 },
  },

  5: {
    key: 'Level5',
    title: 'Level 5: The Reckoning',
    endCard: 'You got him.',
    nextLevel: null, // this is the end of the road
    skyColor: '#0d1117', // dead of night; just the two of them

    // Single-screen arena — no scrolling gauntlet, a focused fight space
    worldWidth: 1024,
    worldHeight: 576,
    floorY: 512,
    groundTex: 'ground',

    playerStart: { x: 110, y: 440 },
    startWeaponTier: 4,   // Johnny's Shotgun

    enemies: [],          // adds are spawned by the boss, not the config
    obstacles: [],

    // Two low refuge ledges for the sludge attack — only a tiny bit above the
    // floor (just enough to be "off the ground" during sludge).
    platforms: [
      { x: 150, y: 486, w: 150, h: 18 },
      { x: 720, y: 486, w: 150, h: 18 },
    ],

    checkpoints: [], // no checkpoints: death restarts the fight from Stage 1

    // Boss config (BanditBoss reads its numbers from constants.BOSS)
    boss: { x: 800 },
  },
};
