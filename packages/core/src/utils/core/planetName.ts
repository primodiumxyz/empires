import { Entity } from "@primodiumxyz/reactive-tables";
import { CoreConfig, Tables } from "@core/lib";
import { hashEntities } from "@core/utils/global/encode";

export const createPlanetNameUtils = (tables: Tables, config: CoreConfig) => {
  const prefixes = [
    "Zy",
    "Xe",
    "Vo",
    "Ne",
    "Ar",
    "Io",
    "Ux",
    "El",
    "Ry",
    "Ka",
    "Bi",
    "Mu",
    "Fy",
    "Ja",
    "Lo",
    "Wi",
    "Pu",
    "Sy",
    "Ga",
    "Jour",
    "Zoro",
    "Waz",
    "Ord",
    "Micro",
    "Macro",
    "Nano",
    "Blue",
    "Femto",
    "Atto",
    "Zepto",
    "Yoto",
  ];

  const suffixes = [
    "thor",
    "noxia",
    "ria",
    "luxo",
    "ton",
    "plex",
    "thoo",
    "dor",
    "mira",
    "zar",
    "vex",
    "quin",
    "fire",
    "seff",
    "nova",
    "fluu",
    "glow",
    "roe",
    "eta",
    "aura",
    "olio",
    "lanta",
    "sona",
    "garra",
    "ra",
    "bar",
    "taco",
    "plex",
    "zone",
  ];
  /**
   * Converts an entity to a planet name.
   * @param entity - The entity to convert.
   * @returns The planet name.
   */
  let noConnection = false;
  const refreshPlanetName = async (entity: Entity) => {
    if (!config.accountLinkUrl || noConnection) {
      tables.PlanetName.set(
        {
          name: generatePlanetName(entity),
          lastFetched: Date.now(),
        },
        entity,
      );
      return;
    }
    try {
      let fetchedName: string | null = null;
      const res = await fetch(`${config.accountLinkUrl}/planet/${entity}?worldAddress=1`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const content = (await res.json()) as {
        planetName: string | null;
      };
      if (content.planetName) {
        fetchedName = content.planetName;
      }
      tables.PlanetName.set(
        {
          name: fetchedName ?? generatePlanetName(entity),
          lastFetched: Date.now(),
        },
        entity,
      );
    } catch (error) {
      console.error(error);
      noConnection = true;
      tables.PlanetName.set(
        {
          name: generatePlanetName(entity),
          lastFetched: Date.now(),
        },
        entity,
      );
    }
  };

  const REFRESH_INTERVAL = 1000 * 30; // 30 seconds

  const getPlanetName = async (entity: Entity, forceRefresh = false): Promise<string> => {
    if (!config.accountLinkUrl) return generatePlanetName(entity);
    const cachedName = tables.PlanetName.get(entity);

    if (cachedName && Date.now() - cachedName.lastFetched < REFRESH_INTERVAL && !forceRefresh) return cachedName.name;
    try {
      await refreshPlanetName(entity);
      const name = tables.PlanetName.get(entity)?.name;
      return name ?? generatePlanetName(entity);
    } catch (error) {
      console.error(error);
    }
    return generatePlanetName(entity);
  };

  const generatedNames = new Map<string, string>();
  const generatePlanetName = (entity: Entity): string => {
    if (generatedNames.has(entity)) return generatedNames.get(entity)!;
    const hash = hashEntities(entity);

    const prefixIndex = parseInt(hash.substring(8, 12), 16) % prefixes.length;
    const suffixIndex = parseInt(hash.substring(4, 8), 16) % suffixes.length;

    const name = `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`;
    if (generatedNames.has(name)) {
      return generatePlanetName(entity);
    }
    generatedNames.set(entity, name);
    return name;
  };

  return {
    getPlanetName,
    generatePlanetName,
    refreshPlanetName,
  };
};
