import { useCore } from "@primodiumxyz/core/react";

export const CurrentTurn = () => {
  const { tables } = useCore();

  const turn = tables.Turn.use();

  if (!turn) return null;

  return <p className="absolute bottom-0 left-1/2 m-5 -translate-x-1/2 font-bold">Current turn: {turn.empire}</p>;
};
