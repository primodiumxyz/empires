import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { Core, entityToPlanetName, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";
import { EmpireEnumToName } from "@/util/lookups";
import { notify } from "@/util/notify";

export const createOverrideCalls = (core: Core, { execute }: ExecuteFunctions) => {
  const createShip = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__createShip",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 552401n * 2n },
      txQueueOptions: {
        id: `${planetId}-create-ship`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify(
            "success",
            `Supported with ${overrideCount} ship${overrideCount > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`,
          );
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const removeShip = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__killShip",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 739007n * 2n },
      txQueueOptions: {
        id: `${planetId}-kill-ship`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify(
            "success",
            `Removed ${overrideCount} ship${overrideCount > 1 ? "s" : ""} from ${entityToPlanetName(planetId)}`,
          );
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const addShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__chargeShield",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 546063n * 2n },
      txQueueOptions: {
        id: `${planetId}-add-shield`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify(
            "success",
            `Added ${overrideCount} shield${overrideCount > 1 ? "s" : ""} to ${entityToPlanetName(planetId)}`,
          );
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const removeShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__drainShield",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-remove-shield`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify(
            "success",
            `Removed ${overrideCount} shield${overrideCount > 1 ? "s" : ""} from ${entityToPlanetName(planetId)}`,
          );
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const sellPoints = async (empire: number, amount: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__sellPoints",
      args: [empire, amount],
      options: { gas: 151271n * 2n },
      txQueueOptions: {
        id: "sell-points",
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify("success", `Sold ${formatEther(amount)} points from ${EmpireEnumToName[empire as EEmpire]} empire`);
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const tacticalStrike = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__tacticalStrike",
      args: [planetId],
      options: { gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-tactical-strike`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify("success", `Tactical strike on ${entityToPlanetName(planetId)}`);
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const placeMagnet = async (
    empire: EEmpire,
    planetId: Entity,
    turnCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__placeMagnet",
      args: [empire, planetId, turnCount],
      options: { value: payment, gas: 546063n * 2n },
      txQueueOptions: {
        id: `${planetId}-place-magnet`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify("success", `Placed magnet on ${entityToPlanetName(planetId)}`);
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const boostCharge = async (planetId: Entity, count: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__boostCharge",
      args: [planetId, count],
      options: { value: payment, gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-boost-charge`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify("success", `Boosted ${count} charge${count > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`);
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const stunCharge = async (planetId: Entity, count: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__stunCharge",
      args: [planetId, count],
      options: { value: payment, gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-stun-charge`,
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify("success", `Stunned ${count} charge${count > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`);
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  const detonateShieldEater = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__detonateShieldEater",
      args: [],
      options: { gas: 738649n * 2n }, // TODO: get gas estimate
      txQueueOptions: {
        id: "detonate-shield-eater",
        ...options,
      },
      onComplete: ({ success, error }) => {
        if (success) {
          notify("success", `Detonated shield eater on ${entityToPlanetName(planetId)}`);
        } else {
          notify("error", error || "Unknown error");
        }
      },
    });
  };

  return {
    createShip,
    removeShip,
    addShield,
    removeShield,
    sellPoints,
    tacticalStrike,
    boostCharge,
    stunCharge,
    placeMagnet,
    detonateShieldEater,
  };
};
