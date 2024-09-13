import { GlobalApi } from "@game/api/global";

export const setupGameStateManager = (game: GlobalApi, phaserGame: Phaser.Game) => {
  const GameStateTable = game.tables.GameState;
  phaserGame.events.on(Phaser.Core.Events.PAUSE, () => GameStateTable.update({ visible: false }));
  phaserGame.events.on(Phaser.Core.Events.RESUME, () => GameStateTable.update({ visible: true }));
};
