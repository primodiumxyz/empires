import { Tables } from "@core/lib/types";
import { createNavUtils } from "@core/utils/core/nav";
import { createNpcUtils } from "@core/utils/core/npc";
import { createPriceUtils } from "@core/utils/core/price";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  const navUtils = createNavUtils(tables);
  const npcUtils = createNpcUtils(tables);

  return { ...priceUtils, ...navUtils, ...npcUtils };
};
