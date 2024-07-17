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

  // using as any here for now because of a type issue and also because the enums are not being recognized in our codebase rn
  enums: MUDEnums,
  tables: {
    /* ---------------------------------- Game ---------------------------------- */
    P_GameConfig: {
      key: [],
      schema: {
        turnLengthBlocks: "uint256",
        goldGenRate: "uint256",
        gameOverBlock: "uint256",
        gameStartTimestamp: "uint256",
      },
    },

    P_PointConfig: {
      key: [],
      schema: {
        pointUnit: "uint256",
        minPointCost: "uint256",
        startPointCost: "uint256",
        pointGenRate: "uint256",
        pointCostIncrease: "uint256",
        pointRake: "uint256", // times 10_000
        pointSellTax: "uint256",
      },
    },

    P_ActionConfig: {
      key: [],
      schema: {
        actionGenRate: "uint256",
        actionCostIncrease: "uint256",
        startActionCost: "uint256",
        minActionCost: "uint256",
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

    WinningEmpire: {
      key: [],
      schema: { empire: "EEmpire" },
    },
    /* ------------------------------- Points Map ------------------------------- */

    // Used in the mbuilding utilities Map data structure
    Value_PointsMap: {
      key: ["factionId", "playerId"],
      schema: { playerId: "bytes32", factionId: "EEmpire", value: "uint256" },
    },

    Meta_PointsMap: {
      key: ["factionId", "playerId"],
      schema: { playerId: "bytes32", factionId: "EEmpire", stored: "bool", index: "uint256" },
    },

    Keys_PointsMap: {
      key: ["factionId"],
      schema: { factionId: "EEmpire", players: "bytes32[]" },
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
      },
    },

    ActionCost: {
      key: ["factionId", "action"],
      schema: {
        factionId: "EEmpire",
        action: "EPlayerAction",
        value: "uint256",
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

    /* ----------------------------- Offchain Tables ---------------------------- */

    // used to generate random ids for offchain tables
    Nonce: {
      key: [],
      schema: {
        value: "uint256",
      },
    },

    MoveNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        originPlanetId: "bytes32",
        destinationPlanetId: "bytes32",
        shipCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BattleNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        attackingShipCount: "uint256",
        defendingShipCount: "uint256",
        conquer: "bool",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BuyDestroyersNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        goldSpent: "uint256",
        destroyerBought: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    CreateDestroyerPlayerAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    KillDestroyerPlayerAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },
    /* ----------------------------- Historical data ---------------------------- */

    HistoricalPointCost: {
      key: ["empire", "timestamp"],
      schema: {
        empire: "EEmpire",
        timestamp: "uint256",
        cost: "uint256", // the cost of each point for this empire in wei
      },
      type: "offchainTable",
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
    excludeSystems: [...exclude, "WithdrawRakeSystem"],
  });

  return world;
};

const config = await getConfig();
export default config;

export const configInputs: ConfigWithPrototypes<typeof worldInput, (typeof worldInput)["tables"]> = {
  worldInput,
  prototypeConfig,
};
