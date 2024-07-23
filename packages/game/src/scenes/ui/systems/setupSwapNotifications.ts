import { PrimodiumScene } from "@game/types";
import { Core, formatResourceCount, getEntityTypeName, ResourceEntityLookup } from "@primodiumxyz/core";
import { namespaceWorld } from "@primodiumxyz/reactive-tables";
import { EResource } from "contracts/config/enums";

export function setupSwapNotifications(scene: PrimodiumScene, core: Core) {
  const {
    tables,
    network: { world },
  } = core;
  const systemWorld = namespaceWorld(world, "clientSystems");

  tables.Swap.watch(
    {
      world: systemWorld,
      onChange: ({ entity: swapper, properties: { current } }) => {
        const player = tables.Account.get()?.value;

        const swap = current;
        if (!swap || swapper !== player) return;

        const inResource = ResourceEntityLookup[swap.resourceIn as EResource];
        const outResource = ResourceEntityLookup[swap.resourceOut as EResource];
        const formattedIn = formatResourceCount(inResource, swap.amountIn, { fractionDigits: 2 });
        const formattedOut = formatResourceCount(outResource, swap.amountOut, { fractionDigits: 2 });

        scene.notify(
          "success",
          `Swap success! ${formattedIn} ${getEntityTypeName(
            inResource
          )} swapped for ${formattedOut} ${getEntityTypeName(outResource)}.`
        );
      },
    },
    { runOnInit: false }
  );
}
