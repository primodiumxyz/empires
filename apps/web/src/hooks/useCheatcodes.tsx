import { useMemo } from "react";
import config from "postcss.config";
import { Hex, padHex } from "viem";

import { EEmpire, ERoutine, POINTS_UNIT } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { addressToEntity, TxReceipt } from "@primodiumxyz/core";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { resourceToHex } from "@primodiumxyz/reactive-tables/utils";
import { Price } from "@/components/shared/Price";
import { TableOperation } from "@/contractCalls/contractCalls/dev";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useDripAccount } from "@/hooks/useDripAccount";
import { useGame } from "@/hooks/useGame";
import { useKeeperClient } from "@/hooks/useKeeperClient";
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
  keeper: "bg-pink-500/10",
};

export const useCheatcodes = () => {
  const {
    tables,
    utils: { generatePlanetName, getEmpirePlanets, getRoutineThresholds },
  } = useCore();
  const game = useGame();
  const { playerAccount } = usePlayerAccount();
  const { devCalls, execute, executeBatch, resetGame: _resetGame, withdrawRake: _withdrawRake } = useContractCalls();
  const requestDrip = useDripAccount();
  const keeper = useKeeperClient();

  // game
  const empires = tables.Empire.useAll();
  const planets = tables.Planet.useAll();

  // config
  const gameConfig = tables.P_GameConfig.use();
  const pointConfig = tables.P_PointConfig.use();
  const overrideConfig = tables.P_OverrideConfig.use();
  const currentBlock = tables.BlockNumber.use()?.value ?? 0n;

  // rake
  const adminHex = resourceToHex({ type: "namespace", namespace: "Admin", name: "" });
  const rake = tables.Balances.useWithKeys({ namespaceId: adminHex })?.balance ?? 0n;

  /* ------------------------------- SHIPS ------------------------------- */
  // Set the amount of ships on a planet
  const setShips = useMemo(
    () =>
      createCheatcode({
        title: "Set ships",
        caption: "Set the amount of ships on a planet",
        label: "dev",
        bg: CheatcodeToBg["overrides"],
        inputs: {
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
        success: (args) => `Ships set to ${args.amount.value} on ${generatePlanetName(args.planet.id as Entity)}`,
        error: (args) => `Failed to set ships on ${generatePlanetName(args.planet.id as Entity)}`,
      }),
    [planets],
  );

  // send ships from a planet to another
  const sendShips = useMemo(() => {
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

    return createCheatcode({
      title: "Send ships",
      bg: CheatcodeToBg["overrides"],
      caption: "Send ships from one planet to another",
      label: "dev",
      inputs: {
        from: {
          label: "From",
          inputType: "string",
          defaultValue: generatePlanetName(planets[0]),
          options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
        },
        to: {
          label: "To",
          inputType: "string",
          options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
          return `Conquered ${generatePlanetName(to.id as Entity)} from ${generatePlanetName(from.id as Entity)}`;

        return `Sent ${fromPlanetData?.shipCount} ships from ${generatePlanetName(from.id as Entity)} to ${generatePlanetName(to.id as Entity)}`;
      },
      error: ({ from, to }) =>
        `Failed to send ships from ${generatePlanetName(from.id as Entity)} to ${generatePlanetName(to.id as Entity)}`,
    });
  }, [planets]);

  /* --------------------------------- SHIELDS -------------------------------- */
  // Set the amount of destroyers on a planet
  const setShields = useMemo(
    () =>
      createCheatcode({
        title: "Set shields",
        caption: "Set the amount of shields on a planet",
        label: "dev",
        bg: CheatcodeToBg["overrides"],
        inputs: {
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
        success: ({ planet, amount }) => `Shields set to ${amount.value} on ${generatePlanetName(planet.id as Entity)}`,
        error: ({ planet }) => `Failed to set shields on ${generatePlanetName(planet.id as Entity)}`,
      }),
    [planets],
  );

  /* ------------------------------- MECHANISMS ------------------------------- */
  // set gold count for a planet
  const setGoldCount = useMemo(
    () =>
      createCheatcode({
        title: "Set gold",
        bg: CheatcodeToBg["mechanisms"],
        caption: "Set the gold count for a planet",
        label: "dev",
        inputs: {
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
        success: ({ planet, amount }) => `Gold set to ${amount.value} on ${generatePlanetName(planet.id as Entity)}`,
        error: ({ planet }) => `Failed to set gold on ${generatePlanetName(planet.id as Entity)}`,
      }),
    [planets],
  );

  // generate gold on all planets
  const generateGold = useMemo(
    () =>
      createCheatcode({
        title: "Generate gold",
        bg: CheatcodeToBg["mechanisms"],
        caption: "Give a specified amount of gold to all planets",
        label: "dev",
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
      }),
    [],
  );

  // set empire on planet
  const setEmpire = useMemo(
    () =>
      createCheatcode({
        title: "Set empire",
        bg: CheatcodeToBg["mechanisms"],
        caption: "Set the empire of a planet",
        label: "dev",
        inputs: {
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
      }),
    [planets],
  );

  // mint shares from an empire
  const givePoints = useMemo(() => {
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

    if (!playerAccount) return;
    return createCheatcode({
      title: "Give points",
      bg: CheatcodeToBg["mechanisms"],
      caption: "Give points from an empire to an address",
      label: "dev",
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
        const currentPrice = tables.Empire.getWithKeys({ id: empireId })?.pointPrice ?? BigInt(0);
        const increasePrice = pointConfig?.pointPriceIncrease ?? BigInt(1);

        const empires = tables.P_GameConfig.get()?.empireCount ?? 0;
        const pointsToIssue = BigInt(amount.value) * BigInt(empires - 1);
        const newPoints = currentPoints + pointsToIssue;

        const success = await Promise.all([
          setEmpirePlayerPoints(playerId, empireId, newPoints),
          devCalls.setProperties({
            table: tables.Empire,
            keys: { id: empireId },
            properties: {
              pointPrice: currentPrice + increasePrice * BigInt(empires - 1),
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
  }, [playerAccount]);

  /* ---------------------------------- TIME ---------------------------------- */
  // advance turns
  const advanceTurns = useMemo(() => {
    const _advanceTurns = async (amount: number): Promise<TxReceipt> => {
      const turn = tables.Turn.get()?.empire ?? EEmpire.Red;
      const empirePlanets = getEmpirePlanets(turn);
      const routineThresholds = empirePlanets.map((planet) => getRoutineThresholds(planet));
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

    return createCheatcode({
      title: "Advance turns",
      bg: CheatcodeToBg["time"],
      caption: "Advance a specified number of turns",
      label: "dev",
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
  }, []);

  // end game
  const endGame = useMemo(() => {
    if (!playerAccount) return;
    return createCheatcode({
      title: "End game",
      bg: CheatcodeToBg["time"],
      caption: "End the game",
      label: "dev",
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
  }, [playerAccount]);

  // reset game
  const resetGame = useMemo(
    () =>
      createCheatcode({
        title: "Reset game",
        bg: CheatcodeToBg["time"],
        caption: "Reset the game",
        label: "admin",
        inputs: {
          nextGameStartBlock: {
            label: "Next game start block",
            inputType: "number",
            defaultValue: currentBlock + 10n,
          },
        },
        execute: async ({ nextGameStartBlock }) => {
          const success = await _resetGame(nextGameStartBlock.value);
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
      }),
    [currentBlock],
  );

  /* ---------------------------------- UTILS --------------------------------- */
  // drip eth
  const dripEth = useMemo(() => {
    if (!playerAccount) return;
    return createCheatcode({
      title: "Drip",
      bg: CheatcodeToBg["utils"],
      caption: "Drip eth to the player account",
      label: "dev",
      inputs: {},
      execute: async () => {
        const receipt = await requestDrip?.(playerAccount.address, true);
        return receipt ?? { success: false, error: "Failed to drip eth" };
      },
      success: () => `Dripped eth to player account`,
    });
  }, [playerAccount]);

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

  const placeMagnet = useMemo(
    () =>
      createCheatcode({
        title: "Place magnet",
        bg: CheatcodeToBg["magnet"],
        caption: "on a planet",
        label: "dev",
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
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets
              .map((entity) => ({ id: entity, value: generatePlanetName(entity) }))
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
                planetIds: [
                  ...(tables.MagnetTurnPlanets.getWithKeys({ empireId, endTurn })?.planetIds ?? []),
                  planetId,
                ],
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
      }),
    [],
  );

  // remove magnet
  const removeMagnet = useMemo(
    () =>
      createCheatcode({
        title: "Remove magnet",
        bg: CheatcodeToBg["magnet"],
        caption: "from a planet",
        label: "dev",
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
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets
              .map((entity) => ({ id: entity, value: generatePlanetName(entity) }))
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
      }),
    [empires, planets],
  );

  // remove all magnets
  const removeAllMagnets = useMemo(
    () =>
      createCheatcode({
        title: "Remove all magnets",
        bg: CheatcodeToBg["magnet"],
        caption: "for an empire",
        label: "dev",
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
      }),
    [empires],
  );

  // withdraw rake
  const withdrawRake = useMemo(
    () =>
      createCheatcode({
        title: "Withdraw rake",
        bg: CheatcodeToBg["utils"],
        caption: (
          <div className="flex gap-2">
            <Price wei={rake} />
            <span>
              (<Price wei={rake} forceBlockchainUnits />)
            </span>
          </div>
        ),
        label: "admin",
        inputs: {},
        execute: async () => {
          return await _withdrawRake();
        },
        loading: () => "[CHEATCODE] Withdrawing rake...",
        success: () => `Rake withdrawn`,
        error: () => `Failed to withdraw rake`,
      }),
    [rake],
  );

  /* ------------------------------ SHIELD EATER ------------------------------ */
  // place shield eater on planet
  const moveShieldEater = useMemo(
    () =>
      createCheatcode({
        title: "Move shield eater",
        bg: CheatcodeToBg["shieldEater"],
        caption: "to planet",
        label: "dev",
        inputs: {
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
      }),
    [planets],
  );

  // set shield eater destination
  const setShieldEaterDestination = useMemo(
    () =>
      createCheatcode({
        title: "Set shield eater destination",
        bg: CheatcodeToBg["shieldEater"],
        caption: "to planet",
        label: "dev",
        inputs: {
          planet: {
            label: "Planet",
            inputType: "string",
            defaultValue: generatePlanetName(planets[0]),
            options: planets.map((entity) => ({ id: entity, value: generatePlanetName(entity) })),
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
      }),
    [planets],
  );

  // reset shield eater countdown
  const feedShieldEater = useMemo(
    () =>
      createCheatcode({
        title: "Feed shield eater",
        bg: CheatcodeToBg["shieldEater"],
        caption: "set ready to detonate",
        label: "dev",
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
      }),
    [],
  );

  /* ---------------------------------- ADMIN --------------------------------- */
  const updateGameConfig = useMemo(
    () =>
      createCheatcode({
        title: "Update game config",
        bg: CheatcodeToBg["config"],
        caption: `Current block: ${currentBlock.toLocaleString()}`,
        label: "admin",
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
          nextGameLengthTurns: {
            label: "Next game length in turns",
            inputType: "number",
            defaultValue: gameConfig?.nextGameLengthTurns ?? BigInt(1),
          },
          goldGenRate: {
            label: "Gold generation rate",
            inputType: "number",
            defaultValue: gameConfig?.goldGenRate ?? BigInt(1),
          },
          roundBlocksLeft: {
            label: "Round blocks left",
            inputType: "number",
            defaultValue:
              currentBlock >= (gameConfig?.gameOverBlock ?? 0n) ? 0n : (gameConfig?.gameOverBlock ?? 0n) - currentBlock,
          },
          gameStartBlock: {
            label: "Game start block",
            inputType: "number",
            defaultValue: gameConfig?.gameStartBlock ?? BigInt(0),
          },
        },
        execute: async (properties) => {
          const newProperties = {
            empireCount: Number(properties.empireCount.value),
            turnLengthBlocks: BigInt(properties.turnLengthBlocks.value),
            nextGameLengthTurns: BigInt(properties.nextGameLengthTurns.value),
            goldGenRate: BigInt(properties.goldGenRate.value),
            gameOverBlock: currentBlock + BigInt(properties.roundBlocksLeft.value),
            gameStartBlock: BigInt(properties.gameStartBlock.value),
          };

          // only update modified properties
          const modifiedProperties = Object.fromEntries(
            Object.entries(newProperties).filter(
              ([key, value]) => value !== properties[key as keyof typeof properties].defaultValue,
            ),
          );

          return await execute({
            functionName: "Empires__setGameConfig",
            args: [modifiedProperties],
            txQueueOptions: { id: "set-game-config" },
          });
        },
        loading: () => "[CHEATCODE] Updating game config...",
        success: () => `Game config updated`,
        error: () => `Failed to update game config; verify in admin panel that you have the correct role`,
      }),
    [gameConfig, currentBlock],
  );

  /* --------------------------------- CONFIG --------------------------------- */
  const empireConfig = useMemo(
    () =>
      createCheatcode({
        title: "Update empire",
        bg: CheatcodeToBg["config"],
        caption: "Empire config",
        label: "dev",
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
          isDefeated: {
            label: "Is defeated",
            inputType: "boolean",
            defaultValue: false,
            options: [
              { id: 0, value: "false" },
              { id: 1, value: "true" },
            ],
          },
        },
        execute: async ({ empire, isDefeated }) => {
          return await devCalls.setProperties({
            table: tables.Empire,
            keys: { id: empire.id as EEmpire },
            properties: { isDefeated: isDefeated.value },
          });
        },
        loading: () => "[CHEATCODE] Updating empire...",
        success: ({ empire, isDefeated }) => `Updated ${empire.value} to ${isDefeated ? "defeated" : "alive"}`,
        error: ({ empire, isDefeated }) => `Failed to update ${empire.value} to ${isDefeated ? "defeated" : "alive"}`,
      }),
    [empires],
  );

  const updatePrototypeConfig = useMemo(
    () => ({
      P_PointConfig: createCheatcode({
        title: "Update point config",
        bg: CheatcodeToBg["config"],
        caption: "P_PointConfig",
        label: "dev",
        inputs: {
          pointUnit: {
            label: "Point unit",
            inputType: "number",
            defaultValue: pointConfig?.pointUnit ?? BigInt(POINTS_UNIT),
          },
          minPointPrice: {
            label: "Min point price",
            inputType: "number",
            defaultValue: pointConfig?.minPointPrice ?? BigInt(POINTS_UNIT * 0.1),
          },
          startPointPrice: {
            label: "Start point price",
            inputType: "number",
            defaultValue: pointConfig?.startPointPrice ?? BigInt(POINTS_UNIT * 0.2),
          },
          pointGenRate: {
            label: "Point generation rate",
            inputType: "number",
            defaultValue: pointConfig?.pointGenRate ?? BigInt(POINTS_UNIT * 0.2),
          },
          pointPriceIncrease: {
            label: "Point price increase",
            inputType: "number",
            defaultValue: pointConfig?.pointPriceIncrease ?? BigInt(POINTS_UNIT * 0.1),
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
            properties: Object.fromEntries(
              Object.entries(properties).map(([key, value]) => [key, BigInt(value.value)]),
            ),
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
        label: "dev",
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
        label: "dev",
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
    }),
    [gameConfig, pointConfig, overrideConfig, currentBlock],
  );

  /* --------------------------------- Keeper --------------------------------- */
  const startKeeper = useMemo(
    () =>
      createCheatcode({
        title: "Start keeper",
        bg: CheatcodeToBg["keeper"],
        caption: "Start keeper",
        label: "bearer",
        inputs: {},
        execute: async () => await keeper.start(),
        loading: () => "[CHEATCODE] Starting keeper...",
        success: () => `Keeper started`,
        error: () => `Failed to start keeper`,
        disabled: !keeper.instance || keeper.running,
      }),
    [keeper.instance, keeper.running],
  );

  const stopKeeper = useMemo(
    () =>
      createCheatcode({
        title: "Stop keeper",
        bg: CheatcodeToBg["keeper"],
        caption: "Stop keeper",
        label: "bearer",
        inputs: {},
        execute: async () => await keeper.stop(),
        loading: () => "[CHEATCODE] Stopping keeper...",
        success: () => `Keeper stopped`,
        error: () => `Failed to stop keeper`,
        disabled: !keeper.instance || !keeper.running,
      }),
    [keeper.instance, keeper.running],
  );

  const setKeeperBearerToken = useMemo(
    () =>
      createCheatcode({
        title: "Set keeper bearer token",
        bg: CheatcodeToBg["keeper"],
        caption: "Set keeper bearer token",
        inputs: {
          token: {
            label: "Bearer token",
            inputType: "string",
            defaultValue: "",
          },
        },
        execute: async ({ token }) => {
          keeper.setBearerToken(token.value);
          keeper.create();
          return { success: true };
        },
        loading: () => "[CHEATCODE] Setting keeper bearer token...",
        success: () => `Keeper bearer token set`,
        error: () => `Failed to set keeper bearer token`,
      }),
    [],
  );

  return [
    advanceTurns,
    endGame,
    resetGame,
    updateGameConfig,
    dripEth,
    withdrawRake,
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
    empireConfig,
    ...Object.values(updatePrototypeConfig),
    setKeeperBearerToken,
    startKeeper,
    stopKeeper,
  ];
};
