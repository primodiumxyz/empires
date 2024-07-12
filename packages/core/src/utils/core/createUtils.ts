import { Tables } from "@core/lib/types";
import { createPriceUtils } from "@core/utils/core/price";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  return { ...priceUtils };
};
