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
  systems: {
    UpdateCombatSubsystem: { openAccess: false },
    UpdateEmpiresSubsystem: { openAccess: false },
    UpdateMagnetsSubsystem: { openAccess: false },
    UpdatePriceSubsystem: { openAccess: false },
    UpdateShieldEaterSubsystem: { openAccess: false },
    ResetClearLoopSubsystem: { openAccess: false },
  },

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
        empireCount: "uint8",
      },
    },

    P_TacticalStrikeConfig: {
      key: [],
      schema: {
        maxCharge: "uint256",
        chargeRate: "uint256",
        boostChargeIncrease: "uint256",
        stunChargeDecrease: "uint256",
        createShipBoostIncrease: "uint256", // per ship created
        killShipBoostCostDecrease: "uint256", // per ship killed
      },
    },

    P_ShieldEaterConfig: {
      key: [],
      schema: {
        visitShieldDamage: "uint256",
        detonateCenterDamage: "uint256", // percentage, out of 10000
        detonateAdjacentDamage: "uint256", // percentage, out of 10000
        detonationThreshold: "uint256",
      },
    },

    P_PointConfig: {
      key: [],
      schema: {
        pointUnit: "uint256",
        pointRake: "uint256", // times 10_000
        pointSellTax: "uint256",
        minPointCost: "uint256",
        startPointCost: "uint256",
        pointGenRate: "uint256",
        pointCostIncrease: "uint256",
      },
    },

    P_OverrideConfig: {
      key: ["overrideAction"],
      schema: {
        overrideAction: "EOverride",
        isProgressOverride: "bool",
        minOverrideCost: "uint256",
        startOverrideCost: "uint256",
        overrideGenRate: "uint256",
        overrideCostIncrease: "uint256",
      },
    },

    P_MagnetConfig: {
      key: [],
      schema: {
        lockedPointsPercent: "uint256", // out of 10000
      },
    },

    Ready: {
      key: [],
      schema: {
        value: "bool",
      },
    },

    Turn: {
      key: [],
      schema: { nextTurnBlock: "uint256", empire: "EEmpire", value: "uint256" },
    },

    WinningEmpire: {
      key: [],
      schema: { empire: "EEmpire" },
    },

    /* ------------------------------- Players Map ------------------------------ */
    // Used in the mbuilding utilities Map data structure
    Value_PlayersMap: {
      key: ["playerId"],
      schema: { playerId: "bytes32", gain: "uint256", loss: "uint256" },
    },

    Meta_PlayersMap: {
      key: ["playerId"],
      schema: { playerId: "bytes32", stored: "bool", index: "uint256" },
    },
    Keys_PlayersMap: {
      key: [],
      schema: { players: "bytes32[]" },
    },
    /* ------------------------------- Points Map ------------------------------- */

    // Used in the mbuilding utilities Map data structure
    Value_PointsMap: {
      key: ["empireId", "playerId"],
      schema: { playerId: "bytes32", empireId: "EEmpire", value: "uint256", lockedPoints: "uint256" },
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
        isCitadel: "bool",
        shipCount: "uint256",
        shieldCount: "uint256",
        goldCount: "uint256",
        empireId: "EEmpire",
      },
    },

    Planet_TacticalStrike: {
      key: ["planetId"],
      schema: {
        planetId: "bytes32",
        lastUpdated: "uint256",
        charge: "uint256",
        chargeRate: "uint256",
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

    OverrideCost: {
      key: ["empireId", "overrideAction"],
      schema: {
        empireId: "EEmpire",
        overrideAction: "EOverride",
        value: "uint256",
      },
    },

    ShieldEater: {
      key: [],
      schema: {
        currentPlanet: "bytes32",
        destinationPlanet: "bytes32",
        currentCharge: "uint256",
        pathIndex: "uint256",
        path: "bytes32[]",
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

    Keys_CitadelPlanetsSet: {
      key: [],
      schema: { itemKeys: "bytes32[]" },
    },

    Meta_CitadelPlanetsSet: {
      key: ["id"],
      schema: { id: "bytes32", stored: "bool", index: "uint256" },
    },

    /* ------------------------------- NPC Routines ----------------------------- */

    P_RoutineCosts: {
      key: ["routine"],
      schema: {
        routine: "ERoutine",
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

    /* ----------------------------- Magnet ---------------------------- */

    Magnet: {
      key: ["empireId", "planetId"],
      schema: {
        planetId: "bytes32",
        empireId: "EEmpire",
        isMagnet: "bool",
        lockedPoints: "uint256",
        endTurn: "uint256",
        playerId: "bytes32",
      },
    },

    MagnetTurnPlanets: {
      key: ["empireId", "endTurn"],
      schema: {
        empireId: "EEmpire",
        endTurn: "uint256",
        planetIds: "bytes32[]",
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

    MoveRoutineLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        originPlanetId: "bytes32",
        destinationPlanetId: "bytes32",
        shipCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    ShipBattleRoutineLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        redShipCount: "uint256",
        greenShipCount: "uint256",
        blueShipCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    PlanetBattleRoutineLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        attackingShipCount: "uint256",
        defendingShipCount: "uint256",
        defendingShieldCount: "uint256",
        conquer: "bool",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    AccumulateGoldRoutineLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        goldAdded: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BuyShipsRoutineLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        goldSpent: "uint256",
        shipBought: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BuyShieldsRoutineLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        goldSpent: "uint256",
        shieldBought: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    CreateShipOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        playerId: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    KillShipOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        playerId: "bytes32",
        planetId: "bytes32",
        ethSpent: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    ChargeShieldsOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        ethSpent: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    DrainShieldsOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        ethSpent: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    PlaceMagnetOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        empireId: "EEmpire",
        ethSpent: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    BoostChargeOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        ethSpent: "uint256",
        boostCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    StunChargeOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        ethSpent: "uint256",
        stunCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    TacticalStrikeOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    ShieldEaterDetonateOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        planetId: "bytes32",
        ethSpent: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    AirdropGoldOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        empireId: "EEmpire",
        goldDistributed: "uint256",
        ethSpent: "uint256",
        overrideCount: "uint256",
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
