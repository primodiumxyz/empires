import {
  Core,
  execute,
  ExternalAccount,
  LocalAccount,
} from "@primodiumxyz/core";

export const updateWorld = async (
  core: Core,
  deployerAccount: ExternalAccount | LocalAccount,
  onComplete?: () => void
) => {
  const turn = core.tables.Turn.get()?.empire;
  if (!turn) {
    throw new Error("Turn not found");
  }
  const empirePlanets = core.utils.getEmpirePlanets(turn);
  const routineThresholds = empirePlanets.map((planet) =>
    core.utils.getRoutineThresholds(planet)
  );
  return await execute({
    functionName: "Empires__updateWorld",
    args: [routineThresholds],
    options: {
      gas: 30000000n,
    },
    onComplete,
    core,
    playerAccount: deployerAccount,
  });
};
