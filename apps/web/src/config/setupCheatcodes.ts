import { EEmpire, OTHER_EMPIRE_COUNT } from "@primodiumxyz/contracts";
import { ENPCAction, EPlayerAction } from "@primodiumxyz/contracts/config/enums";
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
  const { createDestroyer, removeDestroyer, updateWorld, requestDrip, setTableValue } = contractCalls;
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
    // Set the amount of destroyers on a planet
    createCheatcode({
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

        return success;
      },
    }),

    // send destroyers from a planet to another
    createCheatcode({
      title: "[WIP] Send destroyers",
      caption: "Send destroyers from one planet to another",
      inputs: {
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
      execute: async ({ from, to }) => {
        const fromEntity = from.id as Entity;
        const toEntity = to.id as Entity;
        const fromPlanetData = tables.Planet.get(fromEntity);
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
                // TODO: replicate this:
                // FactionPlanetsSet.add(empire, planetId);
                // FactionPlanetsSet.remove(planetData.factionId, planetId);
                await setTableValue(tables.Planet, { id: toEntity }, { factionId: fromPlanetData.factionId }),
              ])
            ).every(Boolean);

            if (!success) return false;
          }

          const success = await setTableValue(tables.Planet, { id: toEntity }, { destroyerCount: remainingDestroyers });
          return success;
        }
      },
    }),

    /* ---------------------------------- GOLD ---------------------------------- */
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
        const playerId = addressToEntity(recipient.value);
        const factionId = empire.id as EEmpire;
        const currentPoints = tables.Value_PointsMap.getWithKeys({ factionId, playerId })?.value ?? BigInt(0);
        const currentCost = tables.Faction.getWithKeys({ id: factionId })?.pointCost ?? BigInt(0);
        const increaseCost = tables.P_PointConfig.get()?.pointCostIncrease ?? BigInt(1);

        const pointsToIssue = BigInt(amount.value) * BigInt(OTHER_EMPIRE_COUNT);
        const newPoints = currentPoints + pointsToIssue;

        const success = await Promise.all([
          // TODO: replicate this:
          // function set(EEmpire empire, bytes32 playerId, uint256 value) internal {
          //   if (has(empire, playerId)) {
          //     uint256 prevValue = get(empire, playerId);

          //     if (value < prevValue) Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) - (prevValue - value));
          //     else Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) + (value - prevValue));

          //     Value_PointsMap.set(empire, playerId, value);
          //   } else {
          //     Keys_PointsMap.push(empire, playerId);
          //     Value_PointsMap.set(empire, playerId, value);
          //     Meta_PointsMap.set(empire, playerId, true, Keys_PointsMap.length(empire) - 1);
          //     Faction.setPointsIssued(empire, Faction.getPointsIssued(empire) + value);
          //   }
          // }

          // this is not enough
          // setTableValue(
          //   tables.Value_PointsMap,
          //   { playerId, factionId },
          //   {
          //     value: newPoints,
          //   },
          // ),
          setTableValue(
            tables.Faction,
            { id: factionId },
            {
              pointCost: currentCost + increaseCost * BigInt(OTHER_EMPIRE_COUNT),
            },
          ),
        ]);

        return success.every(Boolean);
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

    /* ---------------------------------- UTILS --------------------------------- */
    // drip eth
    createCheatcode({
      title: "Drip",
      caption: "Drip eth to the player account",
      inputs: {},
      execute: async () => {
        requestDrip?.(accountClient.playerAccount.address);
        return true;
      },
    }),
  ];

  return cheatcodes;
};
