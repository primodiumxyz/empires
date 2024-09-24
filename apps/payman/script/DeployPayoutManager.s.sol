// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {PayoutManager} from "src/PayoutManager.sol";

contract DeployPayoutManager is Script {
    address OWNER = makeAddr("OWNER");

    function run() external returns (PayoutManager) {
        vm.startBroadcast(OWNER);
        PayoutManager payman = new PayoutManager();
        vm.stopBroadcast();
        return payman;
    }
}
