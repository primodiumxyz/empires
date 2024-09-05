import { Address, Hex, padHex } from "viem";

import { EEmpire, ERoutine, POINTS_UNIT } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { addressToEntity, Core, ExternalAccount, LocalAccount, TxReceipt } from "@primodiumxyz/core";
import { PrimodiumGame } from "@primodiumxyz/game";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { TableOperation } from "@/contractCalls/contractCalls/dev";
import { ContractCalls } from "@/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";
import { DEFAULT_EMPIRE, EmpireEnumToConfig } from "@/util/lookups";

export const CheatcodeToBg: Record<string, string> = {
  overrides: "bg-red-500/10",
  mechanisms: "bg-yellow-500/10",
  time: "bg-blue-500/10",
  utils: "bg-green-500/10",
  magnet: "bg-purple-900/10",
  shieldEater: "bg-purple-400/10",
  config: "bg-gray-500/10",
};

export const setupCheatcodes = (options: {
  core: Core;
  game: PrimodiumGame;
  playerAccount: ExternalAccount | LocalAccount;
  contractCalls: ContractCalls;
  requestDrip?: (address: Address, force?: boolean) => Promise<TxReceipt | undefined>;
}) => {
  const { core, game, playerAccount, contractCalls, requestDrip } = options;
  const { tables, utils } = core;
  const { devCalls, executeBatch, resetGame: _resetGame, withdrawRake: _withdrawRake, updateWorld } = contractCalls;

  // game
  const empires = tables.Empire.getAll();
  const planets = tables.Planet.getAll();

  // config
  const gameConfig = tables.P_GameConfig.get();
  const pointConfig = tables.P_PointConfig.get();
  const overrideConfig = tables.P_OverrideConfig.get();

  /* ------------------------------- SHIPS ------------------------------- */
  // Set the amount of ships on a planet
  const setShips = createCheatcode({
    title: "Set ships",
    caption: "Set the amount of ships on a planet",
    bg: CheatcodeToBg["overrides"],
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount, planet }) => {
      return await devCalls.setProperties({
        table: tables.Planet,
        keys: {
          id: planet.id as Entity,
        },
        properties: { shipCount: BigInt(amount.value) },
      });
    },
    loading: () => "[CHEATCODE] Setting ships...",
    success: (args) => `Ships set to ${args.amount.value} on ${utils.generatePlanetName(args.planet.id as Entity)}`,
    error: (args) => `Failed to set ships on ${utils.generatePlanetName(args.planet.id as Entity)}`,
  });

  const addPlanetToEmpire = async (empireId: EEmpire, planetId: Hex) => {
    try {
      if (tables.Meta_EmpirePlanetsSet.hasWithKeys({ empireId, planetId })) return true;

      const prevSet = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId })?.itemKeys ?? [];
      await devCalls.batch([
        devCalls.createSetProperties({
          table: tables.Keys_EmpirePlanetsSet,
          keys: { empireId },
          properties: { itemKeys: [...prevSet, planetId] },
        }),
        devCalls.createSetProperties({
          table: tables.Meta_EmpirePlanetsSet,
          keys: { empireId, planetId },
          properties: { stored: true, index: BigInt(prevSet.length - 1) },
        }),
      ]);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const removePlanetFromEmpire = async (empireId: EEmpire, planetId: Hex) => {
    try {
      if (!tables.Meta_EmpirePlanetsSet.hasWithKeys({ empireId, planetId })) return true;

      if (tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId })?.itemKeys.length == 1) {
        await devCalls.batch([
          devCalls.createRemove({ table: tables.Meta_EmpirePlanetsSet, keys: { empireId, planetId } }),
          devCalls.createRemove({ table: tables.Keys_EmpirePlanetsSet, keys: { empireId } }),
        ]);
        return true;
      }

      const index = tables.Meta_EmpirePlanetsSet.getWithKeys({ empireId, planetId })?.index;
      const currElems = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId })?.itemKeys ?? [];
      if (!index || currElems.length == 0) return true;
      const replacement = currElems[currElems.length - 1];

      // update replacement data
      currElems[Number(index)] = replacement;
      currElems.pop();

      await devCalls.batch([
        devCalls.createSetProperties({
          table: tables.Keys_EmpirePlanetsSet,
          keys: { empireId },
          properties: { itemKeys: currElems },
        }),
        devCalls.createRemove({ table: tables.Meta_EmpirePlanetsSet, keys: { empireId, planetId } }),
      ]);

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  // send ships from a planet to another
  const sendShips = createCheatcode({
    title: "Send ships",
    bg: CheatcodeToBg["overrides"],
    caption: "Send ships from one planet to another",
    inputs: {
      from: {
        label: "From",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
      to: {
        label: "To",
        inputType: "string",
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
    },
    execute: async ({ from, to }) => {
      const fromEntity = from.id as Entity;
      const toEntity = to.id as Entity;
      const fromPlanetData = tables.Planet.get(fromEntity);
      const toPlanetData = tables.Planet.get(toEntity);
      if (!fromPlanetData || !toPlanetData) {
        console.log("[CHEATCODE] Send ships: invalid planets");
        return { success: false, error: "Invalid planets" };
      }

      const shipsToMove = fromPlanetData.shipCount ?? BigInt(0);
      if (shipsToMove === BigInt(0)) {
        console.log("[CHEATCODE] Send ships: no ships to send");
        return { success: false, error: "No ships to send" };
      }

      let devOps: TableOperation[] = [
        devCalls.createSetProperties({
          table: tables.Planet,
          keys: { id: fromEntity },
          properties: { shipCount: BigInt(0) },
        }),
      ];

      if (toPlanetData.empireId === fromPlanetData.empireId) {
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Planet,
            keys: { id: toEntity },
            properties: { shipCount: toPlanetData.shipCount + shipsToMove },
          }),
        );

        return await devCalls.batch(devOps);
      } else {
        const conquer = toPlanetData.shipCount < shipsToMove;
        const remainingShips = conquer ? shipsToMove - toPlanetData.shipCount : toPlanetData.shipCount - shipsToMove;

        if (conquer) {
          const successA = await devCalls.batch(devOps);
          if (!successA) return { success: false, error: "Failed to send ships" };

          const successB = (
            await Promise.all([
              await addPlanetToEmpire(fromPlanetData.empireId, toEntity),
              await removePlanetFromEmpire(toPlanetData.empireId, toEntity),
              await devCalls.setProperties({
                table: tables.Planet,
                keys: { id: toEntity },
                properties: { empireId: fromPlanetData.empireId },
              }),
            ])
          ).every(Boolean);

          return { success: successB, error: "Failed to send ships" };
        }

        return await devCalls.setProperties({
          table: tables.Planet,
          keys: { id: toEntity },
          properties: { shipCount: remainingShips },
        });
      }
    },
    loading: () => "[CHEATCODE] Sending ships...",
    success: ({ from, to }) => {
      const fromPlanetData = tables.Planet.get(from.id as Entity);
      const toPlanetData = tables.Planet.get(to.id as Entity);
      const conquer =
        fromPlanetData?.empireId !== toPlanetData?.empireId &&
        (fromPlanetData?.shipCount ?? 0n) < (toPlanetData?.shipCount ?? 0n);
      if (conquer)
        return `Conquered ${utils.generatePlanetName(to.id as Entity)} from ${utils.generatePlanetName(from.id as Entity)}`;

      return `Sent ${fromPlanetData?.shipCount} ships from ${utils.generatePlanetName(from.id as Entity)} to ${utils.generatePlanetName(to.id as Entity)}`;
    },
    error: ({ from, to }) =>
      `Failed to send ships from ${utils.generatePlanetName(from.id as Entity)} to ${utils.generatePlanetName(to.id as Entity)}`,
  });

  /* --------------------------------- SHIELDS -------------------------------- */
  // Set the amount of destroyers on a planet
  const setShields = createCheatcode({
    title: "Set shields",
    caption: "Set the amount of shields on a planet",
    bg: CheatcodeToBg["overrides"],
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount, planet }) => {
      return await devCalls.setProperties({
        table: tables.Planet,
        keys: { id: planet.id as Entity },
        properties: { shieldCount: BigInt(amount.value) },
      });
    },
    loading: () => "[CHEATCODE] Setting shields...",
    success: ({ planet, amount }) =>
      `Shields set to ${amount.value} on ${utils.generatePlanetName(planet.id as Entity)}`,
    error: ({ planet }) => `Failed to set shields on ${utils.generatePlanetName(planet.id as Entity)}`,
  });

  /* ------------------------------- MECHANISMS ------------------------------- */
  // set gold count for a planet
  const setGoldCount = createCheatcode({
    title: "Set gold",
    bg: CheatcodeToBg["mechanisms"],
    caption: "Set the gold count for a planet",
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount, planet }) => {
      return await devCalls.setProperties({
        table: tables.Planet,
        keys: { id: planet.id as Entity },
        properties: { goldCount: BigInt(amount.value) },
      });
    },
    loading: () => "[CHEATCODE] Setting gold count...",
    success: ({ planet, amount }) => `Gold set to ${amount.value} on ${utils.generatePlanetName(planet.id as Entity)}`,
    error: ({ planet }) => `Failed to set gold on ${utils.generatePlanetName(planet.id as Entity)}`,
  });

  // generate gold on all planets
  const generateGold = createCheatcode({
    title: "Generate gold",
    bg: CheatcodeToBg["mechanisms"],
    caption: "Give a specified amount of gold to all planets",
    inputs: {
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount }) => {
      return await devCalls.batch(
        planets.map((entity) =>
          devCalls.createSetProperties({
            table: tables.Planet,
            keys: { id: entity },
            properties: { goldCount: (tables.Planet.get(entity)?.goldCount ?? BigInt(0)) + BigInt(amount.value) },
          }),
        ),
      );
    },
    loading: () => "[CHEATCODE] Generating gold...",
    success: ({ amount }) => `Generated ${amount.value} gold on all planets`,
    error: () => `Failed to generate gold on all planets`,
  });

  // set empire on planet
  const setEmpire = createCheatcode({
    title: "Set empire",
    bg: CheatcodeToBg["mechanisms"],
    caption: "Set the empire of a planet",
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToConfig[DEFAULT_EMPIRE].name,
        options: [
          ...empires.map((entity) => ({
            id: Number(entity) as EEmpire,
            value: EmpireEnumToConfig[Number(entity) as EEmpire].name,
          })),
          {
            id: 0,
            value: "none",
          },
        ],
      },
    },
    execute: async ({ planet, empire }) => {
      const planetId = planet.id as Entity;
      const empireId = empire.id as EEmpire;

      let devOps: TableOperation[] = [
        devCalls.createSetProperties({
          table: tables.Planet,
          keys: { id: planetId },
          properties: { empireId },
        }),
      ];

      devOps.push(
        devCalls.createSetProperties({
          table: tables.Meta_EmpirePlanetsSet,
          keys: { empireId, planetId },
          properties: { stored: true, index: BigInt(0) },
        }),
      );

      return await devCalls.batch(devOps);
    },
    loading: () => "[CHEATCODE] Setting empire...",
    success: ({ planet, empire }) => `Empire set to ${empire.value} for ${planet.value}`,
    error: ({ planet, empire }) => `Failed to set empire to ${empire.value} for ${planet.value}`,
  });

  const setEmpirePlayerPoints = async (
    playerId: Entity,
    empireId: EEmpire,
    value: bigint,
  ): Promise<TxReceipt | { success: boolean; error?: string }> => {
    try {
      let devOps: TableOperation[] = [];

      const has = tables.Meta_PointsMap.hasWithKeys({ empireId, playerId });
      if (has) {
        const prevValue = tables.Value_PointsMap.getWithKeys({ empireId, playerId })?.value ?? 0n;

        const newValue = (tables.Empire.getWithKeys({ id: empireId })?.pointsIssued ?? 0n) + value - prevValue;
        if (newValue < 0) throw new Error("Cannot set points to negative value");
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Empire,
            keys: { id: empireId },
            properties: { pointsIssued: newValue },
          }),
        );
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Value_PointsMap,
            keys: { empireId, playerId },
            properties: { value },
          }),
        );
      } else {
        const prevKeys = tables.Keys_PointsMap.getWithKeys({ empireId })?.players ?? [];
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Keys_PointsMap,
            keys: { empireId },
            properties: { players: [...prevKeys, playerId] },
          }),
        );
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Value_PointsMap,
            keys: { empireId, playerId },
            properties: { value },
          }),
        );
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Meta_PointsMap,
            keys: { empireId, playerId },
            properties: { stored: true, index: BigInt(prevKeys.length) },
          }),
        );

        const prevValue = tables.Empire.getWithKeys({ id: empireId })?.pointsIssued ?? 0n;
        devOps.push(
          devCalls.createSetProperties({
            table: tables.Empire,
            keys: { id: empireId },
            properties: { pointsIssued: prevValue + value },
          }),
        );
      }

      return await devCalls.batch(devOps);
    } catch (e) {
      console.log(e);
      return { success: false, error: "Failed to set points" };
    }
  };

  // mint shares from an empire
  const givePoints = createCheatcode({
    title: "Give points",
    bg: CheatcodeToBg["mechanisms"],
    caption: "Give points from an empire to an address",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToConfig[Number(empires[0]) as EEmpire].name,
        options: empires.map((entity) => ({
          id: entity,
          value: EmpireEnumToConfig[Number(entity) as EEmpire].name,
        })),
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
      const empireId = empire.id as EEmpire;
      const currentPoints = tables.Value_PointsMap.getWithKeys({ empireId, playerId })?.value ?? BigInt(0);
      const currentCost = tables.Empire.getWithKeys({ id: empireId })?.pointCost ?? BigInt(0);
      const increaseCost = pointConfig?.pointCostIncrease ?? BigInt(1);

      const empires = tables.P_GameConfig.get()?.empireCount ?? 0;
      const pointsToIssue = BigInt(amount.value) * BigInt(empires - 1);
      const newPoints = currentPoints + pointsToIssue;

      const success = await Promise.all([
        setEmpirePlayerPoints(playerId, empireId, newPoints),
        devCalls.setProperties({
          table: tables.Empire,
          keys: { id: empireId },
          properties: {
            pointCost: currentCost + increaseCost * BigInt(empires - 1),
          },
        }),
      ]);

      return { success: success.every(Boolean), error: "Failed to give points" };
    },
    loading: () => "[CHEATCODE] Giving points...",
    success: ({ amount, recipient, empire }) =>
      `Gave ${amount.value} points to ${recipient.value} from ${empire.value}`,
    error: ({ recipient, empire }) => `Failed to give points to ${recipient.value} from ${empire.value}`,
  });

  /* ---------------------------------- TIME ---------------------------------- */
  const _advanceTurns = async (amount: number): Promise<TxReceipt> => {
    const turn = tables.Turn.get()?.empire ?? EEmpire.Red;
    const empirePlanets = core.utils.getEmpirePlanets(turn);
    const routineThresholds = empirePlanets.map((planet) => core.utils.getRoutineThresholds(planet));
    const updateWorldCallParams = {
      functionName: "Empires__updateWorld" as const,
      args: [routineThresholds],
      options: {
        gas: 15000000n,
      },
      txQueueOptions: {
        id: `update-world`,
      },
    };

    const currentBlock = tables.BlockNumber.get()?.value ?? 0n;
    let receipt: TxReceipt | undefined;

    for (let i = 0; i < amount; i++) {
      const setTurnCallsParams = devCalls.createSetPropertiesParams({
        table: tables.Turn,
        keys: {},
        properties: { nextTurnBlock: currentBlock },
      });

      receipt = await executeBatch({ systemCalls: [...setTurnCallsParams, updateWorldCallParams] });
      if (!receipt.success) break;
    }

    return receipt ?? { success: false, error: "Failed to advance turns" };
  };

  // advance turns
  const advanceTurns = createCheatcode({
    title: "Advance turns",
    bg: CheatcodeToBg["time"],
    caption: "Advance a specified number of turns",
    inputs: {
      amount: {
        label: "Amount",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ amount }) => {
      return await _advanceTurns(amount.value);
    },
    loading: () => "[CHEATCODE] Advancing turns...",
    success: ({ amount }) => `Advanced ${amount.value} turns`,
    error: () => `Failed to advance turns`,
  });

  // end game
  const endGame = createCheatcode({
    title: "End game",
    bg: CheatcodeToBg["time"],
    caption: "End the game",
    inputs: {},
    execute: async () => {
      const nextBlock = await playerAccount.publicClient.getBlockNumber();
      return await devCalls.setProperties({
        table: tables.P_GameConfig,
        keys: {},
        properties: { gameOverBlock: nextBlock },
      });
    },
    loading: () => "[CHEATCODE] Ending game...",
    success: () => `Game ended`,
    error: () => `Failed to end game`,
  });

  // reset game
  const resetGame = createCheatcode({
    title: "Reset game",
    bg: CheatcodeToBg["time"],
    caption: "Reset the game",
    inputs: {},
    execute: async () => {
      const success = await _resetGame();
      const planets = tables.Planet.getAll();

      if (success) {
        for (const planet of planets) {
          const planetObject = game.MAIN.objects.planet.get(planet);
          const planetEmpire = tables.Planet.get(planet)?.empireId ?? 0;

          planetObject?.updateFaction(planetEmpire);
        }
        for (const planet of planets) {
          const planetObject = game.MAIN.objects.planet.get(planet);
          const planetEmpire = tables.Planet.get(planet)?.empireId ?? 0;

          planetObject?.updateFaction(planetEmpire);
        }
      }

      return success;
    },
    loading: () => "[CHEATCODE] Resetting game...",
    success: () => `Game reset`,
    error: () => `Failed to reset game`,
  });

  /* ---------------------------------- UTILS --------------------------------- */
  // drip eth
  const dripEth = createCheatcode({
    title: "Drip",
    bg: CheatcodeToBg["utils"],
    caption: "Drip eth to the player account",
    inputs: {},
    execute: async () => {
      const receipt = await requestDrip?.(playerAccount.address, true);
      return receipt ?? { success: false, error: "Failed to drip eth" };
    },
    success: () => `Dripped eth to player account`,
  });

  /* --------------------------------- MAGNET --------------------------------- */
  const _removeMagnetTurnRemoval = (empireId: EEmpire, planetId: Entity) => {
    // if there is already a magnet for this planet
    const magnet = tables.Magnet.getWithKeys({ empireId, planetId });
    if (magnet) {
      // find out its entity in MagnetTurnPlanets
      const magnetTurnPlanetsEntity = tables.MagnetTurnPlanets.getAll().find((entity) =>
        tables.MagnetTurnPlanets.get(entity)?.planetIds.includes(planetId),
      );
      if (!magnetTurnPlanetsEntity) return undefined;

      // set planets to be removed in that turn with this planet filtered out
      const keys = tables.MagnetTurnPlanets.getEntityKeys(magnetTurnPlanetsEntity);
      const currentProperties = tables.MagnetTurnPlanets.get(magnetTurnPlanetsEntity);
      const newProperties = { planetIds: currentProperties?.planetIds.filter((id) => id !== planetId) };

      return devCalls.createSetProperties({
        table: tables.MagnetTurnPlanets,
        keys,
        properties: newProperties,
      });
    }

    return undefined;
  };

  const _removeMagnet = (empireId: EEmpire, planetId: Entity) => {
    let devOps: TableOperation[] = [];

    if (tables.Magnet.getWithKeys({ empireId, planetId })) {
      devOps.push(devCalls.createRemove({ table: tables.Magnet, keys: { empireId, planetId } }));
    }

    const magnetTurnRemovalOp = _removeMagnetTurnRemoval(empireId, planetId);
    if (magnetTurnRemovalOp) devOps.push(magnetTurnRemovalOp);

    return devOps;
  };

  const updateTurn = createCheatcode({
    title: "Update turn",
    bg: CheatcodeToBg["time"],
    caption: "Update the turn",
    inputs: {},
    execute: async () => {
      const success = await updateWorld();
      return success;
    },
  });
  const placeMagnet = createCheatcode({
    title: "Place magnet",
    bg: CheatcodeToBg["magnet"],
    caption: "on a planet",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToConfig[Number(empires[0]) as EEmpire].name,
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToConfig[Number(entity) as EEmpire].name })),
      },
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets
          .map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) }))
          .filter(({ id }) => !!tables.Planet.get(id)?.empireId),
      },
      turns: {
        label: "Turns",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ empire, planet, turns }) => {
      let devOps: TableOperation[] = [];
      const planetId = planet.id as Entity;
      const empireId = empire.id as EEmpire;

      const currentTurn = tables.Turn.get()?.value ?? BigInt(1);
      const empires = tables.P_GameConfig.get()?.empireCount ?? 0;
      const endTurn = currentTurn + BigInt(turns.value) * BigInt(empires);

      const magnetTurnRemovalOp = _removeMagnetTurnRemoval(empireId, planetId);
      if (magnetTurnRemovalOp) devOps.push(magnetTurnRemovalOp);

      // set the Magnet
      devOps.push(
        devCalls.createSetProperties({
          table: tables.Magnet,
          keys: { empireId, planetId },
          properties: {
            isMagnet: true,
            lockedPoints: BigInt(0),
            endTurn,
            playerId: padHex(defaultEntity, { size: 32 }),
          },
        }),
      );

      // set MagnetTurnPlanets so it gets removed as well on the end turn
      devOps.push(
        devCalls.createSetProperties({
          table: tables.MagnetTurnPlanets,
          keys: { empireId, endTurn },
          properties: {
            planetIds: [...(tables.MagnetTurnPlanets.getWithKeys({ empireId, endTurn })?.planetIds ?? []), planetId],
          },
        }),
      );

      return await devCalls.batch(devOps);
    },
    loading: () => "[CHEATCODE] Placing magnet...",
    success: ({ empire, planet, turns }) =>
      `Placed magnet on ${planet.value} for ${empire.value} for ${turns.value} turns`,
    error: ({ empire, planet, turns }) =>
      `Failed to place magnet on ${planet.value} for ${empire.value} for ${turns.value} turns`,
  });

  // remove magnet
  const removeMagnet = createCheatcode({
    title: "Remove magnet",
    bg: CheatcodeToBg["magnet"],
    caption: "from a planet",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToConfig[Number(empires[0]) as EEmpire].name,
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToConfig[Number(entity) as EEmpire].name })),
      },
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets
          .map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) }))
          .filter(({ id }) => !!tables.Planet.get(id)?.empireId),
      },
    },
    execute: async ({ empire, planet }) => {
      const planetId = planet.id as Entity;
      const empireId = empire.id as EEmpire;

      return await devCalls.batch(_removeMagnet(empireId, planetId));
    },
    loading: () => "[CHEATCODE] Removing magnet...",
    success: ({ empire, planet }) => `Removed magnet on ${planet.value} for ${empire.value}`,
    error: ({ empire, planet }) => `Failed to remove magnet on ${planet.value} for ${empire.value}`,
  });

  // remove all magnets
  const removeAllMagnets = createCheatcode({
    title: "Remove all magnets",
    bg: CheatcodeToBg["magnet"],
    caption: "for an empire",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToConfig[Number(empires[0]) as EEmpire].name,
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToConfig[Number(entity) as EEmpire].name })),
      },
    },
    execute: async ({ empire }) => {
      const empireId = empire.id as EEmpire;
      const planets = tables.Planet.getAll();
      const devOps = planets.map((entity) => _removeMagnet(empireId, entity)).flat();

      return await devCalls.batch(devOps);
    },
    loading: () => "[CHEATCODE] Removing all magnets...",
    success: ({ empire }) => `Removed all magnets for ${empire.value}`,
    error: ({ empire }) => `Failed to remove all magnets for ${empire.value}`,
  });

  // withdraw rake
  const withdrawRake = createCheatcode({
    title: "Withdraw rake",
    bg: CheatcodeToBg["utils"],
    caption:
      "The rake is an essential part of the game. It is used to fund the game and is collected from the pot. This cheatcode allows you to withdraw the rake from the pot. That is why it is called withdraw rake.",
    inputs: {},
    execute: async () => {
      return await _withdrawRake();
    },
    loading: () => "[CHEATCODE] Withdrawing rake...",
    success: () => `Rake withdrawn`,
    error: () => `Failed to withdraw rake`,
  });

  /* ------------------------------ SHIELD EATER ------------------------------ */
  // place shield eater on planet
  const moveShieldEater = createCheatcode({
    title: "Move shield eater",
    bg: CheatcodeToBg["shieldEater"],
    caption: "to planet",
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
    },
    execute: async ({ planet }) => {
      return await devCalls.setProperties({
        table: tables.ShieldEater,
        keys: {},
        properties: { currentPlanet: planet.id as Entity },
      });
    },
    loading: () => "[CHEATCODE] Moving shield eater...",
    success: ({ planet }) => `Shield eater moved to ${planet.value}`,
    error: ({ planet }) => `Failed to move shield eater to ${planet.value}`,
  });

  // set shield eater destination
  const setShieldEaterDestination = createCheatcode({
    title: "Set shield eater destination",
    bg: CheatcodeToBg["shieldEater"],
    caption: "to planet",
    inputs: {
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: utils.generatePlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: utils.generatePlanetName(entity) })),
      },
    },
    execute: async ({ planet }) => {
      return await devCalls.setProperties({
        table: tables.ShieldEater,
        keys: {},
        properties: { destinationPlanet: planet.id as Entity },
      });
    },
    loading: () => "[CHEATCODE] Setting shield eater destination...",
    success: ({ planet }) => `Shield eater destination set to ${planet.value}`,
    error: ({ planet }) => `Failed to set shield eater destination to ${planet.value}`,
  });

  // reset shield eater countdown
  const feedShieldEater = createCheatcode({
    title: "Feed shield eater",
    bg: CheatcodeToBg["shieldEater"],
    caption: "set ready to detonate",
    inputs: {},
    execute: async () => {
      const threshold = tables.P_ShieldEaterConfig.get()?.detonationThreshold ?? BigInt(0);
      return await devCalls.setProperties({
        table: tables.ShieldEater,
        keys: {},
        properties: { currentCharge: threshold },
      });
    },
    loading: () => "[CHEATCODE] Feeding shield eater...",
    success: () => `Shield eater ready to detonate`,
    error: () => `Failed to feed shield eater`,
  });

  /* --------------------------------- CONFIG --------------------------------- */
  const updateGameConfig = {
    P_GameConfig: createCheatcode({
      title: "Update game config",
      bg: CheatcodeToBg["config"],
      caption: "P_GameConfig",
      inputs: {
        empireCount: {
          label: "Empire count",
          inputType: "number",
          defaultValue: gameConfig?.empireCount ?? 1,
        },
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
        roundTimeLeftInSeconds: {
          label: "Round time left",
          inputType: "number",
          defaultValue: 1000,
        },
        gameStartTimestamp: {
          label: "Game start block",
          inputType: "number",
          defaultValue: gameConfig?.gameStartTimestamp ?? BigInt(0),
        },
      },
      execute: async (properties) => {
        const currBlock = tables.BlockNumber.get() ?? { value: 0n, avgBlockTime: 0 };
        const finalBlockFromTimeLeft =
          BigInt(properties.roundTimeLeftInSeconds.value * currBlock.avgBlockTime) + currBlock.value;
        const newProperties = {
          empireCount: Number(properties.empireCount.value),
          turnLengthBlocks: BigInt(properties.turnLengthBlocks.value),
          goldGenRate: BigInt(properties.goldGenRate.value),
          gameOverBlock: finalBlockFromTimeLeft,
          gameStartTimestamp: BigInt(properties.gameStartTimestamp.value),
        };

        return await devCalls.setProperties({
          table: tables.P_GameConfig,
          keys: {},
          properties: newProperties,
        });
      },
      loading: () => "[CHEATCODE] Updating game config...",
      success: () => `Game config updated`,
      error: () => `Failed to update game config`,
    }),

    P_PointConfig: createCheatcode({
      title: "Update point config",
      bg: CheatcodeToBg["config"],
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
        return await devCalls.setProperties({
          table: tables.P_PointConfig,
          keys: {},
          properties: Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, BigInt(value.value)])),
        });
      },
      loading: () => "[CHEATCODE] Updating point config...",
      success: () => `Point config updated`,
      error: () => `Failed to update point config`,
    }),

    P_OverrideConfig: createCheatcode({
      title: "Update override config",
      bg: CheatcodeToBg["config"],
      caption: "P_OverrideConfig",
      inputs: {
        overrideAction: {
          label: "Override action",
          inputType: "number",
          defaultValue: EOverride.CreateShip,
          options: [
            { id: EOverride.CreateShip, value: "CreateShip" },
            { id: EOverride.ChargeShield, value: "ChargeShield" },
            { id: EOverride.PlaceMagnet, value: "PlaceMagnet" },
          ],
        },
        overrideGenRate: {
          label: "Override generation rate",
          inputType: "number",
          defaultValue: overrideConfig?.overrideGenRate ?? BigInt(POINTS_UNIT / 2),
        },
        overrideCostIncrease: {
          label: "Override cost increase",
          inputType: "number",
          defaultValue: overrideConfig?.overrideCostIncrease ?? BigInt(POINTS_UNIT / 2),
        },
        startOverrideCost: {
          label: "Start override cost",
          inputType: "number",
          defaultValue: overrideConfig?.startOverrideCost ?? BigInt(POINTS_UNIT / 2),
        },
        minOverrideCost: {
          label: "Min override cost",
          inputType: "number",
          defaultValue: overrideConfig?.minOverrideCost ?? BigInt(0),
        },
      },
      execute: async (properties) => {
        const { overrideAction, ...rest } = properties;
        return await devCalls.setProperties({
          table: tables.P_OverrideConfig,
          keys: { overrideAction: overrideAction.id as EOverride },
          properties: Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, BigInt(value.value)])),
        });
      },
      loading: () => "[CHEATCODE] Updating override config...",
      success: () => `Override config updated`,
      error: () => `Failed to update override config`,
    }),

    P_RoutineCosts: createCheatcode({
      title: "Update routine costs",
      bg: CheatcodeToBg["config"],
      caption: "P_RoutineCosts",
      inputs: {
        buyShips: {
          label: "Buy ships (in gold)",
          inputType: "number",
          defaultValue: tables.P_RoutineCosts.getWithKeys({ routine: ERoutine["BuyShips"] })?.goldCost ?? BigInt(2),
        },
      },
      execute: async ({ buyShips }) => {
        return await devCalls.setProperties({
          table: tables.P_RoutineCosts,
          keys: { routine: ERoutine["BuyShips"] },
          properties: { goldCost: BigInt(buyShips.value) },
        });
      },
      loading: () => "[CHEATCODE] Updating routine costs...",
      success: () => `Routine costs updated`,
      error: () => `Failed to update routine costs`,
    }),
  };

  return [
    updateTurn,
    advanceTurns,
    endGame,
    resetGame,
    dripEth,
    setShips,
    sendShips,
    setShields,
    setGoldCount,
    generateGold,
    setEmpire,
    givePoints,
    placeMagnet,
    removeMagnet,
    removeAllMagnets,
    moveShieldEater,
    setShieldEaterDestination,
    feedShieldEater,
    withdrawRake,
    ...Object.values(updateGameConfig),
  ];
};
