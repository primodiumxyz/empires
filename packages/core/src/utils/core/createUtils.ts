import { Tables } from "@core/lib/types";
import { createCitadelUtils } from "@core/utils/core/citadel";
import { createEmpireUtils } from "@core/utils/core/empire";
import { createNavUtils } from "@core/utils/core/nav";
import { createNpcUtils } from "@core/utils/core/npc";
import { createPriceUtils } from "@core/utils/core/price";
import { createShieldEaterUtils } from "@core/utils/core/shieldEater";
import { createUsernameUtils } from "@core/utils/core/username";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  const navUtils = createNavUtils(tables);
  const npcUtils = createNpcUtils(tables);
  const empireUtils = createEmpireUtils(tables);
  const shieldEaterUtils = createShieldEaterUtils(tables);
  const citadelUtils = createCitadelUtils(tables);
  const usernameUtils = createUsernameUtils(tables);

  return {
    ...priceUtils,
    ...navUtils,
    ...npcUtils,
    ...empireUtils,
    ...shieldEaterUtils,
    ...citadelUtils,
    ...usernameUtils,
  };
};
