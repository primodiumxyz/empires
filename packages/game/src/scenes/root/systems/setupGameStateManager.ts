import { GlobalApi } from "@game/api/global";

export const setupGameStateManager = (game: GlobalApi, phaserGame: Phaser.Game) => {
  const GameStateTable = game.tables.GameState;
  phaserGame.events.on(Phaser.Core.Events.HIDDEN, () => GameStateTable.update({ visible: false }));
  phaserGame.events.on(Phaser.Core.Events.VISIBLE, () => GameStateTable.update({ visible: true }));
};
