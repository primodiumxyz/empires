import { formatEther, TransactionReceipt } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { bigintToNumber, Core, entityToPlanetName, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";
import { ampli } from "@/ampli";
import { parseReceipt } from "@/contractCalls/parseReceipt";
import { EmpireEnumToConfig } from "@/util/lookups";
import { withTransactionStatus } from "@/util/notify";

export const createOverrideCalls = (core: Core, { execute }: ExecuteFunctions) => {
  const createShip = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__createShip",
          args: [planetId, overrideCount],
          options: { value: payment, gas: 552401n * 2n },
          txQueueOptions: {
            id: `${planetId}-create-ship`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresCreateShip({
              empires: {
                planetName: entityToPlanetName(planetId),
                overrideCount: bigintToNumber(overrideCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Supporting ${entityToPlanetName(planetId)}`,
        success: `Supported ${entityToPlanetName(planetId)} with ${overrideCount} ship${overrideCount > 1 ? "s" : ""}`,
        error: "Failed to provide support",
      },
    );
  };

  const killShip = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__killShip",
          args: [planetId, overrideCount],
          options: { value: payment, gas: 739007n * 3n },
          txQueueOptions: {
            id: `${planetId}-kill-ship`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresKillShip({
              empires: {
                planetName: entityToPlanetName(planetId),
                overrideCount: bigintToNumber(overrideCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Attacking ${entityToPlanetName(planetId)}`,
        success: `Destroyed ${overrideCount} ship${overrideCount > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`,
        error: "Failed to attack",
      },
    );
  };

  const chargeShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__chargeShield",
          args: [planetId, overrideCount],
          options: { value: payment, gas: 546063n * 2n },
          txQueueOptions: {
            id: `${planetId}-add-shield`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresChargeShield({
              empires: {
                planetName: entityToPlanetName(planetId),
                overrideCount: bigintToNumber(overrideCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Supporting ${entityToPlanetName(planetId)}`,
        success: `Supported ${entityToPlanetName(planetId)} with ${overrideCount} shield${overrideCount > 1 ? "s" : ""}`,
        error: "Failed to provide support",
      },
    );
  };

  const drainShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__drainShield",
          args: [planetId, overrideCount],
          options: { value: payment, gas: 738649n * 2n },
          txQueueOptions: {
            id: `${planetId}-remove-shield`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresDrainShield({
              empires: {
                planetName: entityToPlanetName(planetId),
                overrideCount: bigintToNumber(overrideCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Attacking shields on ${entityToPlanetName(planetId)}`,
        success: `Destroyed ${overrideCount} shield${overrideCount > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`,
        error: "Failed to attack",
      },
    );
  };

  const sellPoints = async (empire: number, amount: bigint, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__sellPoints",
          args: [empire, amount],
          options: { gas: 151271n * 2n },
          txQueueOptions: {
            id: "sell-points",
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresSellPoints({
              empires: {
                empireName: EmpireEnumToConfig[empire as EEmpire].name,
                ethAmount: amount.toString(),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Selling points from ${EmpireEnumToConfig[empire as EEmpire].name} empire`,
        success: `Sold ${formatEther(amount)} point${amount > 1e18 ? "s" : ""} from ${EmpireEnumToConfig[empire as EEmpire].name} empire`,
        error: "Failed to sell points",
      },
    );
  };

  const airdropGold = async (
    empire: number,
    overrideCount: bigint,
    payment: bigint,
    pointsReceived: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__airdropGold",
          args: [empire, overrideCount],
          options: { value: payment, gas: 1_000_000n * 2n }, // TODO: get gas estimate
          txQueueOptions: {
            id: "airdrop-gold",
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresAirdropGold({
              empires: {
                empireName: EmpireEnumToConfig[empire as EEmpire].name,
                overrideCount: bigintToNumber(overrideCount),
                pointsReceived: pointsReceived.toString(),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Airdropping gold to ${EmpireEnumToConfig[empire as EEmpire].name} empire`,
        success: `Airdropped gold to ${EmpireEnumToConfig[empire as EEmpire].name} empire for ${formatEther(pointsReceived)} points`,
        error: "Failed to airdrop gold",
      },
    );
  };

  const tacticalStrike = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__tacticalStrike",
          args: [planetId],
          options: { gas: 738649n * 2n },
          txQueueOptions: {
            id: `${planetId}-tactical-strike`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresTacticalStrike({
              empires: {
                planetName: entityToPlanetName(planetId),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Requesting tactical strike on ${entityToPlanetName(planetId)}`,
        success: `Tactical strike executed on ${entityToPlanetName(planetId)}`,
        error: "Failed to execute tactical strike",
      },
    );
  };

  const placeMagnet = async (
    empire: EEmpire,
    planetId: Entity,
    turnCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__placeMagnet",
          args: [empire, planetId, turnCount],
          options: { value: payment, gas: 546063n * 2n },
          txQueueOptions: {
            id: `${planetId}-place-magnet`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresPlaceMagnet({
              empires: {
                empireName: EmpireEnumToConfig[empire].name,
                planetName: entityToPlanetName(planetId),
                turnCount: bigintToNumber(turnCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Placing ${EmpireEnumToConfig[empire as EEmpire].name} magnet on ${entityToPlanetName(planetId)}`,
        success: `Placed ${EmpireEnumToConfig[empire as EEmpire].name} magnet on ${entityToPlanetName(planetId)} for ${turnCount} turn${turnCount > 1 ? "s" : ""}`,
        error: "Failed to place magnet",
      },
    );
  };

  const boostCharge = async (planetId: Entity, count: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__boostCharge",
          args: [planetId, count],
          options: { value: payment, gas: 738649n * 2n },
          txQueueOptions: {
            id: `${planetId}-boost-charge`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresBoostCharge({
              empires: {
                planetName: entityToPlanetName(planetId),
                chargeCount: bigintToNumber(count),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Boosting charge on ${entityToPlanetName(planetId)}`,
        success: `Boosted ${count} charge${count > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`,
        error: "Failed to boost charge",
      },
    );
  };

  const stunCharge = async (planetId: Entity, count: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__stunCharge",
          args: [planetId, count],
          options: { value: payment, gas: 738649n * 2n },
          txQueueOptions: {
            id: `${planetId}-stun-charge`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresStunCharge({
              empires: {
                planetName: entityToPlanetName(planetId),
                chargeCount: bigintToNumber(count),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Stunning charge on ${entityToPlanetName(planetId)}`,
        success: `Stunned ${count} charge${count > 1 ? "s" : ""} on ${entityToPlanetName(planetId)}`,
        error: "Failed to stun charge",
      },
    );
  };

  const detonateShieldEater = async (planetId: Entity, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__detonateShieldEater",
          args: [],
          options: { value: payment, gas: 1_000_000n * 2n }, // TODO: get gas estimate
          txQueueOptions: {
            id: "detonate-shield-eater",
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresDetonateShieldEater({
              empires: {
                planetName: entityToPlanetName(planetId),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Detonating shield eater on ${entityToPlanetName(planetId)}`,
        success: `Detonated shield eater on ${entityToPlanetName(planetId)}`,
        error: "Failed to detonate shield eater",
      },
    );
  };

  return {
    createShip,
    killShip,
    chargeShield,
    drainShield,
    sellPoints,
    airdropGold,
    tacticalStrike,
    boostCharge,
    stunCharge,
    placeMagnet,
    detonateShieldEater,
  };
};
