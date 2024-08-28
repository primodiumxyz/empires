import { EEmpire } from "@primodiumxyz/contracts";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";

export const createEmpireUtils = (tables: Tables) => {
  const getEmpirePlanets = (empireId: EEmpire): Entity[] => {
    return (tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId })?.itemKeys as Entity[]) ?? [];
  };

  const getNextTurn = (empireId: EEmpire): bigint => {
    const empireCount = tables.P_GameConfig.get()?.empireCount ?? 0;
    const empireTurn = tables.Turn.get()?.empire;
    if (!empireTurn) return 0n;

    const difference = (empireId - empireTurn + empireCount) % empireCount;
    return BigInt(difference);
  };

  const getEmpireInTurns = (turns: bigint): EEmpire => {
    const empireCount = tables.P_GameConfig.get()?.empireCount ?? 0;
    if (empireCount === 0) return EEmpire.NULL;
    const currentEmpireTurn = tables.Turn.get()?.empire ?? EEmpire.NULL;

    const futureEmpire = (currentEmpireTurn + Number(turns)) % empireCount;
    return (futureEmpire === 0 ? empireCount : futureEmpire) as EEmpire;
  };

  return {
    getEmpirePlanets,
    getNextTurn,
    getEmpireInTurns,
  };
};
