import { useEffect, useMemo } from "react";

import { createLocalTable, createWorld, Type } from "@primodiumxyz/reactive-tables";

const settingsWorld = createWorld();

/* -------------------------------------------------------------------------- */
/*                                   TABLES                                   */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- Font ---------------------------------- */
const FontStyle = createLocalTable(
  settingsWorld,
  {
    family: Type.String,
    size: Type.String,
  },
  {
    id: "FontStyle",
    persist: true,
  },
);

export const fontStyleOptions = {
  family: ["pixel", "mono"],
  size: ["sm", "md"],
} as const;

FontStyle.set({
  family: fontStyleOptions.family[0],
  size: fontStyleOptions.size[0],
});

/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

export const useSettings = () => {
  // font
  const fontStyle = FontStyle.use();
  const setFontStyleFamily = (family: (typeof fontStyleOptions.family)[number]) => FontStyle.update({ family });
  const setFontStyleSize = (size: (typeof fontStyleOptions.size)[number]) => FontStyle.update({ size });

  useEffect(() => {
    return () => {
      settingsWorld.dispose();
    };
  }, []);

  return {
    fontStyle: {
      family: fontStyle?.family ?? fontStyleOptions.family[0],
      size: fontStyle?.size ?? fontStyleOptions.size[0],
      setFamily: setFontStyleFamily,
      setSize: setFontStyleSize,
    },
  };
};
