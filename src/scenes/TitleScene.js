import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

// Title screen: olive-green field, pickles raining down forever, the logo,
// and one big BEGIN button. Deliberately simple.
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // Olive-green backdrop
    this.cameras.main.setBackgroundColor('#5a5e23');

    // Falling pickles: a steady rain, recycled as they leave the bottom.
    this.pickles = [];
    for (let i = 0; i < 26; i++) this.pickles.push(this.spawnPickle(true));

    // --- Logo -----------------------------------------------------------------
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 120, 'The', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '52px', color: '#e8f0c0', fontStyle: 'italic',
    }).setOrigin(0.5).setShadow(3, 3, '#2a2e10', 0, true, true).setDepth(10);

    this.add.text(cx, 196, 'Pickle Bandit', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '78px', color: '#9ee87a', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(4, 4, '#1a3010', 0, true, true).setDepth(10);

    this.add.text(cx, 256, 'The Game', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px', color: '#d8e0a8',
    }).setOrigin(0.5).setShadow(2, 2, '#2a2e10', 0, true, true).setDepth(10);

    // --- Begin button ----------------------------------------------------------
    const bw = 240, bh = 64, by = 380;
    const btn = this.add.rectangle(cx, by, bw, bh, 0x1a3010, 1)
      .setStrokeStyle(4, 0x9ee87a).setDepth(10).setInteractive({ useHandCursor: true });
    const btnLabel = this.add.text(cx, by, 'BEGIN GAME', {
      fontFamily: 'monospace', fontSize: '24px', color: '#9ee87a', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    const hover = (on) => {
      btn.setFillStyle(on ? 0x2a4a1a : 0x1a3010);
      btnLabel.setColor(on ? '#d7ff8a' : '#9ee87a');
      this.tweens.add({ targets: [btn, btnLabel], scale: on ? 1.06 : 1, duration: 120 });
    };
    btn.on('pointerover', () => hover(true));
    btn.on('pointerout', () => hover(false));
    btn.on('pointerdown', () => this.begin());

    // Enter/Space also start
    this.input.keyboard.once('keydown-ENTER', () => this.begin());
    this.input.keyboard.once('keydown-SPACE', () => this.begin());

    this.add.text(cx, by + 60, 'click BEGIN  \u2022  or press Enter', {
      fontFamily: 'monospace', fontSize: '13px', color: '#c8d098',
    }).setOrigin(0.5).setDepth(10);

    this.started = false;
  }

  spawnPickle(initial) {
    const x = Phaser.Math.Between(0, GAME_WIDTH);
    const y = initial ? Phaser.Math.Between(-GAME_HEIGHT, GAME_HEIGHT) : Phaser.Math.Between(-80, -20);
    const p = this.add.image(x, y, 'missile') // reuse the pickle-missile art
      .setDepth(1)
      .setScale(Phaser.Math.FloatBetween(0.8, 1.6))
      .setAlpha(0.85)
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    p.vy = Phaser.Math.Between(80, 190);
    p.vr = Phaser.Math.FloatBetween(-2, 2);
    return p;
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.pickles.forEach((p) => {
      p.y += p.vy * dt;
      p.rotation += p.vr * dt;
      if (p.y > GAME_HEIGHT + 40) {
        p.y = Phaser.Math.Between(-80, -20);
        p.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    });
  }

  begin() {
    if (this.started) return;
    this.started = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('UI');
      this.scene.start('Level1');
    });
  }
}
