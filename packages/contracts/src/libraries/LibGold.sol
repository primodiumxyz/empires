// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import {pseudorandom} from "src/utils.sol";
import {Planet, P_NPCActionThresholdsData, P_NPCActionThresholds, P_NPCActionCosts} from "codegen/index.sol";
import {ENPCAction} from "codegen/common.sol";

library LibGold {
    function spendGold(bytes32 planetId) internal {
        uint256 goldCount = Planet.getGoldCount(planetId);
        if (goldCount == 0) return;

        uint256 randomValue = pseudorandom(uint256(planetId) + 128, 10_000);
        _spendGold(planetId, randomValue);
    }

    // separated for testing
    function _spendGold(bytes32 planetId, uint256 value) internal {
        uint256 goldCount = Planet.getGoldCount(planetId);
        P_NPCActionThresholdsData memory actionConfig = P_NPCActionThresholds.get();

        if (value < actionConfig.none) {
            return;
        } else if (value < actionConfig.buyDestroyers) {
            uint256 destroyerPrice = P_NPCActionCosts.get(ENPCAction.BuyDestroyers);
            if (destroyerPrice == 0) return;
            uint256 destroyersToBuy = goldCount / destroyerPrice;
            if (destroyersToBuy == 0) return;
            uint256 newGoldCount = goldCount - (destroyersToBuy * destroyerPrice);
            Planet.setDestroyerCount(planetId, Planet.getDestroyerCount(planetId) + destroyersToBuy);
            Planet.setGoldCount(planetId, newGoldCount);
        } else if (value < actionConfig.buyShields) {
            uint256 shieldPrice = P_NPCActionCosts.get(ENPCAction.BuyShields);
            if (shieldPrice == 0) return;
            uint256 shieldsToBuy = goldCount / shieldPrice;
            if (shieldsToBuy == 0) return;
            uint256 newGoldCount = goldCount - (shieldsToBuy * shieldPrice);
            Planet.setShieldCount(planetId, Planet.getShieldCount(planetId) + shieldsToBuy);
            Planet.setGoldCount(planetId, newGoldCount);
        }
    }
}
