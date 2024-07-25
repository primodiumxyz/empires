import { createGame as _createGame } from "@engine/lib/core/createGame";
import { Game, GameConfig } from "@engine/lib/types";

export const createGame = async (config: GameConfig): Promise<Game> => {
  return await _createGame(config);
};
