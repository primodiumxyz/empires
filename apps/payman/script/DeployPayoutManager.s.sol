// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PayoutManager} from "src/PayoutManager.sol";

contract DeployPayoutManager is Script {
    string path = "../../packages/contracts/payman.json";

    function run() external returns (PayoutManager) {
        uint256 OWNER = vm.envUint("ADMIN_PRIVATE_KEY");
        console.log("admin pk retrieved from .env");

        vm.startBroadcast(OWNER);
        PayoutManager payman = new PayoutManager();
        vm.stopBroadcast();

        string memory obj1 = "top";
        string memory obj2 = "item";
        string memory output = vm.serializeAddress(
            obj2,
            "ADDRESS",
            address(payman)
        );

        string memory finalJson = vm.serializeString(
            obj1,
            vm.toString(block.chainid),
            output
        );
        vm.writeJson(finalJson, path);
        console.log("PayoutManager deployed at", address(payman));
        return payman;
    }
}
