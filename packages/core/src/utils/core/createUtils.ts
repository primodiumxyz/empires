import { Tables } from "@core/lib/types";
import { createEmpireUtils } from "@core/utils/core/empire";
import { createNavUtils } from "@core/utils/core/nav";
import { createNpcUtils } from "@core/utils/core/npc";
import { createOverrideUtils } from "@core/utils/core/overrides";
import { createPriceUtils } from "@core/utils/core/price";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  const navUtils = createNavUtils(tables);
  const npcUtils = createNpcUtils(tables);
  const empireUtils = createEmpireUtils(tables);
  const overrideUtils = createOverrideUtils(tables);

  return { ...priceUtils, ...navUtils, ...npcUtils, ...empireUtils, ...overrideUtils };
};
