import { toHex } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";

export function createNavUtils(tables: Tables) {
  const openPane = (key: string, index = 0) => {
    const entity = toHex(key) as Entity;
    tables.SelectedTab.set({ value: index }, entity);
  };

  return {
    openPane,
  };
}
