import { PrimodiumScene } from "@game/types";
import { Core } from "@primodiumxyz/core";
import { namespaceWorld, Entity } from "@primodiumxyz/reactive-tables";

export function setupMoveNotifications(scene: PrimodiumScene, core: Core) {
  const {
    tables,
    network: { world },
  } = core;
  const systemWorld = namespaceWorld(world, "systems");
  const fleetTransitQueue = new Map<Entity, bigint>();

  tables.FleetMovement.watch({
    world: systemWorld,
    onChange: ({ entity, properties: { current } }) => {
      const ownerRock = tables.OwnedBy.get(entity)?.value as Entity | undefined;
      const ownerRockOwner = tables.OwnedBy.get(ownerRock)?.value;
      const player = tables.Account.get()?.value;
      const now = tables.Time.get()?.value ?? 0n;

      const arrival = current;
      if (!arrival || now == 0n) return;

      if (!ownerRockOwner || ownerRockOwner !== player) return;

      //it has arrived
      if (arrival.sendTime + 30n < now) {
        return;
      }
      const minutes = (arrival.arrivalTime - now) / 60n;
      const seconds = (arrival.arrivalTime - now) % 60n;
      const output = minutes > 0 ? `${minutes} minute(s)` : `${seconds} seconds`;

      if (arrival.arrivalTime > now) {
        scene.notify("info", `Your fleet is en route and will arrive in ${output}.`);
      }

      fleetTransitQueue.set(entity, arrival.arrivalTime);
    },
  });

  tables.Time.watch({
    world: systemWorld,
    onChange: ({ properties: { current } }) => {
      const now = current?.value ?? 0n;

      fleetTransitQueue.forEach((arrivalTime, entityId) => {
        const arrival = tables.FleetMovement.get(entityId);

        if (!arrival || now == 0n) return;

        const destination = tables.Position.get(arrival.destination as Entity);
        if (now > arrivalTime) {
          scene.notify("info", `Your fleet has arrived at [${destination?.x ?? 0}, ${destination?.y ?? 0}].`);

          fleetTransitQueue.delete(entityId);
        }
      });
    },
  });
}
