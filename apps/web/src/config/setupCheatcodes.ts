import { Hex, padHex } from "viem";

import { EEmpire, ERoutine, OTHER_EMPIRE_COUNT, POINTS_UNIT } from "@primodiumxyz/contracts";
import { AccountClient, addressToEntity, Core, entityToPlanetName } from "@primodiumxyz/core";
import { PrimodiumGame } from "@primodiumxyz/game";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { ContractCalls } from "@/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";
import { EmpireEnumToName } from "@/util/lookups";
import { notify } from "@/util/notify";

export const CheatcodeToBg: Record<string, string> = {
  ships: "bg-red-500/10",
  gold: "bg-yellow-500/10",
  points: "bg-green-500/10",
  time: "bg-blue-500/10",
  utils: "bg-gray-500/10",
  magnet: "bg-purple-700/10",
  tacticalStrike: "bg-purple-500/10",
  config: "bg-gray-500/10",
};

export const setupCheatcodes = (
  core: Core,
  game: PrimodiumGame,
  accountClient: AccountClient,
  contractCalls: ContractCalls,
) => {
  const { tables } = core;
  const { playerAccount } = accountClient;
  const {
    updateWorld,
    requestDrip,
    setTableProperties,
    removeTableRecord,
    resetGame: _resetGame,
    tacticalStrike,
  } = contractCalls;

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
    bg: CheatcodeToBg["ships"],
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
      const success = await setTableProperties(
        tables.Planet,
        {
          id: planet.id as Entity,
        },
        { shipCount: BigInt(amount.value) },
      );

      if (success) {
        notify("success", `Ships set to ${amount.value} on ${entityToPlanetName(planet.id as Entity)}`);
        return true;
      } else {
        notify("error", `Failed to set ships on ${entityToPlanetName(planet.id as Entity)}`);
        return false;
      }
    },
  });

  const addPlanetToEmpire = async (empireId: EEmpire, planetId: Hex) => {
    try {
      if (tables.Meta_EmpirePlanetsSet.hasWithKeys({ empireId, planetId })) return true;

      const prevSet = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId })?.itemKeys ?? [];

      await setTableProperties(tables.Keys_EmpirePlanetsSet, { empireId }, { itemKeys: [...prevSet, planetId] });
      await setTableProperties(
        tables.Meta_EmpirePlanetsSet,
        { empireId, planetId },
        { stored: true, index: BigInt(prevSet.length - 1) },
      );
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
        await removeTableRecord(tables.Meta_EmpirePlanetsSet, { empireId, planetId });
        await removeTableRecord(tables.Keys_EmpirePlanetsSet, { empireId });
        return true;
      }

      const index = tables.Meta_EmpirePlanetsSet.getWithKeys({ empireId, planetId })?.index;
      const currElems = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId })?.itemKeys ?? [];
      if (!index || currElems.length == 0) return true;
      const replacement = currElems[currElems.length - 1];

      // update replacement data
      currElems[Number(index)] = replacement;
      currElems.pop();

      setTableProperties(tables.Keys_EmpirePlanetsSet, { empireId }, { itemKeys: currElems });
      removeTableRecord(tables.Meta_EmpirePlanetsSet, { empireId, planetId });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };
  // send ships from a planet to another
  const sendShips = createCheatcode({
    title: "Send ships",
    bg: CheatcodeToBg["ships"],
    caption: "Send ships from one planet to another",
    inputs: {
      from: {
        label: "From",
        inputType: "string",
        defaultValue: entityToPlanetName(planets[0]),
        options: planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })),
      },
      to: {
        label: "To",
        inputType: "string",
        options: planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })),
      },
    },
    execute: async ({ from, to }) => {
      const fromEntity = from.id as Entity;
      const toEntity = to.id as Entity;
      const fromPlanetData = tables.Planet.get(fromEntity);
      const toPlanetData = tables.Planet.get(toEntity);
      if (!fromPlanetData || !toPlanetData) {
        console.log("[CHEATCODE] Send ships: invalid planets");
        return false;
      }

      const shipsToMove = fromPlanetData.shipCount ?? BigInt(0);
      if (shipsToMove === BigInt(0)) {
        console.log("[CHEATCODE] Send ships: no ships to send");
        return false;
      }

      await setTableProperties(tables.Planet, { id: fromEntity }, { shipCount: BigInt(0) });

      if (toPlanetData.empireId === fromPlanetData.empireId) {
        return await setTableProperties(
          tables.Planet,
          { id: toEntity },
          { shipCount: toPlanetData.shipCount + shipsToMove },
        );
      } else {
        const conquer = toPlanetData.shipCount < shipsToMove;
        const remainingShips = conquer ? shipsToMove - toPlanetData.shipCount : toPlanetData.shipCount - shipsToMove;

        if (conquer) {
          const success = (
            await Promise.all([
              await addPlanetToEmpire(fromPlanetData.empireId, toEntity),
              await removePlanetFromEmpire(toPlanetData.empireId, toEntity),
              await setTableProperties(tables.Planet, { id: toEntity }, { empireId: fromPlanetData.empireId }),
            ])
          ).every(Boolean);

          if (!success) return false;
        }

        const success = await setTableProperties(tables.Planet, { id: toEntity }, { shipCount: remainingShips });

        if (success) {
          notify(
            "success",
            `Sent ${shipsToMove} ships from ${entityToPlanetName(fromEntity)} to ${entityToPlanetName(toEntity)}`,
          );
          return true;
        } else {
          notify(
            "error",
            `Failed to send ships from ${entityToPlanetName(fromEntity)} to ${entityToPlanetName(toEntity)}`,
          );
          return false;
        }
      }
    },
  });

  /* --------------------------------- SHIELDS -------------------------------- */
  // Set the amount of destroyers on a planet
  const setShields = createCheatcode({
    title: "Set shields",
    caption: "Set the amount of shields on a planet",
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
      const success = await setTableProperties(
        tables.Planet,
        {
          id: planet.id as Entity,
        },
        { shieldCount: BigInt(amount.value) },
      );

      if (success) {
        notify("success", `Shields set to ${amount.value} on ${entityToPlanetName(planet.id as Entity)}`);
        return true;
      } else {
        notify("error", `Failed to set shields on ${entityToPlanetName(planet.id as Entity)}`);
        return false;
      }
    },
  });

  /* ---------------------------------- GOLD ---------------------------------- */
  // set gold count for a planet
  const setGoldCount = createCheatcode({
    title: "Set gold",
    bg: CheatcodeToBg["gold"],
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
      const success = await setTableProperties(
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

  // generate gold on all planets
  const generateGold = createCheatcode({
    title: "Generate gold",
    bg: CheatcodeToBg["gold"],
    caption: "Give a specified amount of gold to all planets",
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
          setTableProperties(
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

  /* --------------------------------- POINTS --------------------------------- */
  const setEmpirePlayerPoints = async (playerId: Entity, empireId: EEmpire, value: bigint): Promise<boolean> => {
    try {
      const has = tables.Meta_PointsMap.hasWithKeys({ empireId, playerId });
      if (has) {
        const prevValue = tables.Value_PointsMap.getWithKeys({ empireId, playerId })?.value ?? 0n;

        const newValue = (tables.Empire.getWithKeys({ id: empireId })?.pointsIssued ?? 0n) + value - prevValue;
        if (newValue < 0) throw new Error("Cannot set points to negative value");
        await setTableProperties(tables.Empire, { id: empireId }, { pointsIssued: newValue });

        await setTableProperties(tables.Value_PointsMap, { empireId, playerId }, { value });
      } else {
        const prevKeys = tables.Keys_PointsMap.getWithKeys({ empireId })?.players ?? [];
        await setTableProperties(tables.Keys_PointsMap, { empireId }, { players: [...prevKeys, playerId] });
        await setTableProperties(tables.Value_PointsMap, { empireId, playerId }, { value });
        await setTableProperties(
          tables.Meta_PointsMap,
          { empireId, playerId },
          { stored: true, index: BigInt(prevKeys.length) },
        );
        const prevValue = tables.Empire.getWithKeys({ id: empireId })?.pointsIssued ?? 0n;
        await setTableProperties(tables.Empire, { id: empireId }, { pointsIssued: prevValue + value });
      }
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  // mint shares from an empire
  const givePoints = createCheatcode({
    title: "Give points",
    bg: CheatcodeToBg["points"],
    caption: "Give points from an empire to an address",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToName[Number(empires[0]) as EEmpire],
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToName[Number(entity) as EEmpire] })),
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

      const pointsToIssue = BigInt(amount.value) * BigInt(OTHER_EMPIRE_COUNT);
      const newPoints = currentPoints + pointsToIssue;

      const success = await Promise.all([
        setEmpirePlayerPoints(playerId, empireId, newPoints),
        setTableProperties(
          tables.Empire,
          { id: empireId },
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
    bg: CheatcodeToBg["time"],
    caption: "End the game",
    inputs: {},
    execute: async () => {
      const nextBlock = (await playerAccount.publicClient.getBlockNumber()) + BigInt(1);
      const success = await setTableProperties(tables.P_GameConfig, {}, { gameOverBlock: nextBlock });

      if (success) {
        notify("success", `Game ended at block ${nextBlock}`);
        return true;
      } else {
        notify("error", `Failed to end game`);
        return false;
      }
    },
  });

  // reset game
  const resetGame = createCheatcode({
    title: "Reset game",
    bg: CheatcodeToBg["time"],
    caption: "Reset the game",
    inputs: {},
    execute: async () => {
      const success = await _resetGame();

      if (success) {
        notify("success", "Game reset");
        const planets = tables.Planet.getAll();
        for (const planet of planets) {
          const planetObject = game.MAIN.objects.planet.get(planet);
          const planetEmpire = tables.Planet.get(planet)?.empireId ?? 0;

          planetObject?.updateFaction(planetEmpire);
        }

        return true;
      } else {
        notify("error", "Failed to reset game");
        return false;
      }
    },
  });

  /* ---------------------------------- UTILS --------------------------------- */
  // drip eth
  const dripEth = createCheatcode({
    title: "Drip",
    bg: CheatcodeToBg["utils"],
    caption: "Drip eth to the player account",
    inputs: {},
    execute: async () => {
      requestDrip?.(accountClient.playerAccount.address);
      notify("success", "Dripped eth to player account");
      return true;
    },
  });

  /* --------------------------------- MAGNET --------------------------------- */
  const _removeMagnetTurnRemoval = async (empireId: EEmpire, planetId: Entity): Promise<boolean> => {
    // if there is already a magnet for this planet
    const magnet = tables.Magnet.getWithKeys({ empireId, planetId });
    if (magnet) {
      // find out its entity in MagnetTurnPlanets
      const magnetTurnPlanetsEntity = tables.MagnetTurnPlanets.getAll().find((entity) =>
        tables.MagnetTurnPlanets.get(entity)?.planetIds.includes(planetId),
      );
      if (!magnetTurnPlanetsEntity) return false;

      // set planets to be removed in that turn with this planet filtered out
      const keys = tables.MagnetTurnPlanets.getEntityKeys(magnetTurnPlanetsEntity);
      const currentProperties = tables.MagnetTurnPlanets.get(magnetTurnPlanetsEntity);
      const newProperties = { planetIds: currentProperties?.planetIds.filter((id) => id !== planetId) };

      return await setTableProperties(tables.MagnetTurnPlanets, keys, newProperties);
    }

    return true;
  };

  const _removeMagnet = async (empireId: EEmpire, planetId: Entity): Promise<boolean> => {
    if (tables.Magnet.getWithKeys({ empireId, planetId })) {
      const successA = await removeTableRecord(tables.Magnet, { empireId, planetId });
      if (!successA) return false;
    }

    const successB = await _removeMagnetTurnRemoval(empireId, planetId);
    if (!successB) return false;

    return true;
  };

  const placeMagnet = createCheatcode({
    title: "Place magnet",
    bg: CheatcodeToBg["magnet"],
    caption: "Magnets",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToName[Number(empires[0]) as EEmpire],
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToName[Number(entity) as EEmpire] })),
      },
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: entityToPlanetName(planets[0]),
        options: planets
          .map((entity) => ({ id: entity, value: entityToPlanetName(entity) }))
          .filter(({ id }) => !!tables.Planet.get(id)?.empireId),
      },
      turns: {
        label: "Turns",
        inputType: "number",
        defaultValue: 1,
      },
    },
    execute: async ({ empire, planet, turns }) => {
      const planetId = planet.id as Entity;
      const empireId = empire.id as EEmpire;

      const currentTurn = tables.Turn.get()?.value ?? BigInt(1);
      const currentFullTurn = (currentTurn - BigInt(1)) / BigInt(EEmpire.LENGTH - 1) + BigInt(1);
      const endTurn = currentFullTurn + BigInt(turns.value);

      const successA = await _removeMagnetTurnRemoval(empireId, planetId);
      if (!successA) return false;

      // set the Magnet
      const successB = await setTableProperties(
        tables.Magnet,
        { empireId, planetId },
        { isMagnet: true, lockedPoints: BigInt(0), endTurn, playerId: padHex(defaultEntity, { size: 32 }) },
      );
      if (!successB) return false;

      // set MagnetTurnPlanets so it gets removed as well on the end turn
      const successC = await setTableProperties(
        tables.MagnetTurnPlanets,
        { empireId, endTurn },
        {
          planetIds: [...(tables.MagnetTurnPlanets.getWithKeys({ empireId, endTurn })?.planetIds ?? []), planetId],
        },
      );

      return successC;
    },
  });

  // remove magnet
  const removeMagnet = createCheatcode({
    title: "Remove magnet",
    bg: CheatcodeToBg["magnet"],
    caption: "Magnets",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToName[Number(empires[0]) as EEmpire],
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToName[Number(entity) as EEmpire] })),
      },
      planet: {
        label: "Planet",
        inputType: "string",
        defaultValue: entityToPlanetName(planets[0]),
        options: planets
          .map((entity) => ({ id: entity, value: entityToPlanetName(entity) }))
          .filter(({ id }) => !!tables.Planet.get(id)?.empireId),
      },
    },
    execute: async ({ empire, planet }) => {
      const planetId = planet.id as Entity;
      const empireId = empire.id as EEmpire;

      return await _removeMagnet(empireId, planetId);
    },
  });

  // remove all magnets
  const removeAllMagnets = createCheatcode({
    title: "Remove all magnets for an empire",
    bg: CheatcodeToBg["magnet"],
    caption: "Magnets",
    inputs: {
      empire: {
        label: "Empire",
        inputType: "string",
        defaultValue: EmpireEnumToName[Number(empires[0]) as EEmpire],
        options: empires.map((entity) => ({ id: entity, value: EmpireEnumToName[Number(entity) as EEmpire] })),
      },
    },
    execute: async ({ empire }) => {
      const empireId = empire.id as EEmpire;
      const planets = tables.Planet.getAll();
      const results = await Promise.all(planets.map(async (entity) => await _removeMagnet(empireId, entity)));
      return results.every(Boolean);
    },
  });

  /* ----------------------------- TACTICAL STRIKE ---------------------------- */
  // reset all charges
  const resetCharges = createCheatcode({
    title: "Reset all charges",
    bg: CheatcodeToBg["tacticalStrike"],
    caption: "Tactical strike",
    inputs: {},
    execute: async () => {
      const planets = tables.Planet.getAll()
        .map((entity) => ({ entity, properties: tables.Planet.get(entity) }))
        .filter((planet) => !!planet.properties?.empireId);
      const lastUpdated = tables.BlockNumber.get()?.value ?? BigInt(0);

      await Promise.all(
        planets.map((planet) =>
          setTableProperties(
            tables.Planet_TacticalStrike,
            { planetId: planet.entity },
            { charge: BigInt(0), lastUpdated },
          ),
        ),
      );

      notify("success", `Charges reset for ${planets.length} planets`);
      return true;
    },
  });

  // max out all charges
  const maxOutCharges = createCheatcode({
    title: "Max out all charges",
    bg: CheatcodeToBg["tacticalStrike"],
    caption: "Tactical strike",
    inputs: {},
    execute: async () => {
      const planets = tables.Planet.getAll()
        .map((entity) => ({ entity, properties: tables.Planet.get(entity) }))
        .filter((planet) => !!planet.properties?.empireId);
      const lastUpdated = tables.BlockNumber.get()?.value ?? BigInt(0);
      const maxCharge = tables.P_TacticalStrikeConfig.get()?.maxCharge ?? BigInt(0);

      await Promise.all(
        planets.map((planet) =>
          setTableProperties(
            tables.Planet_TacticalStrike,
            { planetId: planet.entity },
            { charge: maxCharge, lastUpdated },
          ),
        ),
      );

      notify("success", `Charges maxed out for ${planets.length} planets`);
      return true;
    },
  });

  // trigger all charges
  const triggerCharges = createCheatcode({
    title: "Trigger all charges",
    bg: CheatcodeToBg["tacticalStrike"],
    caption: "Tactical strike",
    inputs: {},
    execute: async () => {
      const maxCharge = tables.P_TacticalStrikeConfig.get()?.maxCharge ?? BigInt(0);
      const blockNumber = tables.BlockNumber.get()?.value ?? BigInt(0);

      const planets = tables.Planet.getAll()
        .map((entity) => ({ entity, properties: tables.Planet.get(entity) }))
        .filter((planet) => {
          const tacticalStrikeData = tables.Planet_TacticalStrike.get(planet.entity);
          if (!tacticalStrikeData) return false;

          const blocksElapsed = blockNumber - tacticalStrikeData.lastUpdated;
          const actualCharge = tacticalStrikeData.charge + (blocksElapsed * tacticalStrikeData.chargeRate) / 100n;

          if (actualCharge >= maxCharge) return true;
          return false;
        });

      for (const planet of planets) {
        await tacticalStrike(planet.entity);
      }

      notify("success", `Charges triggered for ${planets.length} planets`);
      return true;
    },
  });

  /* --------------------------------- CONFIG --------------------------------- */
  const updateGameConfig = {
    P_GameConfig: createCheatcode({
      title: "Update game config",
      bg: CheatcodeToBg["config"],
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
          turnLengthBlocks: BigInt(properties.turnLengthBlocks.value),
          goldGenRate: BigInt(properties.goldGenRate.value),
          gameOverBlock: finalBlockFromTimeLeft,
          gameStartTimestamp: BigInt(properties.gameStartTimestamp.value),
        };
        const success = await setTableProperties(tables.P_GameConfig, {}, newProperties);

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
        const success = await setTableProperties(
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

    P_OverrideConfig: createCheatcode({
      title: "Update override config",
      bg: CheatcodeToBg["config"],
      caption: "P_OverrideConfig",
      inputs: {
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
        const success = await setTableProperties(
          tables.P_OverrideConfig,
          {},
          Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, BigInt(value.value)])),
        );

        if (success) {
          notify("success", "Override config updated");
          return true;
        } else {
          notify("error", "Failed to update override config");
          return false;
        }
      },
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
        const success = await setTableProperties(
          tables.P_RoutineCosts,
          { routine: ERoutine["BuyShips"] },
          { goldCost: BigInt(buyShips.value) },
        );

        if (success) {
          notify("success", "Routine costs updated");
          return true;
        } else {
          notify("error", "Failed to update routine costs");
          return false;
        }
      },
    }),
  };

  return [
    setShips,
    sendShips,
    setShields,
    setGoldCount,
    generateGold,
    givePoints,
    advanceTurns,
    endGame,
    resetGame,
    dripEth,
    placeMagnet,
    removeMagnet,
    removeAllMagnets,
    resetCharges,
    maxOutCharges,
    triggerCharges,
    ...Object.values(updateGameConfig),
  ];
};
