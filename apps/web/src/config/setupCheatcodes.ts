import { Hex } from "viem";

import { EEmpire, ENPCAction, OTHER_EMPIRE_COUNT, POINTS_UNIT } from "@primodiumxyz/contracts";
import { AccountClient, addressToEntity, Core, entityToPlanetName } from "@primodiumxyz/core";
import { Entity, Properties } from "@primodiumxyz/reactive-tables";
import { ContractCalls } from "@/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";
import { EmpireEnumToName } from "@/util/lookups";
import { notify } from "@/util/notify";

export const setupCheatcodes = (core: Core, accountClient: AccountClient, contractCalls: ContractCalls) => {
  const { tables } = core;
  const { playerAccount } = accountClient;
  const { updateWorld, requestDrip, setTableValue, removeTable } = contractCalls;

  // game
  const factions = tables.Faction.getAll();
  const planets = tables.Planet.getAll();
  const planetsData = planets
    .map((entity) => tables.Planet.get(entity))
    .filter((planetData) => !!planetData?.factionId) as unknown as Properties<typeof tables.Planet.propertiesSchema>[];

  // config
  const gameConfig = tables.P_GameConfig.get();
  const pointConfig = tables.P_PointConfig.get();
  const actionConfig = tables.P_ActionConfig.get();
  const npcActionThresholds = tables.P_NPCActionThresholds.get();
  const npcMoveThresholds = tables.P_NPCMoveThresholds.get();

  // utils
  const getNearbyPlanetEntities = (planet: Properties<typeof tables.Planet.propertiesSchema>) => {
    const { q, r } = { q: Number(planet.q), r: Number(planet.r) };
    return [
      { q: q - 1, r: r },
      { q: q + 1, r: r },
      { q: q, r: r - 1 },
      { q: q, r: r + 1 },
      { q: q - 1, r: r + 1 },
      { q: q + 1, r: r - 1 },
    ]
      .map(({ q, r }) =>
        planets.find((entity) => {
          const planetData = tables.Planet.get(entity);
          return planetData?.q === BigInt(q) && planetData?.r === BigInt(r);
        }),
      )
      .filter(Boolean) as Entity[];
  };

  /* ------------------------------- DESTROYERS ------------------------------- */
  // Set the amount of destroyers on a planet
  const setDestroyers = createCheatcode({
    title: "Set destroyers",
    caption: "Set the amount of destroyers on a planet",
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: entityToPlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })),
      },
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount, planet }) => {
      const success = await setTableValue(
        tables.Planet,
        {
          id: planet.id as Entity,
        },
        { destroyerCount: BigInt(amount.value) },
      );

      if (success) {
        notify("success", `Destroyers set to ${amount.value} on ${entityToPlanetName(planet.id as Entity)}`);
        return true;
      } else {
        notify("error", `Failed to set destroyers on ${entityToPlanetName(planet.id as Entity)}`);
        return false;
      }
    },
  });

  const addPlanetToFaction = async (factionId: EEmpire, planetId: Hex) => {
    try {
      if (tables.Meta_FactionPlanetsSet.hasWithKeys({ factionId, planetId })) return;

      const prevSet = tables.Keys_FactionPlanetsSet.getWithKeys({ factionId })?.itemKeys ?? [];

      await setTableValue(tables.Keys_FactionPlanetsSet, { factionId }, { itemKeys: [...prevSet, planetId] });
      await setTableValue(
        tables.Meta_FactionPlanetsSet,
        { factionId, planetId },
        { stored: true, index: BigInt(prevSet.length - 1) },
      );
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const removePlanetFromFaction = async (factionId: EEmpire, planetId: Hex) => {
    try {
      if (!tables.Meta_FactionPlanetsSet.hasWithKeys({ factionId, planetId })) return;

      if (tables.Keys_FactionPlanetsSet.getWithKeys({ factionId })?.itemKeys.length == 1) {
        await removeTable(tables.Meta_FactionPlanetsSet, { factionId, planetId });
        await removeTable(tables.Keys_FactionPlanetsSet, { factionId });
        return;
      }

      const index = tables.Meta_FactionPlanetsSet.getWithKeys({ factionId, planetId })?.index;
      const currElems = tables.Keys_FactionPlanetsSet.getWithKeys({ factionId })?.itemKeys ?? [];
      if (!index || currElems.length == 0) return;
      const replacement = currElems[currElems.length - 1];

      // update replacement data
      currElems[Number(index)] = replacement;
      currElems.pop();

      setTableValue(tables.Keys_FactionPlanetsSet, { factionId }, { itemKeys: currElems });
      removeTable(tables.Meta_FactionPlanetsSet, { factionId, planetId });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };
  // send destroyers from a planet to another
  const sendDestroyers = createCheatcode({
    title: "Send destroyers",
    caption: "Send destroyers from one planet to another",
    inputs: {
      from: {
        label: "From",
        inputType: "string",
        defaultValue: planets.length > 0 ? entityToPlanetName(planets[0]) : "No planetsData with destroyers",
        options: planets.length > 0 ? planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })) : [],
      },
      to: {
        label: "To",
        inputType: "string",
        options: planets.length > 0 ? planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })) : [],
      },
    },
    execute: async ({ from, to }) => {
      const fromEntity = from.id as Entity;
      const toEntity = to.id as Entity;
      const fromPlanetData = tables.Planet.get(fromEntity);
      console.log({ fromPlanetData });
      const toPlanetData = tables.Planet.get(toEntity);
      if (!fromPlanetData || !toPlanetData) {
        console.log("[CHEATCODE] Send destroyers: invalid planets");
        return false;
      }

      const destroyersToMove = fromPlanetData.destroyerCount ?? BigInt(0);
      if (destroyersToMove === BigInt(0)) {
        console.log("[CHEATCODE] Send destroyers: no destroyers to send");
        return false;
      }

      await setTableValue(tables.Planet, { id: fromEntity }, { destroyerCount: BigInt(0) });

      if (toPlanetData.factionId === fromPlanetData.factionId) {
        return await setTableValue(
          tables.Planet,
          { id: toEntity },
          { destroyerCount: toPlanetData.destroyerCount + destroyersToMove },
        );
      } else {
        const conquer = toPlanetData.destroyerCount < destroyersToMove;
        const remainingDestroyers = conquer
          ? destroyersToMove - toPlanetData.destroyerCount
          : toPlanetData.destroyerCount - destroyersToMove;

        if (conquer) {
          const success = (
            await Promise.all([
              await addPlanetToFaction(fromPlanetData.factionId, toEntity),
              await removePlanetFromFaction(toPlanetData.factionId, toEntity),
              await setTableValue(tables.Planet, { id: toEntity }, { factionId: fromPlanetData.factionId }),
            ])
          ).every(Boolean);

          if (!success) return false;
        }

        const success = await setTableValue(tables.Planet, { id: toEntity }, { destroyerCount: remainingDestroyers });

        if (success) {
          notify(
            "success",
            `Sent ${destroyersToMove} destroyers from ${entityToPlanetName(fromEntity)} to ${entityToPlanetName(
              toEntity,
            )}`,
          );
          return true;
        } else {
          notify(
            "error",
            `Failed to send destroyers from ${entityToPlanetName(fromEntity)} to ${entityToPlanetName(toEntity)}`,
          );
          return false;
        }
      }
    },
  });

  /* ---------------------------------- GOLD ---------------------------------- */
  // set gold count for a planet
  const setGoldCount = createCheatcode({
    title: "Set gold",
    caption: "Set the gold count for a planet",
    inputs: {
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: entityToPlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })),
      },
    },
    execute: async ({ amount, planet }) => {
      const success = await setTableValue(
        tables.Planet,
        {
          id: planet.id as Entity,
        },
        { goldCount: BigInt(amount.value) },
      );

      if (success) {
        notify("success", `Gold set to ${amount.value} on ${entityToPlanetName(planet.id as Entity)}`);
        return true;
      } else {
        notify("error", `Failed to set gold on ${entityToPlanetName(planet.id as Entity)}`);
        return false;
      }
    },
  });

  // generate gold on all planetsData
  const generateGold = createCheatcode({
    title: "Generate gold",
    caption: "Give a specified amount of gold to all planetsData",
    inputs: {
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount }) => {
      const success = await Promise.all(
        planets.map((entity) =>
          setTableValue(
            tables.Planet,
            { id: entity },
            { goldCount: (tables.Planet.get(entity)?.goldCount ?? BigInt(0)) + BigInt(amount.value) },
          ),
        ),
      );

      if (success.every(Boolean)) {
        notify("success", `Generated ${amount.value} gold on all planets`);
        return true;
      } else {
        notify("error", `Failed to generate gold on all planets`);
        return false;
      }
    },
  });

  /* --------------------------------- SHARES --------------------------------- */
  // mint shares from an empire

  const setFactionPlayerPoints = async (playerId: Entity, factionId: EEmpire, value: bigint): Promise<boolean> => {
    try {
      const has = tables.Meta_PointsMap.hasWithKeys({ factionId, playerId });
      if (has) {
        const prevValue = tables.Value_PointsMap.getWithKeys({ factionId, playerId })?.value ?? 0n;

        const newValue = (tables.Faction.getWithKeys({ id: factionId })?.pointsIssued ?? 0n) + value - prevValue;
        if (newValue < 0) throw new Error("Cannot set points to negative value");
        await setTableValue(tables.Faction, { id: factionId }, { pointsIssued: newValue });

        await setTableValue(tables.Value_PointsMap, { factionId, playerId }, { value });
      } else {
        const prevKeys = tables.Keys_PointsMap.getWithKeys({ factionId })?.players ?? [];
        await setTableValue(tables.Keys_PointsMap, { factionId }, { players: [...prevKeys, playerId] });
        await setTableValue(tables.Value_PointsMap, { factionId, playerId }, { value });
        await setTableValue(
          tables.Meta_PointsMap,
          { factionId, playerId },
          { stored: true, index: BigInt(prevKeys.length) },
        );
        const prevValue = tables.Faction.getWithKeys({ id: factionId })?.pointsIssued ?? 0n;
        await setTableValue(tables.Faction, { id: factionId }, { pointsIssued: prevValue + value });
      }
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };
  const givePoints = createCheatcode({
    title: "Give points",
    caption: "Give points from an empire to an address",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        // @ts-expect-error Property '[EEmpire.LENGTH]' does not exist on type 'typeof EEmpire'.
        defaultValue: EmpireEnumToName[Number(factions[0]) as EEmpire],
        // @ts-expect-error Property '[EEmpire.LENGTH]' does not exist on type 'typeof EEmpire'.
        options: factions.map((entity) => ({ id: entity, value: EmpireEnumToName[Number(entity) as EEmpire] })),
      },
      amount: {
        label: "Units",
        inputType: "number",
        defaultValue: 1,
      },
      recipient: {
        label: "Recipient",
        inputType: "string",
        defaultValue: playerAccount.address,
      },
    },
    execute: async ({ empire, amount, recipient }) => {
      const playerId = addressToEntity(recipient.value);
      const factionId = empire.id as EEmpire;
      const currentPoints = tables.Value_PointsMap.getWithKeys({ factionId, playerId })?.value ?? BigInt(0);
      const currentCost = tables.Faction.getWithKeys({ id: factionId })?.pointCost ?? BigInt(0);
      const increaseCost = pointConfig?.pointCostIncrease ?? BigInt(1);

      const pointsToIssue = BigInt(amount.value) * BigInt(OTHER_EMPIRE_COUNT);
      const newPoints = currentPoints + pointsToIssue;

      const success = await Promise.all([
        setFactionPlayerPoints(playerId, factionId, newPoints),
        setTableValue(
          tables.Faction,
          { id: factionId },
          {
            pointCost: currentCost + increaseCost * BigInt(OTHER_EMPIRE_COUNT),
          },
        ),
      ]);

      if (success.every(Boolean)) {
        notify("success", `Gave ${amount.value} points to ${recipient.value} from ${empire.value}`);
        return true;
      } else {
        notify("error", `Failed to give points to ${recipient.value} from ${empire.value}`);
        return false;
      }
    },
  });

  /* ---------------------------------- TIME ---------------------------------- */
  // advance turns
  const advanceTurns = createCheatcode({
    title: "Advance turns",
    caption: "Advance a specified number of turns",
    inputs: {
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount }) => {
      let success = true;
      for (let i = 0; i < amount.value; i++) {
        const txSuccess = await updateWorld();
        if (!txSuccess) {
          success = false;
          break;
        }
      }

      if (success) {
        notify("success", `Advanced ${amount.value} turns`);
        return true;
      } else {
        notify("error", `Failed to advance turns`);
        return false;
      }
    },
  });

  // end game
  const endGame = createCheatcode({
    title: "End game",
    caption: "End the game",
    inputs: {},
    execute: async () => {
      const nextBlock = (await playerAccount.publicClient.getBlockNumber()) + BigInt(1);
      const success = await setTableValue(tables.P_GameConfig, {}, { gameOverBlock: nextBlock });

      if (success) {
        notify("success", `Game ended at block ${nextBlock}`);
        return true;
      } else {
        notify("error", `Failed to end game`);
        return false;
      }
    },
  });

  /* ---------------------------------- UTILS --------------------------------- */
  // drip eth
  const dripEth = createCheatcode({
    title: "Drip",
    caption: "Drip eth to the player account",
    inputs: {},
    execute: async () => {
      requestDrip?.(accountClient.playerAccount.address);
      notify("success", "Dripped eth to player account");
      return true;
    },
  });

  /* --------------------------------- CONFIG --------------------------------- */
  const updateGameConfig = {
    P_GameConfig: createCheatcode({
      title: "Update game config",
      caption: "P_GameConfig",
      inputs: {
        turnLengthBlocks: {
          label: "Turn length blocks",
          inputType: "number",
          defaultValue: gameConfig?.turnLengthBlocks ?? BigInt(1),
        },
        goldGenRate: {
          label: "Gold generation rate",
          inputType: "number",
          defaultValue: gameConfig?.goldGenRate ?? BigInt(1),
        },
        gameOverBlock: {
          label: "Game over block",
          inputType: "number",
          defaultValue: gameConfig?.gameOverBlock ?? BigInt(0),
        },
      },
      execute: async (properties) => {
        const success = await setTableValue(
          tables.P_GameConfig,
          {},
          Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, BigInt(value.value)])),
        );

        if (success) {
          notify("success", "Game config updated");
          return true;
        } else {
          notify("error", "Failed to update game config");
          return false;
        }
      },
    }),

    P_PointConfig: createCheatcode({
      title: "Update point config",
      caption: "P_PointConfig",
      inputs: {
        pointUnit: {
          label: "Point unit",
          inputType: "number",
          defaultValue: pointConfig?.pointUnit ?? BigInt(POINTS_UNIT),
        },
        minPointCost: {
          label: "Min point cost",
          inputType: "number",
          defaultValue: pointConfig?.minPointCost ?? BigInt(POINTS_UNIT * 0.1),
        },
        startPointCost: {
          label: "Start point cost",
          inputType: "number",
          defaultValue: pointConfig?.startPointCost ?? BigInt(POINTS_UNIT * 0.2),
        },
        pointGenRate: {
          label: "Point generation rate",
          inputType: "number",
          defaultValue: pointConfig?.pointGenRate ?? BigInt(POINTS_UNIT * 0.2),
        },
        pointCostIncrease: {
          label: "Point cost increase",
          inputType: "number",
          defaultValue: pointConfig?.pointCostIncrease ?? BigInt(POINTS_UNIT * 0.1),
        },
        pointRake: {
          label: "Point rake",
          inputType: "number",
          defaultValue: pointConfig?.pointRake ?? BigInt(10),
        },
      },
      execute: async (properties) => {
        const success = await setTableValue(
          tables.P_PointConfig,
          {},
          Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, BigInt(value.value)])),
        );

        if (success) {
          notify("success", "Point config updated");
          return true;
        } else {
          notify("error", "Failed to update point config");
          return false;
        }
      },
    }),

    P_ActionConfig: createCheatcode({
      title: "Update action config",
      caption: "P_ActionConfig",
      inputs: {
        actionGenRate: {
          label: "Action generation rate",
          inputType: "number",
          defaultValue: actionConfig?.actionGenRate ?? BigInt(POINTS_UNIT / 2),
        },
        actionCostIncrease: {
          label: "Action cost increase",
          inputType: "number",
          defaultValue: actionConfig?.actionCostIncrease ?? BigInt(POINTS_UNIT / 2),
        },
        startActionCost: {
          label: "Start action cost",
          inputType: "number",
          defaultValue: actionConfig?.startActionCost ?? BigInt(POINTS_UNIT / 2),
        },
        minActionCost: {
          label: "Min action cost",
          inputType: "number",
          defaultValue: actionConfig?.minActionCost ?? BigInt(0),
        },
      },
      execute: async (properties) => {
        const success = await setTableValue(
          tables.P_ActionConfig,
          {},
          Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, BigInt(value.value)])),
        );

        if (success) {
          notify("success", "Action config updated");
          return true;
        } else {
          notify("error", "Failed to update action config");
          return false;
        }
      },
    }),

    P_NPCActionCosts: createCheatcode({
      title: "Update NPC action costs",
      caption: "P_NPCActionCosts",
      inputs: {
        buyDestroyers: {
          label: "Buy destroyers (in gold)",
          inputType: "number",
          defaultValue:
            tables.P_NPCActionCosts.getWithKeys({ action: ENPCAction["BuyDestroyers"] })?.goldCost ?? BigInt(2),
        },
      },
      execute: async ({ buyDestroyers }) => {
        const success = await setTableValue(
          tables.P_NPCActionCosts,
          { action: ENPCAction["BuyDestroyers"] },
          { goldCost: BigInt(buyDestroyers.value) },
        );

        if (success) {
          notify("success", "NPC action costs updated");
          return true;
        } else {
          notify("error", "Failed to update NPC action costs");
          return false;
        }
      },
    }),

    P_NPCActionThresholds: createCheatcode({
      title: "Update NPC action thresholds",
      caption: "P_NPCActionThresholds",
      inputs: {
        none: {
          label: "None (0-100)",
          inputType: "number",
          defaultValue: Number(npcActionThresholds?.none ?? BigInt(0)) / 100,
        },
        buyDestroyers: {
          label: "Buy destroyers (0-100)",
          inputType: "number",
          defaultValue: Number(npcActionThresholds?.buyDestroyers ?? BigInt(0)) / 100,
        },
      },
      execute: async (properties) => {
        if (Object.values(properties).reduce((acc, value) => acc + value.value, 0) !== 100) {
          notify("error", "Thresholds must add up to 100% ");
          return false;
        }

        const success = await setTableValue(
          tables.P_NPCActionThresholds,
          {},
          Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, value.value / 100])),
        );

        if (success) {
          notify("success", "NPC action thresholds updated");
          return true;
        } else {
          notify("error", "Failed to update NPC action thresholds");
          return false;
        }
      },
    }),

    P_NPCMoveThresholds: createCheatcode({
      title: "Update NPC move thresholds",
      caption: "P_NPCMoveThresholds",
      inputs: {
        none: {
          label: "None (0-100)",
          inputType: "number",
          defaultValue: Number(npcMoveThresholds?.none ?? BigInt(0)) / 100,
        },
        expand: {
          label: "Expand (0-100)",
          inputType: "number",
          defaultValue: Number(npcMoveThresholds?.expand ?? BigInt(0)) / 100,
        },
        lateral: {
          label: "Lateral (0-100)",
          inputType: "number",
          defaultValue: Number(npcMoveThresholds?.lateral ?? BigInt(0)) / 100,
        },
        retreat: {
          label: "Retreat (0-100)",
          inputType: "number",
          defaultValue: Number(npcMoveThresholds?.retreat ?? BigInt(0)) / 100,
        },
      },
      execute: async (properties) => {
        if (Object.values(properties).reduce((acc, value) => acc + value.value, 0) !== 100) {
          notify("error", "Thresholds must add up to 100% ");
          return false;
        }

        const success = await setTableValue(
          tables.P_NPCMoveThresholds,
          {},
          Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, value.value / 100])),
        );

        if (success) {
          notify("success", "NPC move thresholds updated");
          return true;
        } else {
          notify("error", "Failed to update NPC move thresholds");
          return false;
        }
      },
    }),
  };

  return [
    setDestroyers,
    sendDestroyers,
    setGoldCount,
    generateGold,
    givePoints,
    advanceTurns,
    endGame,
    dripEth,
    ...Object.values(updateGameConfig),
  ];
};
