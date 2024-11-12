// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PayoutManager} from "src/PayoutManager.sol";

contract DeployPayoutManager is Script {
    uint256 OWNER =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil[0]
    string path = "../../packages/contracts/payman.json";

    function run() external returns (PayoutManager) {
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
        return payman;
    }
}
