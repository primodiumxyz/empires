import { defineWorld } from "@latticexyz/world";
import { MUDEnums } from "./config/enums";
import { prototypeConfig } from "./config/prototypeConfig";
import { ConfigWithPrototypes } from "./ts/prototypes/types";

// Exclude dev systems if not in dev PRI_DEV

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

export const worldInput = {
  namespace: "Primodium_Base",

  // add all subsystems here
  // systems: {},

  // using as any here for now because of a type issue and also because the enums are not being recognized in our codebase rn
  enums: MUDEnums,
  tables: {
    /* ----------------------------------- Dev ---------------------------------- */

    Counter: {
      key: [],
      schema: { value: "uint256" },
    },

    /* ---------------------------------- Game ---------------------------------- */
    Player: {
      key: ["id"],
      schema: {
        id: "bytes32",
        points: "bytes32",
      },
    },

    // see https://www.redblobgames.com/grids/hexagons/#conversions-axial for context
    Tile: {
      key: ["q", "r"],
      schema: {
        q: "int256",
        r: "int256",
        isTile: "bool",
        destroyerCount: "uint256",
        factionId: "uint256",
      },
    },

    // see https://www.redblobgames.com/grids/hexagons/#conversions-axial for context

    /* ---------------------------- Faction Ownership --------------------------- */
    Keys_FactionTilesSet: {
      key: ["factionId"],
      schema: { factionId: "bytes32", itemKeys: "bytes32[]" },
    },

    Meta_FactionTilesSet: {
      key: ["factionId", "planetId"],
      schema: { factionId: "bytes32", planetId: "bytes32", stored: "bool", index: "uint256" },
    },
  },
} as const;

const getConfig = async () => {
  let exclude: string[] = [];
  if (typeof process != undefined && typeof process != "undefined") {
    const dotenv = await import("dotenv");
    dotenv.config({ path: "../../.env" });
    if (process.env.PRI_DEV !== "true") exclude = ["DevSystem"];
  }

  const world = defineWorld({
    ...worldInput,
    modules: [],
    excludeSystems: exclude,
  });

  return world;
};

const config = await getConfig();
export default config;

export const configInputs: ConfigWithPrototypes<typeof worldInput, (typeof worldInput)["tables"]> = {
  worldInput,
  prototypeConfig,
};
