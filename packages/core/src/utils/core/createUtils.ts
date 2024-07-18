import { Tables } from "@core/lib/types";
import { createNavUtils } from "@core/utils/core/nav";
import { createPriceUtils } from "@core/utils/core/price";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  const navUtils = createNavUtils(tables);

  return { ...priceUtils, ...navUtils };
};
