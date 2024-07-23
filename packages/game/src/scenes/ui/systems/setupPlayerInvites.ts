import { PrimodiumScene } from "@game/types";
import { Core, entityToPlayerName } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
import { EAllianceRole } from "contracts/config/enums";
import { Hex, hexToString, padHex, zeroAddress } from "viem";

export function setupPlayerInvites(scene: PrimodiumScene, core: Core): void {
  const {
    network: { world },
    tables,
    utils,
  } = core;

  const systemWorld = namespaceWorld(world, "clientSystems");
  const playerEntity = tables.Account.get()?.value;

  tables.AllianceInvitation.watch({
    world: systemWorld,
    onChange: ({ entity, properties: { current } }) => {
      const { alliance, entity: player } = decodeEntity(tables.AllianceInvitation.metadata.abiKeySchema, entity);

      if (current?.inviter === padHex(zeroAddress, { size: 32 })) {
        tables.PlayerInvite.remove(entity);
        return;
      }

      tables.PlayerInvite.set(
        {
          target: player as Entity,
          alliance: alliance as Entity,
          player: current?.inviter as Entity,
          timestamp: current?.timeStamp ?? 0n,
        },
        entity
      );
    },
  });

  tables.AllianceJoinRequest.watch({
    world: systemWorld,
    onChange: ({ entity, properties: { current } }) => {
      const { alliance, entity: player } = decodeEntity(tables.AllianceJoinRequest.metadata.abiKeySchema, entity);

      if (!current?.timeStamp) {
        tables.AllianceRequest.remove(entity);
        if (player !== playerEntity) return;

        // Notify the player about the outcome
        const allianceName = utils.getAllianceName(alliance as Entity);
        if (tables.PlayerAlliance.get(playerEntity)?.alliance === alliance) {
          //TODO
          scene.notify("success", `You have been accepted into [${allianceName}]!`);
        } else {
          //TODO
          scene.notify("info", `Your request to join [${allianceName}] was declined`);
        }

        return;
      }

      tables.AllianceRequest.set(
        {
          player: player as Entity,
          alliance: alliance as Entity,
          timestamp: current?.timeStamp ?? 0n,
        },
        entity
      );

      // Notify members of the alliance (only officers that can actually accept)
      const officers = tables.PlayerAlliance.getAllWith({
        alliance,
      }).filter((p) => tables.PlayerAlliance.get(p)?.role !== EAllianceRole.Member);
      if (playerEntity && officers.includes(playerEntity)) {
        const playerName = entityToPlayerName(player as Entity);
        //TODO
        scene.notify("info", `${playerName} has requested to join the alliance`);
      }
    },
  });

  tables.PlayerInvite.watch({
    world: systemWorld,
    onChange: ({ entity, properties: { current } }) => {
      if (!current) return;

      if (current?.player === padHex(zeroAddress, { size: 32 })) {
        return;
      }

      // 30 sec buffer
      const now = tables.Time.get()?.value ?? 0n;
      if (current?.timestamp + 30n < now) return;

      const invite = tables.PlayerInvite.get(entity);
      const inviteAlliance = tables.Alliance.get(invite?.alliance as Entity)?.name as Hex | undefined;

      if (!inviteAlliance || invite?.target !== playerEntity) return;

      const allianceName = hexToString(inviteAlliance, { size: 32 });

      //TODO
      scene.notify("info", `You have been invited to join [${allianceName}]`);
    },
  });
}
