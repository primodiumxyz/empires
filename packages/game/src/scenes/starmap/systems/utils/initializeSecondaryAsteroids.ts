import {
  Core,
  EntityType,
  getPositionByVector,
  getSecondaryAsteroidEntity,
  hashEntities,
  RESOURCE_SCALE,
  Tables,
  toHex32,
} from "@primodiumxyz/core";
import { Coord } from "@primodiumxyz/engine/types";
import { Entity, Properties } from "@primodiumxyz/reactive-tables";
import { EResource, EMap } from "contracts/config/enums";
import { storageUnitStorageUpgrades } from "contracts/config/storageUpgrades";
import { Hex } from "viem";

const emptyData = {
  __staticData: "0x" as Entity,
  __encodedLengths: "0x" as Entity,
  __dynamicData: "0x" as Entity,
  __lastSyncedAtBlock: 0n,
};

const spawnDroidBase = (asteroidEntity: Entity, tables: Tables) => {
  const mainBaseCoord = tables.Position.get(EntityType.MainBase) ?? { x: 19, y: 13 };
  const droidBaseEntity = hashEntities(asteroidEntity, EntityType.DroidBase);
  tables.Position.set(
    { ...emptyData, x: mainBaseCoord.x, y: mainBaseCoord.y, parentEntity: asteroidEntity },
    droidBaseEntity
  );

  tables.BuildingType.set({ ...emptyData, value: EntityType.DroidBase }, droidBaseEntity);
  tables.Level.set({ ...emptyData, value: 1n }, droidBaseEntity);
  tables.IsActive.set({ ...emptyData, value: true }, droidBaseEntity);
  tables.OwnedBy.set({ ...emptyData, value: asteroidEntity }, droidBaseEntity);

  if (tables.P_Blueprint.has(EntityType.DroidBase)) return;

  tables.P_Blueprint.set(
    { ...emptyData, value: tables.P_Blueprint.get(EntityType.MainBase)?.value ?? [] },
    EntityType.DroidBase
  );
};

const spawnWormholeBase = (asteroidEntity: Entity, tables: Tables) => {
  const mainBaseCoord = { x: 21, y: 14 };
  const wormholeBaseEntity = hashEntities(asteroidEntity, EntityType.WormholeBase);
  tables.Position.set(
    { ...emptyData, x: mainBaseCoord.x, y: mainBaseCoord.y, parentEntity: asteroidEntity },
    wormholeBaseEntity
  );
  tables.BuildingType.set({ ...emptyData, value: EntityType.WormholeBase }, wormholeBaseEntity);
  tables.Level.set({ ...emptyData, value: 1n }, wormholeBaseEntity);
  tables.IsActive.set({ ...emptyData, value: true }, wormholeBaseEntity);
  tables.OwnedBy.set({ ...emptyData, value: asteroidEntity }, wormholeBaseEntity);

  if (tables.P_Blueprint.has(EntityType.WormholeBase)) return;

  tables.P_Blueprint.set(
    { ...emptyData, value: tables.P_Blueprint.get(EntityType.MainBase)?.value ?? [] },
    EntityType.WormholeBase
  );
};

export function initializeSecondaryAsteroids(sourceEntity: Entity, source: Coord, core: Core) {
  const {
    tables,
    network: { world },
  } = core;
  const config = tables.P_GameConfig.get();
  const wormholeAsteroidConfig = tables.P_WormholeAsteroidConfig.get();

  if (!config) throw new Error("GameConfig not found");
  if (!wormholeAsteroidConfig) throw new Error("WormholeAsteroidConfig not found");
  for (let i = 0; i < config.maxAsteroidsPerPlayer; i++) {
    const asteroidPositionRelative = getPositionByVector(
      Number(config.asteroidDistance),
      Math.floor((i * 360) / Number(config.maxAsteroidsPerPlayer))
    );
    const asteroidPosition = {
      x: source.x - asteroidPositionRelative.x,
      y: source.y - asteroidPositionRelative.y,
    };

    const asteroidEntity = getSecondaryAsteroidEntity(sourceEntity, asteroidPosition);

    const wormholeAsteroid = i == Number(wormholeAsteroidConfig.wormholeAsteroidSlot);

    if (tables.ReversePosition.getWithKeys(asteroidPosition)) continue;

    if (!wormholeAsteroid && !isSecondaryAsteroid(asteroidEntity, Number(config.asteroidChanceInv), wormholeAsteroid))
      continue;

    if (!tables.OwnedBy.get(asteroidEntity))
      wormholeAsteroid ? spawnWormholeBase(asteroidEntity, tables) : spawnDroidBase(asteroidEntity, tables);

    world.registerEntity({ id: asteroidEntity });
    tables.ReversePosition.setWithKeys({ entity: asteroidEntity, ...emptyData }, asteroidPosition);

    const asteroidData = getAsteroidData(asteroidEntity, wormholeAsteroid, tables);
    tables.Asteroid.set({ ...emptyData, ...asteroidData }, asteroidEntity);
    tables.Position.set({ ...emptyData, ...asteroidPosition, parentEntity: toHex32("0") }, asteroidEntity);

    const defenseData = getSecondaryAsteroidUnitsAndEncryption(asteroidEntity, asteroidData.maxLevel);
    tables.UnitCount.setWithKeys(
      { ...emptyData, value: defenseData.droidCount },
      { entity: asteroidEntity as Hex, unit: EntityType.Droid as Hex }
    );

    tables.ResourceCount.setWithKeys(
      { ...emptyData, value: defenseData.encryption },
      { entity: asteroidEntity as Hex, resource: EResource.R_Encryption }
    );
    tables.MaxResourceCount.setWithKeys(
      { ...emptyData, value: defenseData.encryption },
      { entity: asteroidEntity as Hex, resource: EResource.R_Encryption }
    );

    if (asteroidData.mapId == EMap.Common && !tables.OwnedBy.get(asteroidEntity)) {
      buildRaidableAsteroid(asteroidEntity, tables);
    }
  }
}

function isSecondaryAsteroid(entity: Entity, chanceInv: number, wormholeAsteroid: boolean) {
  if (wormholeAsteroid) {
    return true;
  }
  const motherlodeType = getByteUInt(entity, 6, 128);
  return motherlodeType % chanceInv === 0;
}

export function getSecondaryAsteroidUnitsAndEncryption(asteroidEntity: Entity, level: bigint) {
  // this is a crime but wanted to preserve the const without using an implicit equation.
  const droidCount = level < 3n ? 5n : level < 6n ? 80n : level < 8n ? 1280n : 20480n;
  const encryption = (level * 300n + 300n) * RESOURCE_SCALE;
  return { droidCount, encryption };
}

function getAsteroidData(
  asteroidEntity: Entity,
  wormholeAsteroid: boolean,
  tables: Tables
): Properties<Tables["Asteroid"]["propertiesSchema"]> {
  const wormholeAsteroidConfig = tables.P_WormholeAsteroidConfig.get();
  if (!wormholeAsteroidConfig) throw new Error("wormholeAsteroidConfig not found");
  if (wormholeAsteroid) {
    return {
      ...emptyData,
      isAsteroid: true,
      maxLevel: wormholeAsteroidConfig.maxLevel,
      mapId: wormholeAsteroidConfig.mapId,
      primodium: wormholeAsteroidConfig.primodium,
      spawnsSecondary: false,
      wormhole: true,
    };
  }
  const distributionVal = getByteUInt(asteroidEntity, 7, 12) % 100;

  let maxLevel = 8;
  let primodium = 1n * RESOURCE_SCALE;

  const asteroidThresholdProb = tables.P_AsteroidThresholdProbConfig.get();
  if (!asteroidThresholdProb) throw new Error("asteroidThresholdProb not found");

  let mapId = 1;

  // Distribution
  if (distributionVal < asteroidThresholdProb.common1) {
    // common resources
    maxLevel = 1; // micro
    primodium = 1n * RESOURCE_SCALE;
    mapId = EMap.Common;
  } else if (distributionVal < asteroidThresholdProb.common2) {
    // common + advanced resources
    maxLevel = 3; // small
    primodium = 5n * RESOURCE_SCALE;
    mapId = EMap.Common;
  } else if (distributionVal < asteroidThresholdProb.eliteMicro) {
    // elite resources, micro
    maxLevel = 1;
    primodium = 3n * RESOURCE_SCALE;
  } else if (distributionVal < asteroidThresholdProb.eliteSmall) {
    // elite resources, small
    maxLevel = 3;
    primodium = 6n * RESOURCE_SCALE;
  } else if (distributionVal < asteroidThresholdProb.eliteMedium) {
    // elite resources, medium
    maxLevel = 6;
    primodium = 10n * RESOURCE_SCALE;
  } else {
    // elite resources, large
    maxLevel = 8;
    primodium = 20n * RESOURCE_SCALE;
  }

  if (mapId != EMap.Common) {
    // elite resources
    // number between 2 and 5
    mapId = (getByteUInt(asteroidEntity, 3, 20) % 4) + 2;
  }
  return {
    ...emptyData,
    isAsteroid: true,
    maxLevel: BigInt(maxLevel),
    mapId: mapId,
    spawnsSecondary: false,
    wormhole: false,
    primodium,
  };
}

function buildRaidableAsteroid(asteroidEntity: Entity, tables: Tables) {
  // get maxlevel to determine if factories should be added
  const maxLevel = tables.Asteroid.get(asteroidEntity)?.maxLevel ?? 1n;

  // build iron mine at 22, 15
  anticipateBuilding(EntityType.IronMine, { x: 22, y: 15 }, asteroidEntity, 1n, tables);
  // build copper mine at 22, 14
  anticipateBuilding(EntityType.CopperMine, { x: 22, y: 14 }, asteroidEntity, 1n, tables);
  // build lithium mine at 22, 13
  anticipateBuilding(EntityType.LithiumMine, { x: 22, y: 13 }, asteroidEntity, 1n, tables);

  // storage building at 21, 15
  anticipateBuilding(EntityType.StorageUnit, { x: 21, y: 15 }, asteroidEntity, 2n, tables);
  const storageMax = storageUnitStorageUpgrades[2];

  if (maxLevel >= 3n) {
    // build Iron Plate factory at 17, 15
    anticipateBuilding(EntityType.IronPlateFactory, { x: 19, y: 15 }, asteroidEntity, 1n, tables);
    // build Alloy factory at 15, 15
    anticipateBuilding(EntityType.AlloyFactory, { x: 17, y: 15 }, asteroidEntity, 1n, tables);
    // build PVCell factory at 15, 17
    anticipateBuilding(EntityType.PVCellFactory, { x: 15, y: 15 }, asteroidEntity, 1n, tables);

    // set storage to max out advanced resources
    anticipateStorage(EResource.IronPlate, storageMax.IronPlate, asteroidEntity, tables);
    anticipateStorage(EResource.Alloy, storageMax.Alloy, asteroidEntity, tables);
    anticipateStorage(EResource.PVCell, storageMax.PVCell, asteroidEntity, tables);
  }

  // set storage to max out common resources
  anticipateStorage(EResource.Iron, storageMax.Iron, asteroidEntity, tables);
  anticipateStorage(EResource.Copper, storageMax.Copper, asteroidEntity, tables);
  anticipateStorage(EResource.Lithium, storageMax.Lithium, asteroidEntity, tables);
}

export function removeRaidableAsteroid(asteroidEntity: Entity, tables: Tables) {
  const maxLevel = tables.Asteroid.get(asteroidEntity)?.maxLevel ?? 1n;
  // remove storage building at 21, 15
  removeAnticipatedBuilding(EntityType.StorageUnit, asteroidEntity, tables);
  // remove iron mine at 23, 16
  removeAnticipatedBuilding(EntityType.IronMine, asteroidEntity, tables);
  // remove copper mine at 23, 15
  removeAnticipatedBuilding(EntityType.CopperMine, asteroidEntity, tables);
  // remove lithium mine at 23, 14
  removeAnticipatedBuilding(EntityType.LithiumMine, asteroidEntity, tables);

  if (maxLevel >= 3n) {
    // remove Iron Plate factory at 19, 15
    removeAnticipatedBuilding(EntityType.IronPlateFactory, asteroidEntity, tables);
    // remove Alloy factory at 17, 15
    removeAnticipatedBuilding(EntityType.AlloyFactory, asteroidEntity, tables);
    // remove PVCell factory at 15, 15
    removeAnticipatedBuilding(EntityType.PVCellFactory, asteroidEntity, tables);
  }
}

function anticipateBuilding(
  buildingPrototype: Entity,
  coord: Coord,
  asteroidEntity: Entity,
  level: bigint,
  tables: Tables
) {
  const buildingEntity = hashEntities(asteroidEntity, buildingPrototype);
  tables.BuildingType.set({ ...emptyData, value: buildingPrototype }, buildingEntity);
  tables.Position.set({ ...emptyData, x: coord.x, y: coord.y, parentEntity: asteroidEntity }, buildingEntity);
  tables.Level.set({ ...emptyData, value: level }, buildingEntity);
  tables.IsActive.set({ ...emptyData, value: true }, buildingEntity);
  tables.OwnedBy.set({ ...emptyData, value: asteroidEntity }, buildingEntity);
}

function removeAnticipatedBuilding(buildingPrototype: Entity, asteroidEntity: Entity, tables: Tables) {
  const buildingEntity = hashEntities(asteroidEntity, buildingPrototype);
  tables.Position.remove(buildingEntity);
  tables.BuildingType.remove(buildingEntity);
  tables.Level.remove(buildingEntity);
  tables.IsActive.remove(buildingEntity);
  tables.OwnedBy.remove(buildingEntity);
}

function anticipateStorage(resource: EResource, amount: number, asteroidEntity: Entity, tables: Tables) {
  tables.ResourceCount.setWithKeys(
    { ...emptyData, value: BigInt(amount) * RESOURCE_SCALE },
    { entity: asteroidEntity as Hex, resource: resource }
  );
  tables.MaxResourceCount.setWithKeys(
    { ...emptyData, value: BigInt(amount) * RESOURCE_SCALE },
    { entity: asteroidEntity as Hex, resource: resource }
  );
}

// preserve this function in case needed later
// function removeAnticipatedStorage(resource: EResource, amount: number, asteroidEntity: Entity) {
//   // get the resource count and max resource count
//   let resourceCount = tables.ResourceCount.getWithKeys({ entity: asteroidEntity as Hex, resource: resource} )?.value ?? 0n;
//   let maxResourceCount = tables.MaxResourceCount.getWithKeys({ entity: asteroidEntity as Hex, resource: resource })?.value ?? 0n;

//   // subtract the resource param from resource count and max resource count
//   resourceCount -= BigInt(amount) * RESOURCE_SCALE;
//   maxResourceCount -= BigInt(amount) * RESOURCE_SCALE;

//   // set the new resource count and max resource count
//   tables.ResourceCount.setWithKeys({ ...emptyData, value: resourceCount }, { entity: asteroidEntity as Hex, resource: resource });
//   tables.MaxResourceCount.setWithKeys({ ...emptyData, value: maxResourceCount }, { entity: asteroidEntity as Hex, resource: resource });
// }

const ONE = BigInt(1);
const getByteUInt = (_b: Entity, length: number, shift: number): number => {
  const b = BigInt(_b);
  const mask = ((ONE << BigInt(length)) - ONE) << BigInt(shift);
  const _byteUInt = (b & mask) >> BigInt(shift);
  return Number(_byteUInt);
};
