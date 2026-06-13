# Pickle Bandit — Level 1: The Robbery

2D side-scrolling run-and-gun. You are **Johnny Law**, a cop hunting the
**Pickle Bandit**. Level 1: fight through his goons, grab a better gun, and
chase him down. (Spoiler: he gets away. That's the plot.)

Phaser 3 is vendored locally (`vendor/phaser.min.js`), so the game runs fully
offline — no CDN, no build step.

## Run it

```bash
npx serve .
# or: python3 -m http.server 8000
```

Then open the printed URL (e.g. http://localhost:3000). That's it.

## Controls

| Action     | Keys                      |
|------------|---------------------------|
| Move       | Arrow keys or A / D       |
| Jump       | Space, Up, or W           |
| Shoot      | Z or left-click           |
| Dodge-roll | X or Shift (i-frames!)    |
| Pause      | Esc                       |
| Replay     | R (after level clear)     |

## Level 1 flow

1. **Run-and-gun stretch** — Goons (melee) and ThrowerGoons (lob pickle bombs).
   Grab the **Dill Justice Magnum** from the gold crate partway through.
2. **Checkpoint** at the flag — deaths after this respawn here, not at the start.
3. **Chase finale** — the Bandit appears, taunts, and flees while throwing
   bombs and the occasional revolver shot. Close the distance. He escapes
   (scripted) — *"He got away..."* — and the level clears.

Forgiving by design: 5 hearts, long i-frames, dodge-roll invulnerability,
respawn with full hearts, and every bomb telegraphs (arc → land → blink → boom).

## Project structure

```
index.html
vendor/phaser.min.js        Phaser 3 (vendored)
src/
  main.js                   Phaser config + scene registry
  scenes/
    BootScene.js            generates all placeholder textures
    Level1Scene.js          builds Level 1 entirely from LevelConfig data
    UIScene.js              hearts, weapon name, cards, pause (runs parallel)
  entities/
    Player.js               Johnny: move/jump/shoot/dodge/health/respawn
    Enemy.js                base enemy (hp, hit flash, death)
    Goon.js                 melee mook
    ThrowerGoon.js          bomb lobber (solves the arc to lead you)
    Bandit.js               Level 1 = taunt/flee/escape; boss-mode stub for L5
    Bullet.js               pooled, player + enemy
    PickleBomb.js           arc → arm → blink → AoE blast
  systems/
    WeaponSystem.js         current weapon, fire rate, bullet spawning
    LevelConfig.js          per-level data (layout, enemies, pickup, chase)
  config/
    weapons.js              weapon tier table
    constants.js            all tuning knobs
```

## Adding Level 2 (the whole point of this architecture)

Levels are **data + a thin scene**, not new systems code:

1. **Weapon:** append a `tier: 3` entry in `src/config/weapons.js`.
2. **Level data:** add `LEVELS[2]` in `src/systems/LevelConfig.js` — platforms,
   enemy list, pickup, checkpoint, chase/boss params.
3. **Scene:** copy `Level1Scene.js` → `Level2Scene.js`, point it at `LEVELS[2]`,
   and override only what's actually new (e.g. a different finale). Most of
   Level1Scene is already generic "build from config" code — a good follow-up
   refactor is extracting it into a `BaseLevelScene`.
4. **Register:** import it in `src/main.js` and add to the `scene` array, then
   start it from Level 1's clear flow (`this.scene.start('Level2')`).
5. **New enemy types:** subclass `Enemy`, add to the `ENEMY_TYPES` map in the
   level scene, and reference by type string in the config.

The Bandit's real boss fight (Level 5) goes in `Bandit.enterBossMode()` —
currently a deliberate stub.

## Placeholder art

All textures are generated at boot in `BootScene.js` (rectangles + shapes).
Pickle bombs are deliberately unmistakable: bright green bumpy capsules.
Real art later = replace the texture keys, zero gameplay changes.

## Level 2: The City Hunt (added)

Levels now share `scenes/BaseLevelScene.js` — all gameplay (combat, multi-
checkpoint respawn, mini-boss gate, chase finale) is generic and config-driven.
`Level1Scene`/`Level2Scene` only define their backdrops.

Level 2 adds: 3 segments (street → alley → rooftops, cool night palette),
~1.5x enemy density, the **Captain's Carbine** on an alley detour, the
**Lieutenant** mini-boss (4x Goon HP; telegraphed lunge + bomb throw,
alternating) gating a crate blockade, and a rooftop chase with two stationary
ThrowerGoons lobbing bombs along the route. Clear Level 1 and press **N** to
enter Level 2. Two checkpoints: before the Lieutenant, and at the chase start.

## Level 3: The Rooftop Chase (added)

New mechanic: the Bandit is pace-anchored on-screen at the right edge for the
ENTIRE level — lerped to Johnny's position + offset, throwing bombs on the
ThrowerGoon cadence and firing a single telegraphed revolver shot every 4-6s.
Rooftop terrain is the real enemy: lethal gaps between floor segments,
crumbling platforms (shake ~0.5s, then drop; restored on respawn), and
vents/water tanks as Marksman cover. Marksmen (new, 2.5x Goon HP) fire
3-round bursts after a 0.3s aim flash. Johnny's Shotgun (5-pellet spread,
fastest fire rate yet) waits up a two-jump detour in segment 2. At the climax
trigger the gap visibly closes, Johnny says "I've got you now, Bandit." —
and the Bandit leaps off-screen. Checkpoints at each segment start.

## Level 5: The Reckoning (final boss)

Single-screen arena, two refuge platforms, the Pickle Bandit at 5x scale.
Body contact = 2 hearts (i-frames apply). Two HP pools with their own bars.

Stage 1 (120 HP) randomly cycles: 5-bullet telegraphed burst / slow-turning
seeking pickle missile (commit to a lateral dodge to beat its turn rate) /
triple tiered pickle-bomb volley (close-medium-far, punishes standing still).

Stage transition: hit-stagger -> power-up flash + screen shake -> Stage 2 bar.

Stage 2 (150 HP) randomly cycles: 10-bullet burst / 5-second floor sludge
(get on a platform) / jump-behind-you melee punish (telegraphed crouch ->
leap -> bright wind-up; move or eat 2 hearts) / spawn adds (3 Goons or 2
Marksmen, reused as-is, capped at 4 alive).

Defeat: extended collapse beat -> "You got him." end card. Death restarts
the whole fight from Stage 1 (final-boss stakes). New files: BanditBoss.js
(extends Bandit), SeekingMissile.js. Sludge + adds live in Level5Scene.
Proper credits screen is a flagged follow-up — current end card is the
placeholder per the brief.

## Running on Windows (PowerShell execution-policy fix)

If `npx serve .` fails with "running scripts is disabled on this system",
you have two easy options:

1. **Double-click `PLAY-WINDOWS.bat`** (included) — runs the server via cmd,
   which isn't subject to PowerShell's execution policy, and opens the browser.

2. Or in PowerShell, run this once per session before `npx serve .`:
   `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

   (Scope Process only affects that one window — it resets when you close it,
   so it's safe and doesn't change your system settings.)

VS Code's Live Server extension also works with no setup.

## This patch (sprites, guns, hearts, cutscene polish)

- New darker hooded Pickle Bandit sprite (gungeon-style, glowing eyes).
- "YOU MISSED!" replaces the old deflect taunt.
- Lieutenant HP +50% (32 -> 48).
- Every gun-using character (Johnny + Goons + Marksmen + Lieutenant + the
  final boss) now shows a held weapon sprite at the muzzle, aimed at its
  target. Pickle-bomb throwers correctly excluded.
- Enemies have a ~22% chance to drop a heart on death (heals 1, bobs, expires).
- Level 2: the two pre-boss throwers no longer waste their lobs on a platform.
- Levels 3 & 4: the Bandit runs grounded at floor height with periodic jumps
  instead of floating. L3 still matches Johnny's pace; L4 is a fixed fast pace.
- Level 4 cutscene: Felix just behind Johnny at his height; the death scene
  zooms in; a red blood pool spreads under Felix; the tear is half its old size.
- Level 5: refuge platforms are now low (just above the ground); the jump
  attack lands right behind Johnny; adds (Goons/Marksmen) spawn much less often.

## Title screen + checkpoint regeneration + better guns

- New title screen: olive-green field with pickles raining down, "The /
  Pickle Bandit / The Game" logo, and a BEGIN button (or Enter/Space).
- Checkpoint respawns now regenerate every enemy ahead of the checkpoint,
  fully restore the Lieutenant's health and phase, and revoke any weapon
  picked up after the last checkpoint (the pickup reappears, and the player's
  gun reverts to whatever they carried when they last hit the checkpoint).
- Gun sprites redesigned with proper silhouettes (pistol slide, magnum
  cylinder + gold sight, scoped carbine, pump shotgun, enemy SMG).

## Gun sprites replaced with reference art

Traced the five provided reference guns into clean pixel-art textures:
- Pistol (semi-auto): tier 1 weapon AND the Goons' gun.
- Revolver: tier 2 weapon AND the Pickle Bandit's gun (held + aimed at Johnny).
- Sawn shotgun (all wood): tier 3 weapon.
- Pump shotgun (wood + grey receiver): tier 4 weapon.
- FAMAS bullpup: the Marksmen's and Lieutenant's gun.

## Post-level ability choice system

After clearing Levels 1-4 (not 5), press N to enter a card screen: 3 random
abilities drawn from a pool of 8, pick one with click or 1/2/3. Picks persist
for the run (stored in the game registry) and stack on repeat.

### Key bindings (actives)
- Revenge Scooter ...... **G**  (1 charge, +1 per repeat; retrieve the spent scooter to rearm)
- Mini Pickle Bomb ..... **F**  (~3.5s cooldown, -25% per repeat)
- Decoy Pickle ......... **C**  (fake Johnny pulls enemy aggro 3s, ~8s cooldown)
- Suppressing Fire ..... hold + release **Z / left-click** (0.3s charge -> 1.5s burst at 2x fire rate, ~5.5s cooldown)
- Dash Strike .......... no key — your **dodge-roll (X/Shift)** now damages enemies you pass through
- Ground Slam .......... **S** while airborne (AoE + knockback on landing)

### Passives
- +1 Max Heart (heals on pickup, stacks)
- Movement Speed +15% (additive stacks; also speeds the L3/L4 chase, by design)

### Scooter conflict resolved
The Level 4 brief specced Revenge Scooter as guaranteed; it is now fully
pool-gated like the other actives. Level 4 is beatable on shotgun damage
alone (Bandit HP tuned for it, plus the forced wounded-flee at level's end),
so removing guaranteed-Scooter doesn't break that level. The `scooterEnabled`
level-config flag was removed.

## Bug fixes
- Level 2 background: streetlights now sit on building roofs instead of
  floating as bright blocks; windows dimmed/inset.
- Fixed a freeze on dying mid-Lieutenant-fight: the checkpoint enemy-regen was
  destroying the Lieutenant and then calling reset on the dead object. The
  Lieutenant is now excluded from the regen wipe and reset is body-guarded.

## Gun art = real reference images (this patch)
The hand-traced pixel guns were replaced with the actual reference PNGs.
The screenshots had a baked-in Photoshop transparency checkerboard, so that
grey/white pattern was chroma-keyed out, trimmed, and resized into
assets/guns/{pistol,revolver,sawn,pump,famas}.png, loaded directly in
BootScene.preload(). Held-gun scales/origins retuned for the new image sizes.

## Other changes
- Level 4 Bandit pace slowed (250 -> 205 px/s).
- Lt. Felix spawns at floor height (floorY - 30) in the L4 opening cutscene.
- Final boss now has a scripted death cutscene: zoom on the fallen Bandit,
  Johnny walks up, "For Felix.", pickle-juice pool spreads, then the end card.
