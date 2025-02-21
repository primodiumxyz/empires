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
    UpdateEmpiresSubsystem: { openAccess: false },
    UpdateAcidSubsystem: { openAccess: false },
    UpdateMagnetsSubsystem: { openAccess: false },
    UpdatePriceSubsystem: { openAccess: false },
    UpdateShieldEaterSubsystem: { openAccess: false },
    ResetClearLoopSubsystem: { openAccess: false },
    ResetSystem: { openAccess: false },
    PayoutSystem: { openAccess: false },
  },

  // using as any here for now because of a type issue and also because the enums are not being recognized in our codebase rn
  enums: MUDEnums,
  tables: {
    /* ---------------------------------- Game ---------------------------------- */
    P_GameConfig: {
      key: [],
      schema: {
        turnLengthBlocks: "uint256",
        nextGameLengthTurns: "uint256",
        goldGenRate: "uint256",
        gameStartBlock: "uint256",
        gameOverBlock: "uint256",
        delayBetweenRounds: "uint256",
        empireCount: "uint8",
        empiresCleared: "uint8",
      },
    },

    P_ShieldEaterConfig: {
      key: [],
      schema: {
        visitShieldDamage: "uint256",
        detonateCenterDamage: "uint256", // percentage, out of 10000
        detonateAdjacentDamage: "uint256", // percentage, out of 10000
        detonationThreshold: "uint256",
        retargetMaxThreshold: "uint256",
      },
    },

    P_PointConfig: {
      key: [],
      schema: {
        pointUnit: "uint256",
        pointRake: "uint256", // times 10_000
        pointSellTax: "uint256", // times 10_000
        minPointPrice: "uint256",
        startPointPrice: "uint256",
        pointGenRate: "uint256",
        pointPriceIncrease: "uint256",
      },
    },

    P_OverrideConfig: {
      key: ["overrideAction"],
      schema: {
        overrideAction: "EOverride",
        isProgressOverride: "bool",
        pointMultiplier: "uint256",
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

    P_AcidConfig: {
      key: [],
      schema: {
        acidDuration: "uint256",
        acidDamagePercent: "uint256", // out of 10000
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

    PayoutManager: {
      key: [],
      schema: { contractAddress: "address" },
    },

    RakeRecipient: {
      key: [],
      schema: { recipientAddress: "address" },
    },

    /* ----------------------------- Access Control ----------------------------- */

    Role: {
      key: ["id"],
      schema: { id: "address", value: "ERole" },
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

    Empire: {
      key: ["id"],
      schema: {
        id: "EEmpire",
        pointsIssued: "uint256",
        pointPrice: "uint256", // todo: change to pointPrice
        isDefeated: "bool",
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
        retargetPending: "bool",
        retargetCount: "uint256",
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

    /* ----------------------------- Arrived ---------------------------- */

    Value_ArrivedMap: {
      key: ["planetId"],
      schema: { planetId: "bytes32", value: "uint256" },
    },
    Meta_ArrivedMap: {
      key: ["planetId"],
      schema: { planetId: "bytes32", stored: "bool", index: "uint256" },
    },
    Keys_ArrivedMap: {
      key: [],
      schema: { itemKeys: "bytes32[]" },
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

    /* ----------------------------- Acid ---------------------------- */

    Keys_AcidPlanetsSet: {
      key: ["empireId"],
      schema: { empireId: "EEmpire", itemKeys: "bytes32[]" },
    },

    Meta_AcidPlanetsSet: {
      key: ["empireId", "planetId"],
      schema: { empireId: "EEmpire", planetId: "bytes32", stored: "bool", index: "uint256" },
    },

    Value_AcidPlanetsSet: {
      key: ["empireId", "planetId"],
      schema: { empireId: "EEmpire", planetId: "bytes32", value: "uint256" },
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
        conquered: "bool",
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

    PlaceAcidOverrideLog: {
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

    SellPointsOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        playerId: "bytes32",
        turn: "uint256",
        empireId: "EEmpire",
        ethReceived: "uint256",
        overrideCount: "uint256",
        timestamp: "uint256",
      },
      type: "offchainTable",
    },

    // Override impact logs
    AcidDamageOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        shipsDestroyed: "uint256",
        timestamp: "uint256",
      },
    },

    ShieldEaterDamageOverrideLog: {
      key: ["id"],
      schema: {
        id: "bytes32",
        planetId: "bytes32",
        shieldsDestroyed: "uint256",
        damageType: "EShieldEaterDamageType",
        timestamp: "uint256",
      },
    },

    /* ----------------------------- Historical data ---------------------------- */

    HistoricalPointPrice: {
      key: ["empire", "timestamp"],
      schema: {
        empire: "EEmpire",
        timestamp: "uint256",
        price: "uint256", // the price of each point for this empire in wei
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
