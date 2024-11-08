import { formatEther, Hex } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { bigintToNumber, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";
import { ampli } from "@/ampli";
import { parseReceipt } from "@/contractCalls/parseReceipt";
import { EmpireEnumToConfig } from "@/util/lookups";
import { withTransactionStatus } from "@/util/notify";

export const createOverrideCalls = (core: Core, { execute }: ExecuteFunctions) => {
  const createShip = async (
    planetId: Entity,
    empire: number,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    const planetName = await core.utils.getPlanetName(planetId);
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__createShip",
          args: [planetId as Hex, empire, overrideCount],
          options: { value: payment, gas: 552401n * 2n },
          txQueueOptions: {
            id: `${planetId}-create-ship`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresCreateShip({
              empires: {
                planetName: planetName,
                overrideCount: bigintToNumber(overrideCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Supporting ${planetName}`,
        success: `Supported ${planetName} with ${overrideCount} ship${overrideCount > 1 ? "s" : ""}`,
        error: "Failed to provide support",
      },
    );
  };

  const chargeShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    const planetName = await core.utils.getPlanetName(planetId);
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__chargeShield",
          args: [planetId as Hex, overrideCount],
          options: { value: payment, gas: 546063n * 2n },
          txQueueOptions: {
            id: `${planetId}-add-shield`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresChargeShield({
              empires: {
                planetName: planetName,
                overrideCount: bigintToNumber(overrideCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Supporting ${planetName}`,
        success: `Supported ${planetName} with ${overrideCount} shield${overrideCount > 1 ? "s" : ""}`,
        error: "Failed to provide support",
      },
    );
  };

  const sellPoints = async (empire: number, amount: bigint, minSalePrice: bigint, endPot: bigint, options?: Partial<TxQueueOptions>) => {
    const { price: expectedValue } = core.utils.getPointPrice(empire, amount);
    if (expectedValue > endPot) throw new Error("Pot is not enough to cover sale");

    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__sellPoints",
          args: [empire, amount, minSalePrice],
          options: { gas: 200000n * 2n },
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
          options: { value: payment, gas: 1_500_000n * 2n }, // TODO: get gas estimate
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
        loading: `Airdropping iridium to ${EmpireEnumToConfig[empire as EEmpire].name} empire`,
        success: `Airdropped iridium to ${EmpireEnumToConfig[empire as EEmpire].name} empire for ${formatEther(pointsReceived)} points`,
        error: "Failed to airdrop iridium",
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
    const planetName = await core.utils.getPlanetName(planetId);
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__placeMagnet",
          args: [empire, planetId as Hex, turnCount],
          options: { value: payment, gas: 1_500_000n * 2n },
          txQueueOptions: {
            id: `${planetId}-place-magnet`,
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresPlaceMagnet({
              empires: {
                empireName: EmpireEnumToConfig[empire].name,
                planetName: planetName,
                turnCount: bigintToNumber(turnCount),
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Placing ${EmpireEnumToConfig[empire as EEmpire].name} magnet on ${planetName}`,
        success: `Placed ${EmpireEnumToConfig[empire as EEmpire].name} magnet on ${planetName} for ${turnCount} turn${turnCount > 1 ? "s" : ""}`,
        error: "Failed to place magnet",
      },
    );
  };

  const detonateShieldEater = async (planetId: Entity, payment: bigint, options?: Partial<TxQueueOptions>) => {
    const planetName = await core.utils.getPlanetName(planetId);
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__detonateShieldEater",
          args: [],
          options: { value: payment, gas: 2_000_000n * 2n }, // TODO: get gas estimate
          txQueueOptions: {
            id: "detonate-shield-eater",
            ...options,
          },
          onComplete: (receipt) => {
            ampli.empiresDetonateShieldEater({
              empires: {
                planetName: planetName,
              },
              ...parseReceipt(receipt),
            });
          },
        }),
      {
        loading: `Detonating shield eater on ${planetName}`,
        success: `Detonated shield eater on ${planetName}`,
        error: "Failed to detonate shield eater",
      },
    );
  };

  const placeAcidRain = async (planetId: Entity, empire: number, payment: bigint, options?: Partial<TxQueueOptions>) => {
    const planetName = await core.utils.getPlanetName(planetId);
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__placeAcid",
          args: [planetId as Hex, empire],
          options: { value: payment, gas: 1_000_000n * 2n }, // TODO: get gas estimate
          txQueueOptions: {
            id: `${planetId}-place-acid`,
            ...options,
          },
          onComplete: (receipt) => {
            // TODO: add acid rain ampli event
            // ampli.empiresPlaceAcid({
            //   empires: {
            //     planetName: getPlanetName(planetId),
            //   },
            //   ...parseReceipt(receipt),
            // });
          },
        }),
      {
        loading: `Placing acid rain on ${planetName}`,
        success: `Placed acid rain on ${planetName}`,
        error: "Failed to place acid rain",
      },
    );
  };

  return {
    createShip,
    chargeShield,
    sellPoints,
    airdropGold,
    placeMagnet,
    detonateShieldEater,
    placeAcidRain,
  };
};
