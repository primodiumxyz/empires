import { PrimodiumScene } from "@game/types";
import { Core, entityToFleetName, entityToRockName, Mode } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

export function battleNotification(scene: PrimodiumScene, core: Core, entity: Entity) {
  const { tables } = core;
  const now = tables.Time.get()?.value ?? 0n;
  if (now === 0n) return;

  const battle = tables.Battle.get(entity);

  if (!battle) return;

  if (battle.timestamp + 30n < now) return;

  const playerEntity = tables.Account.get()?.value;
  const attackerRock = tables.OwnedBy.get(battle.attacker)?.value as Entity | undefined;
  const attackerRockOwner = tables.OwnedBy.get(attackerRock)?.value;
  const defenderIsFleet = tables.IsFleet.get(battle.defender)?.value;
  const defenderRock = defenderIsFleet
    ? (tables.OwnedBy.get(battle.defender)?.value as Entity | undefined)
    : battle.defender;
  const defenderRockOwner = tables.OwnedBy.get(defenderRock)?.value;

  const winner = battle.winner;
  if (defenderRock && attackerRockOwner === playerEntity) {
    const defenderName = defenderIsFleet ? entityToFleetName(battle.defender) : entityToRockName(defenderRock);
    battle.attacker === winner
      ? scene.notify("success", `Victory! You attacked ${defenderName} and won! View details in the battle report.`)
      : scene.notify("error", `Defeat! You attacked ${defenderName} and lost! View details in the battle report.`);
  } else if (attackerRock && defenderRockOwner === playerEntity) {
    battle.defender === winner
      ? scene.notify(
          "success",
          `Victory! You defended against ${entityToFleetName(
            battle.attacker
          )} and won! View details in the battle report.`
        )
      : scene.notify(
          "error",
          `Defeat! You defended against ${entityToFleetName(
            battle.attacker
          )} and lost! View details in the battle report .`
        );
  }
}

export const setupBattleNotifications = async (scene: PrimodiumScene, core: Core) => {
  const {
    network: { world },
    tables,
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.BattleResult.watch({
    world: systemsWorld,
    onChange: ({ entity }) => {
      const battle = tables.Battle.get(entity);

      if (tables.SelectedMode.get()?.value === Mode.CommandCenter && tables.SelectedRock.get()?.value === battle?.rock)
        return;

      battleNotification(scene, core, entity);
    },
  });
};
