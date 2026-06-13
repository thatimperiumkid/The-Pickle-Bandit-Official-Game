import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

// Runs in parallel with gameplay. Talks to it only via game.events,
// so any future level scene gets this UI for free.
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.hearts = [];
    this.ensureHearts(5); // base 5; grows if max increases

    this.weaponText = this.add
      .text(20, 50, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffe066' })
      .setScrollFactor(0)
      .setDepth(100);

    // Boss health bar: hidden until the Lieutenant engages
    this.bossBarBg = this.add
      .rectangle(GAME_WIDTH / 2, 36, 360, 18, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.bossBarFill = this.add
      .rectangle(GAME_WIDTH / 2 - 178, 36, 356, 14, 0xe23b3b, 1)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101).setVisible(false);
    this.bossBarLabel = this.add
      .text(GAME_WIDTH / 2, 18, 'THE LIEUTENANT', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101).setVisible(false);

    const ev = this.game.events;
    ev.on('hearts-changed', this.onHearts, this);
    ev.on('weapon-changed', this.onWeapon, this);

    // Recover state if gameplay booted first
    const hearts = this.registry.get('hearts');
    if (hearts !== undefined) this.onHearts(hearts, this.registry.get('maxHearts'));
    const weapon = this.registry.get('weapon');
    if (weapon) this.weaponText.setText(weapon.name.toUpperCase());
    ev.on('show-title', this.showTitle, this);
    ev.on('show-end', this.showEnd, this);
    ev.on('show-toast', this.showToast, this);
    ev.on('game-paused', this.onPause, this);
    ev.on('level-restarted', this.clearCards, this);
    ev.on('level-restarted', this.hideBossBar, this);
    ev.on('lieutenant-engaged', (f) => this.showBossBar(f, 'THE LIEUTENANT'));
    ev.on('lieutenant-health', this.setBossHealth, this);
    ev.on('lieutenant-defeated', this.hideBossBar, this);
    ev.on('bandit-engaged', (f) => this.showBossBar(f, 'THE PICKLE BANDIT'));
    ev.on('bandit-health', this.setBossHealth, this);
    ev.on('bandit-defeated', this.hideBossBar, this);
    ev.on('boss-bar-show', ({ label, fraction }) => this.showBossBar(fraction, label));
    ev.on('boss-bar-health', this.setBossHealth, this);
    ev.on('boss-bar-hide', this.hideBossBar, this);

    // Esc pause: UI scene keeps running while gameplay freezes
    this.input.keyboard.on('keydown-ESC', () => {
      const key = this.registry.get('currentLevel') || 'Level1';
      const level = this.scene.get(key);
      if (!level || !level.scene.isActive() && !level.scene.isPaused()) return;
      if (level.scene.isPaused()) {
        level.scene.resume();
        ev.emit('game-paused', false);
      } else if (!level.levelCleared) {
        level.scene.pause();
        ev.emit('game-paused', true);
      }
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off('hearts-changed', this.onHearts, this);
      ev.off('weapon-changed', this.onWeapon, this);
      ev.off('show-title', this.showTitle, this);
      ev.off('show-end', this.showEnd, this);
      ev.off('show-toast', this.showToast, this);
      ev.off('game-paused', this.onPause, this);
      ev.off('level-restarted', this.clearCards, this);
      ev.off('level-restarted', this.hideBossBar, this);
      ev.off('lieutenant-engaged');
      ev.off('lieutenant-health', this.setBossHealth, this);
      ev.off('lieutenant-defeated', this.hideBossBar, this);
      ev.off('bandit-engaged');
      ev.off('bandit-health', this.setBossHealth, this);
      ev.off('bandit-defeated', this.hideBossBar, this);
      ev.off('boss-bar-show');
      ev.off('boss-bar-health', this.setBossHealth, this);
      ev.off('boss-bar-hide', this.hideBossBar, this);
    });
  }

  ensureHearts(n) {
    while (this.hearts.length < n) {
      const i = this.hearts.length;
      this.hearts.push(
        this.add.image(28 + i * 30, 28, 'heart').setScrollFactor(0).setDepth(100)
      );
    }
  }

  onHearts(current, max) {
    if (max) this.ensureHearts(max);
    const shown = max || this.hearts.length;
    this.hearts.forEach((h, i) => {
      h.setVisible(i < shown);
      h.setAlpha(i < current ? 1 : 0.18);
    });
  }

  onWeapon(weapon, isUpgrade) {
    this.weaponText.setText(weapon.name.toUpperCase());
    if (isUpgrade) {
      this.showToast(`NEW WEAPON: ${weapon.name.toUpperCase()}`, '#ffe066');
    }
  }

  bigCard(text, sub = '') {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const shade = this.add
      .rectangle(cx, cy, GAME_WIDTH, 130, 0x000000, 0.65)
      .setScrollFactor(0)
      .setDepth(110);
    const title = this.add
      .text(cx, cy - (sub ? 14 : 0), text, {
        fontFamily: 'monospace', fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    const subText = sub
      ? this.add
          .text(cx, cy + 26, sub, { fontFamily: 'monospace', fontSize: '15px', color: '#d7ff8a' })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(111)
      : null;
    const parts = [shade, title, subText].filter(Boolean);
    this.cards = (this.cards || []).concat(parts);
    return parts;
  }

  clearCards() {
    (this.cards || []).forEach((c) => c.destroy());
    this.cards = [];
    this.pauseParts = null;
  }

  showTitle(text) {
    const parts = this.bigCard(text);
    this.time.delayedCall(2200, () =>
      this.tweens.add({
        targets: parts, alpha: 0, duration: 400,
        onComplete: () => parts.forEach((p) => p.destroy()),
      })
    );
  }

  showEnd(text, sub) {
    this.bigCard(text, sub);
  }

  showToast(text, color = '#ffffff') {
    const t = this.add
      .text(GAME_WIDTH / 2, 110, text, {
        fontFamily: 'monospace', fontSize: '18px', color, fontStyle: 'bold',
        backgroundColor: '#00000099', padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(105);
    this.tweens.add({
      targets: t, y: 90, alpha: 0, delay: 1400, duration: 500,
      onComplete: () => t.destroy(),
    });
  }

  showBossBar(fraction, label) {
    if (label) this.bossBarLabel.setText(label);
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
    this.bossBarLabel.setVisible(true);
    this.setBossHealth(fraction);
  }

  setBossHealth(fraction) {
    this.bossBarFill.width = 356 * Phaser.Math.Clamp(fraction, 0, 1);
    // Color shifts to signal the phase-2 transition at 50%
    this.bossBarFill.setFillStyle(fraction <= 0.5 ? 0xff8a3a : 0xe23b3b);
  }

  hideBossBar() {
    this.bossBarBg.setVisible(false);
    this.bossBarFill.setVisible(false);
    this.bossBarLabel.setVisible(false);
  }

  onPause(paused) {
    if (paused) {
      this.pauseParts = this.bigCard('PAUSED', 'Esc to resume');
    } else if (this.pauseParts) {
      this.pauseParts.forEach((p) => p.destroy());
      this.pauseParts = null;
    }
  }
}
