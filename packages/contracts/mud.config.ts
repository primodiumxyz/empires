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
        reductionPct: "uint256",
        regressMultiplier: "uint256",
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
      key: ["empireId", "playerId"],
      schema: { playerId: "bytes32", empireId: "EEmpire", value: "uint256" },
    },

    Meta_PointsMap: {
      key: ["empireId", "playerId"],
      schema: { playerId: "bytes32", empireId: "EEmpire", stored: "bool", index: "uint256" },
    },

    Keys_PointsMap: {
      key: ["empireId"],
      schema: { empireId: "EEmpire", players: "bytes32[]" },
    },

    // see https://www.redblobgames.com/grids/hexagons/#conversions-axial for context
    Planet: {
      key: ["id"],
      schema: {
        id: "bytes32",
        q: "int128",
        r: "int128",
        isPlanet: "bool",
        shipCount: "uint256",
        shieldCount: "uint256",
        goldCount: "uint256",
        empireId: "EEmpire",
      },
    },

    Empire: {
      key: ["id"],
      schema: {
        id: "EEmpire",
        origin: "EOrigin",
        pointsIssued: "uint256",
        pointCost: "uint256",
      },
    },

    ActionCost: {
      key: ["empireId", "action"],
      schema: {
        empireId: "EEmpire",
        action: "EPlayerAction",
        value: "uint256",
      },
    },

    /* ---------------------------- Empire Ownership --------------------------- */
    Keys_EmpirePlanetsSet: {
      key: ["empireId"],
      schema: { empireId: "EEmpire", itemKeys: "bytes32[]" },
    },

    Meta_EmpirePlanetsSet: {
      key: ["empireId", "planetId"],
      schema: { empireId: "EEmpire", planetId: "bytes32", stored: "bool", index: "uint256" },
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

    /* ------------------------------- NPC Actions ------------------------------ */

    P_NPCActionCosts: {
      key: ["action"],
      schema: {
        action: "ENPCAction",
        goldCost: "uint256",
      },
    },

    /* -------------------------------- Movement -------------------------------- */
    PendingMove: {
      key: ["planetId"],
      schema: {
        planetId: "bytes32",
        empireId: "EEmpire",
        destinationPlanetId: "bytes32",
      },
    },

    Arrivals: {
      key: ["planetId", "empireId"],
      schema: {
        planetId: "bytes32",
        empireId: "EEmpire",
        shipCount: "uint256",
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

    ShipBattleNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        redShipCount: "uint256",
        greenShipCount: "uint256",
        blueShipCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    PlanetBattleNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        attackingShipCount: "uint256",
        defendingShipCount: "uint256",
        defendingShieldCount: "uint256",
        conquer: "bool",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    AccumulateGoldNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        goldAdded: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BuyShipsNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        goldSpent: "uint256",
        shipBought: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BuyShieldsNPCAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        goldSpent: "uint256",
        shieldBought: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    CreateShipPlayerAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        actionCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    KillShipPlayerAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        actionCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    ChargeShieldsPlayerAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        actionCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    DrainShieldsPlayerAction: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        actionCount: "uint256",
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
  // eslint-disable-next-line valid-typeof
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
