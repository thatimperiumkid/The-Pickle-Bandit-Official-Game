import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './config/constants.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import Level2Scene from './scenes/Level2Scene.js';
import Level3Scene from './scenes/Level3Scene.js';
import Level4Scene from './scenes/Level4Scene.js';
import Level5Scene from './scenes/Level5Scene.js';
import AbilityChoiceScene from './scenes/AbilityChoiceScene.js';
import UIScene from './scenes/UIScene.js';

// Scene registry. Adding Level 2 = import it, append it here, and start it
// from Level 1's clear flow (or a level-select). See README.
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, Level5Scene, AbilityChoiceScene, UIScene],
};

new Phaser.Game(config);
