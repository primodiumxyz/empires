// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

/* Change the variables at lines 58-62 to the desired future values */

import { Vm } from "forge-std/Vm.sol";
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Ready, P_GameConfig, P_GameConfigData } from "codegen/index.sol";

contract ChangeGameConfig is Script {
  string constant WORLDJSON_PATH = "./worlds.json";

  function run() external {
    /*//////////////////////////////////////////////////////////////
                            ENV VARIABLES
    //////////////////////////////////////////////////////////////*/
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    /*//////////////////////////////////////////////////////////////
                            EMPIRES
    //////////////////////////////////////////////////////////////*/
    address worldAddress = getWorldAddress();
    IWorld world = IWorld(worldAddress);
    console.log("world address:", worldAddress);

    vm.startBroadcast(deployerPrivateKey);
    StoreSwitch.setStoreAddress(worldAddress);

    console.log("Current block:", block.number);

    // get existing config
    // P_GameConfig: {
    //   turnLengthBlocks: 15n,      // 2 second blocks on base and baseSep, 24 second turn
    //   nextGameLengthTurns: 30n,   // numbers of turns, a round = turnBlockLength * nextGameLengthTurns
    //   goldGenRate: 1n,
    //   gameStartBlock: 0n, // currently handled by .env and PostDeploy
    //   gameOverBlock: 0n, // currently handled in PostDeploy
    //   delayBetweenRounds: 120n, // blocks between rounds
    //   empireCount: 6,
    //   empiresCleared: 0,
    // },
    P_GameConfigData memory config = P_GameConfig.get();

    uint turnLengthBlocks = config.turnLengthBlocks;
    uint nextGameLengthTurns = config.nextGameLengthTurns;
    uint gameStartBlock = config.gameStartBlock;
    uint gameOverBlock = config.gameOverBlock;
    uint delayBetweenRounds = config.delayBetweenRounds;

    /*//////////////////////////////////////////////////////////////
                          Change Settings
    //////////////////////////////////////////////////////////////*/
    // update config variables here

    turnLengthBlocks = 150; // 2 second blocks, 5 minute turn
    nextGameLengthTurns = 240; // 20 hours
    gameStartBlock = block.number + 150; // start 5 minutes after script runs
    gameOverBlock = gameStartBlock + (turnLengthBlocks * nextGameLengthTurns); // 20 hours after start
    delayBetweenRounds = 3600; // 2 hours between rounds (7200 seconds in 2 hours, 2 second blocks)

    // write the changes
    P_GameConfig.setTurnLengthBlocks(turnLengthBlocks);
    P_GameConfig.setNextGameLengthTurns(nextGameLengthTurns);
    P_GameConfig.setGameStartBlock(gameStartBlock);
    P_GameConfig.setGameOverBlock(gameOverBlock);
    P_GameConfig.setDelayBetweenRounds(delayBetweenRounds);

    // reset game
    world.Empires__resetGame(gameStartBlock);
    while (Ready.get() == false) {
      console.log("Waiting for Ready");
      world.Empires__resetGame(gameStartBlock);
    }

    vm.stopBroadcast();
  }

  function getWorldAddress() internal returns (address) {
    address worldAddress = address(0);
    if (!vm.isFile(WORLDJSON_PATH)) {
      return worldAddress;
    }

    string memory worldJson = vm.readFile(WORLDJSON_PATH);
    string memory chainIdString = string.concat(".", vm.toString(block.chainid));
    bool chainIdExists = vm.keyExistsJson(worldJson, chainIdString);
    if (chainIdExists) {
      string[] memory keys = vm.parseJsonKeys(worldJson, chainIdString);
      string memory addressKeyString = string.concat(chainIdString, string.concat(".", keys[0]));
      bool addressExists = vm.keyExistsJson(worldJson, addressKeyString);
      if (addressExists) {
        worldAddress = vm.parseJsonAddress(worldJson, addressKeyString);
      } else {
        console.log("[CHANGECONFIG] address not found");
      }
    } else {
      console.log("[CHANGECONFIG] chainId not found");
    }

    if (worldAddress != address(0)) {
      if (worldAddress.code.length == 0) {
        console.log("[CHANGECONFIG] No contract at address");
        worldAddress = address(0);
      }
    }
    return worldAddress;
  }
}
