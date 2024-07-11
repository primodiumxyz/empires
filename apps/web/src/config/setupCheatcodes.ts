import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { AccountClient, addressToEntity, Core, entityToPlanetName } from "@primodiumxyz/core";
import { Entity, Properties } from "@primodiumxyz/reactive-tables";
import { ContractCalls } from "@/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";
import { EmpireEnumToName } from "@/util/lookups";

// TODO: actual calls not done (need to drip until balance enough)
// TODO: notify toast on success

export const setupCheatcodes = (core: Core, accountClient: AccountClient, contractCalls: ContractCalls) => {
  const { tables, utils } = core;
  const { playerAccount } = accountClient;
  const { publicClient } = playerAccount;
  const { createDestroyer, removeDestroyer, updateWorld, setTableValue } = contractCalls;
  const { getTotalCost } = utils;

  const factions = tables.Faction.getAll();
  const planets = tables.Planet.getAll();
  const planetsData = planets
    .map((entity) => tables.Planet.get(entity))
    .filter((planetData) => !!planetData?.factionId) as unknown as Properties<typeof tables.Planet.propertiesSchema>[];
  const planetsWithDestroyers = planetsData
    .map((planet, i) => {
      if (planet.destroyerCount) return planets[i];
      return undefined;
    })
    .filter(Boolean) as Entity[];

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

  const cheatcodes = [
    /* ------------------------------- DESTROYERS ------------------------------- */
    // create destroyers on a planet
    createCheatcode({
      title: "[WIP] Create destroyers",
      caption: "Create a specified number of destroyers on a planet",
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
        let success = true;
        let balance = await accountClient.playerAccount.publicClient.getBalance({
          address: accountClient.playerAccount.address,
        });

        for (let i = 0; i < amount.value; i++) {
          const planetEntity = planets.find((entity) => entityToPlanetName(entity) === planet.value);
          const planetData = tables.Planet.get(planetEntity);
          const price = getTotalCost(EPlayerAction.CreateDestroyer, planetData?.factionId as EEmpire);

          // TODO
          if (balance < price) {
            // await accountClient.requestDrip(accountClient.playerAccount.address);
            // const txSuccess = success && await createDestroyer(planet);
            // if (!txSuccess) {
            //   success = false;
            //   break;
            // }
          }

          balance -= price;
        }

        return success;
      },
    }),

    // remove destroyers from a planet
    createCheatcode({
      title: "[WIP] Remove destroyers",
      caption: "Remove a specified number of destroyers from a planet",
      inputs: {
        amount: {
          label: "Amount",
          inputType: "number",
          defaultValue: 1,
        },
        planet: {
          label: "Planet",
          inputType: "string",
          defaultValue:
            planetsWithDestroyers.length > 0
              ? entityToPlanetName(planetsWithDestroyers[0])
              : "No planetsData with destroyers",
          options:
            planetsWithDestroyers.length > 0
              ? planetsWithDestroyers.map((entity) => ({ id: entity, value: entityToPlanetName(entity) }))
              : [],
        },
      },
      execute: async ({ amount, planet }) => {
        let success = true;

        // TODO: same as above

        return success;
      },
    }),

    // send destroyers from a planet to another
    createCheatcode({
      title: "[WIP] Send destroyers",
      caption: "Send a specified number of destroyers from one planet to another",
      inputs: {
        amount: {
          label: "Amount",
          inputType: "number",
          defaultValue: 1,
        },
        from: {
          label: "From",
          inputType: "string",
          defaultValue:
            planetsWithDestroyers.length > 0
              ? entityToPlanetName(planetsWithDestroyers[0])
              : "No planetsData with destroyers",
          options:
            planetsWithDestroyers.length > 0
              ? planetsWithDestroyers.map((entity) => ({ id: entity, value: entityToPlanetName(entity) }))
              : [],
        },
        to: {
          label: "To",
          inputType: "string",
          defaultValue: planetsWithDestroyers
            .map((entity) => getNearbyPlanetEntities(tables.Planet.get(entity)!))
            .flat()
            .map((entity) => entityToPlanetName(entity))[0],
          options: planetsWithDestroyers
            .map((entity) => getNearbyPlanetEntities(tables.Planet.get(entity)!))
            .flat()
            .map((entity) => ({ id: entity, value: entityToPlanetName(entity) })),
        },
      },
      execute: async ({ amount, from, to }) => {
        let success = true;

        // TODO

        return success;
      },
    }),

    /* ---------------------------------- TIME ---------------------------------- */
    // advance turns
    createCheatcode({
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

        return success;
      },
    }),

    // set end game block number
    createCheatcode({
      title: "Set end game",
      caption: "Set the end game to a specified block number",
      inputs: {
        blockNumber: {
          label: "Block number",
          inputType: "number",
          defaultValue: BigInt(0),
        },
      },
      execute: async ({ blockNumber }) => {
        const success = await setTableValue(tables.P_GameConfig, {}, { gameOverBlock: BigInt(blockNumber.value) });

        return success;
      },
    }),

    // end game
    createCheatcode({
      title: "End game",
      caption: "End the game",
      inputs: {},
      execute: async () => {
        const nextBlock = (await publicClient.getBlockNumber()) + BigInt(1);
        const success = await setTableValue(tables.P_GameConfig, {}, { gameOverBlock: nextBlock });

        return success;
      },
    }),

    /* ---------------------------------- GOLD ---------------------------------- */
    // generate gold on all planetsData
    createCheatcode({
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

        return success.every(Boolean);
      },
    }),

    // set gold count for a planet
    createCheatcode({
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

        return success;
      },
    }),

    // spend gold on destroyers for a planet
    createCheatcode({
      title: "[WIP] Spend gold",
      caption: "Spend gold on destroyers for a planet",
      inputs: {
        planet: {
          label: "Planet",
          inputType: "string",
          defaultValue: entityToPlanetName(planets[0]),
          options: planets.map((entity) => ({ id: entity, value: entityToPlanetName(entity) })),
        },
      },
      execute: async ({ planet }) => {
        let success = true;

        // TODO

        return success;
      },
    }),

    /* --------------------------------- SHARES --------------------------------- */
    // mint shares from an empire
    createCheatcode({
      title: "[WIP] Give points",
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
        console.log(empire);
        const playerId = addressToEntity(recipient.value);
        const factionId = empire.id as EEmpire;
        tables.Faction.getWithKeys({ id: factionId });
        const currentCost = tables.Faction.getWithKeys({ id: factionId })?.pointCost ?? BigInt(0);
        const increaseCost = tables.P_PointConfig.get()?.pointCostIncrease ?? BigInt(1);

        // TODO: not working
        const success = await Promise.all([
          setTableValue(
            tables.Value_PointsMap,
            { playerId, factionId },
            {
              value:
                (tables.Value_PointsMap.getWithKeys({ playerId, factionId })?.value ?? BigInt(0)) +
                BigInt(amount.value),
            },
          ),
          setTableValue(
            tables.Faction,
            { id: factionId },
            {
              pointCost: currentCost + BigInt(amount.value) * increaseCost,
            },
          ),
        ]);

        return success.every(Boolean);
      },
    }),
  ];

  return cheatcodes;
};
