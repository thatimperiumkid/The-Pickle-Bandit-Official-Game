import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ABILITIES } from '../config/abilities.js';
import AbilitySystem from '../systems/AbilitySystem.js';

// Shown between levels (after Levels 1-4 clear). Draws 3 random abilities from
// the pool of 8, lets the player pick one (click or 1/2/3), then loads the
// next level. Level 5 never routes through here.
export default class AbilityChoiceScene extends Phaser.Scene {
  constructor() {
    super('AbilityChoice');
  }

  init(data) {
    this.nextLevel = data.nextLevel; // scene key to start after choosing
  }

  create() {
    this.abilities = new AbilitySystem(this.game);
    this.chosen = false;
    this.cameras.main.setBackgroundColor('#1a2410');
    this.scene.sleep('UI'); // hide gameplay HUD behind the card screen

    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 64, 'CHOOSE AN UPGRADE', {
      fontFamily: 'monospace', fontSize: '34px', color: '#9ee87a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 104, 'click a card  \u2022  or press 1 / 2 / 3', {
      fontFamily: 'monospace', fontSize: '14px', color: '#c8d098',
    }).setOrigin(0.5);

    // Draw 3 random abilities (repeats across rounds allowed; within one draw
    // we avoid showing the same card twice for clarity).
    const pool = Phaser.Utils.Array.Shuffle([...ABILITIES]);
    this.draw = pool.slice(0, 3);

    const cardW = 250, cardH = 300, gap = 40;
    const totalW = cardW * 3 + gap * 2;
    const startX = cx - totalW / 2 + cardW / 2;
    const cardY = GAME_HEIGHT / 2 + 30;

    this.cards = this.draw.map((ab, i) => {
      const x = startX + i * (cardW + gap);
      const owned = this.abilities.stacks(ab.id);

      const bg = this.add.rectangle(x, cardY, cardW, cardH, 0x24340f, 1)
        .setStrokeStyle(3, ab.type === 'passive' ? 0xe8d44a : 0x4ae8c8)
        .setInteractive({ useHandCursor: true });

      const num = this.add.text(x - cardW / 2 + 14, cardY - cardH / 2 + 10, `${i + 1}`, {
        fontFamily: 'monospace', fontSize: '20px', color: '#6a7a48', fontStyle: 'bold',
      }).setOrigin(0, 0);

      const tag = this.add.text(x + cardW / 2 - 14, cardY - cardH / 2 + 12,
        ab.type === 'passive' ? 'PASSIVE' : 'ACTIVE', {
        fontFamily: 'monospace', fontSize: '12px',
        color: ab.type === 'passive' ? '#e8d44a' : '#4ae8c8',
      }).setOrigin(1, 0);

      this.add.text(x, cardY - 90, ab.name, {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
        align: 'center', wordWrap: { width: cardW - 30 },
      }).setOrigin(0.5);

      this.add.text(x, cardY + 20, ab.desc, {
        fontFamily: 'monospace', fontSize: '13px', color: '#cfe0b0',
        align: 'center', wordWrap: { width: cardW - 36 }, lineSpacing: 4,
      }).setOrigin(0.5);

      if (ab.key && ab.key !== '-') {
        this.add.text(x, cardY + cardH / 2 - 40, `KEY: ${ab.key}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#9ee87a',
        }).setOrigin(0.5);
      }
      if (owned > 0) {
        this.add.text(x, cardY + cardH / 2 - 18, `owned x${owned} \u2014 will stack`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#e8b84a',
        }).setOrigin(0.5);
      }

      bg.on('pointerover', () => !this.chosen && bg.setFillStyle(0x35491a));
      bg.on('pointerout', () => !this.chosen && bg.setFillStyle(0x24340f));
      bg.on('pointerdown', () => this.choose(i, bg));

      return { ab, bg };
    });

    // Number-key selection
    ['ONE', 'TWO', 'THREE'].forEach((k, i) => {
      this.input.keyboard.on(`keydown-${k}`, () => {
        if (this.cards[i]) this.choose(i, this.cards[i].bg);
      });
    });
  }

  choose(i, bg) {
    if (this.chosen) return;
    this.chosen = true;
    const ab = this.draw[i];
    this.abilities.selectAbility(ab.id);

    // Brief highlight, then go to the next level
    bg.setStrokeStyle(5, 0xffffff);
    this.tweens.add({ targets: bg, scaleX: 1.06, scaleY: 1.06, duration: 200, yoyo: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, `${ab.name} acquired!`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#9ee87a', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.wake('UI');
        this.scene.start(this.nextLevel);
      });
    });
  }
}
