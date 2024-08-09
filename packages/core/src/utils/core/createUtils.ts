import { Tables } from "@core/lib/types";
import { createEmpireUtils } from "@core/utils/core/empire";
import { createNavUtils } from "@core/utils/core/nav";
import { createNpcUtils } from "@core/utils/core/npc";
import { createPriceUtils } from "@core/utils/core/price";
import { createCitadelUtils } from "@core/utils/core/citadel";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  const navUtils = createNavUtils(tables);
  const npcUtils = createNpcUtils(tables);
  const empireUtils = createEmpireUtils(tables);
  const citadelUtils = createCitadelUtils(tables);

  return { ...priceUtils, ...navUtils, ...npcUtils, ...empireUtils, ...citadelUtils };
};
