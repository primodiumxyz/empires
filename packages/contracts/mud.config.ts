import { defineWorld } from "@latticexyz/world";
import { MUDEnums } from "./config/enums";
import { prototypeConfig } from "./config/prototypeConfig";
import { ConfigWithPrototypes } from "./ts/prototypes/types";

// Exclude dev systems if not in dev PRI_DEV

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

export const worldInput = {
  namespace: "Empires",

  // add all subsystems here
  // systems: {},

  // using as any here for now because of a type issue and also because the enums are not being recognized in our codebase rn
  enums: MUDEnums,
  tables: {
    /* ---------------------------------- Game ---------------------------------- */
    P_GameConfig: {
      key: [],
      schema: {
        turnLengthBlocks: "uint256",
        goldGenRate: "uint256",
      },
    },

    Turn: {
      key: [],
      schema: { nextTurnBlock: "uint256", empire: "EEmpire" },
    },

    Player: {
      key: ["id"],
      schema: {
        id: "bytes32",
        spent: "uint256",
      },
    },

    Points: {
      key: ["playerId", "factionId"],
      schema: {
        playerId: "bytes32",
        factionId: "EEmpire",
        value: "uint256",
      },
    },

    Value: {
      key: ["planetId"],
      schema: { planetId: "bytes32", value: "uint256" },
      type: "offchainTable",
    },

    // see https://www.redblobgames.com/grids/hexagons/#conversions-axial for context
    Planet: {
      key: ["id"],
      schema: {
        id: "bytes32",
        q: "int128",
        r: "int128",
        isPlanet: "bool",
        destroyerCount: "uint256",
        goldCount: "uint256",
        factionId: "EEmpire",
      },
    },

    Faction: {
      key: ["id"],
      schema: {
        id: "EEmpire",
        origin: "EOrigin",
        pointsIssued: "uint256",
        pointCost: "uint256",
        actionCost: "uint256[]",
      },
    },

    /* ---------------------------- Faction Ownership --------------------------- */
    Keys_FactionPlanetsSet: {
      key: ["factionId"],
      schema: { factionId: "EEmpire", itemKeys: "bytes32[]" },
    },

    Meta_FactionPlanetsSet: {
      key: ["factionId", "planetId"],
      schema: { factionId: "EEmpire", planetId: "bytes32", stored: "bool", index: "uint256" },
    },

    /* --------------------------------- Planets -------------------------------- */
    Keys_PlanetsSet: {
      key: [],
      schema: { itemKeys: "bytes32[]" },
    },

    Meta_PlanetsSet: {
      key: ["id"],
      schema: { id: "bytes32", stored: "bool", index: "uint256" },
    },

    /* -------------------------------- Movement -------------------------------- */

    P_NPCActionThresholds: {
      key: [],
      schema: {
        none: "uint256",
        buyDestroyers: "uint256",
      },
    },

    P_NPCActionCosts: {
      key: ["action"],
      schema: {
        action: "ENPCAction",
        goldCost: "uint256",
      },
    },
    // each value denotes a threshold for the likelihood of a move in that direction
    // the total is out of 10000
    P_NPCMoveThresholds: {
      key: [],
      schema: {
        none: "uint256",
        retreat: "uint256",
        lateral: "uint256",
        expand: "uint256",
      },
    },

    Arrivals: {
      key: ["planetId"],
      schema: {
        planetId: "bytes32",
        destroyerCount: "uint256",
      },
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
