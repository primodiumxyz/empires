import { createContext, ReactNode } from "react";

import { PrimodiumGame } from "@primodiumxyz/game";

// Create a context
export const GameContext = createContext<PrimodiumGame | null>(null);

type Props = {
  game: PrimodiumGame;
  children: ReactNode;
};

export const GameProvider = ({ children, game }: Props) => {
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};
