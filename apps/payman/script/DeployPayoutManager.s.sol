// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PayoutManager} from "src/PayoutManager.sol";

contract DeployPayoutManager is Script {
    string PAYMAN_PATH = "../../packages/contracts/payman.json";

    function run() external returns (PayoutManager) {
        PayoutManager payman;

        if (getPaymanAddress() == address(0)) {
            uint256 OWNER = vm.envUint("PRIVATE_KEY");

            vm.startBroadcast(OWNER);
            console.log("Deploying PayoutManager...");
            payman = new PayoutManager();
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
            vm.writeJson(finalJson, PAYMAN_PATH);
        } else {
            console.log("Existing PayoutManager found");
            payman = PayoutManager(getPaymanAddress());
        }

        console.log("PayoutManager deployed at", address(payman));
        return payman;
    }

    function getPaymanAddress() internal returns (address) {
        address paymanAddress = address(0);
        if (!vm.isFile(PAYMAN_PATH)) {
            return paymanAddress;
        }
        string memory paymanJson = vm.readFile(PAYMAN_PATH);
        string memory chainIdString = string.concat(
            ".",
            vm.toString(block.chainid)
        );
        bool chainIdExists = vm.keyExistsJson(paymanJson, chainIdString);
        if (chainIdExists) {
            string[] memory keys = vm.parseJsonKeys(paymanJson, chainIdString);
            string memory addressKeyString = string.concat(
                chainIdString,
                string.concat(".", keys[0])
            );
            bool addressExists = vm.keyExistsJson(paymanJson, addressKeyString);
            if (addressExists) {
                paymanAddress = vm.parseJsonAddress(
                    paymanJson,
                    addressKeyString
                );
            } else {
                console.log("[PAYMAN] address not found");
            }
        } else {
            console.log("[PAYMAN] chainId not found");
        }
        return paymanAddress;
    }
}
