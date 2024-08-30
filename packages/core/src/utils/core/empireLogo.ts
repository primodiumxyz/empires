import { EEmpire } from "@primodiumxyz/contracts";
import { Entity } from "@primodiumxyz/reactive-tables";
import { CoreConfig, Tables } from "@core/lib";

export const createEmpireLogoUtils = (tables: Tables, config: CoreConfig) => {
  /**
   * Converts an entity to a planet name.
   * @param entity - The entity to convert.
   * @returns The planet name.
   */

  const refreshEmpireLogo = async (empire: EEmpire) => {
    if (!config.accountLinkUrl) return;
    try {
      const res = await fetch(`${config.accountLinkUrl}/empire-logo/${empire}?worldAddress=1`);

      const blob = await res.blob();

      const file = new File([blob], "empire_logo.png", { type: "image/png" });

      tables.EmpireLogo.set(
        {
          uri: URL.createObjectURL(file) ?? "",
          lastFetched: Date.now(),
        },
        empire.toString() as Entity,
      );
    } catch (error) {
      console.error(error);
      tables.EmpireLogo.set(
        {
          uri: "",
          lastFetched: Date.now(),
        },
        empire.toString() as Entity,
      );
    }
  };

  const REFRESH_INTERVAL = 1000 * 30; // 30 seconds

  const getEmpireLogo = async (empire: EEmpire, forceRefresh = false): Promise<string> => {
    if (!config.accountLinkUrl) return "";
    const cachedLogo = tables.EmpireLogo.get(empire.toString() as Entity);

    if (cachedLogo && Date.now() - cachedLogo.lastFetched < REFRESH_INTERVAL && !forceRefresh) return cachedLogo.uri;
    try {
      await refreshEmpireLogo(empire);
      const name = tables.EmpireLogo.get(empire.toString() as Entity)?.uri;
      return name ?? "";
    } catch (error) {
      console.error(error);
    }
    return "";
  };

  return {
    getEmpireLogo,
    refreshEmpireLogo,
  };
};
