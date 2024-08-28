import { Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";

export const createUpdateCalls = (core: Core, { execute }: ExecuteFunctions) => {
  const updateWorld = async (options?: Partial<TxQueueOptions>) => {
    const turn = core.tables.Turn.get()?.empire;
    if (!turn) {
      throw new Error("Turn not found");
    }
    const empirePlanets = core.utils.getEmpirePlanets(turn);
    const routineThresholds = empirePlanets.map((planet) => core.utils.getRoutineThresholds(planet));

    return await execute({
      functionName: "Empires__updateWorld",
      args: [routineThresholds],
      options: {
        gas: 15000000n,
      },
      txQueueOptions: {
        id: `update-world`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  return { updateWorld };
};
