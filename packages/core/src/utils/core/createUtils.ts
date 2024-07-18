import { Tables } from "@core/lib/types";
import { createComponentsUtils } from "@core/utils/core/components";
import { createPriceUtils } from "@core/utils/core/price";

export const createUtils = (tables: Tables) => {
  const priceUtils = createPriceUtils(tables);
  const componentsUtils = createComponentsUtils(tables);

  return { ...priceUtils, ...componentsUtils };
};
