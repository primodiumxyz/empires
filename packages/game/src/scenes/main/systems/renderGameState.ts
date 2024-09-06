import { Core, EViewMode } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";

export const renderGameState = (scene: PrimodiumScene, core: Core, game: GlobalApi) => {
  game.tables.GameState.watch({
    onChange: ({ properties: { current } }) => {
      if (!current) return;

      core.tables.Planet.getAll().forEach((entity) => {
        const planet = scene.objects.planet.get(entity);
        if (!planet) return;

        planet.setPlayAnims(current.visible);
      });
    },
  });

  core.tables.ViewMode.watch({
    onChange: ({ entity, properties: { current } }) => {
      // TODO: fix this in reactive tables, this is the type of the property that is stored as well
      // because it's a persisted table, but it should not trigger listeners
      // padHex(toHex(`__type`))
      if (entity === ("0x00000000000000000000000000000000000000000000000000005f5f74797065" as `0x${string}`)) return;
      if (!current) return;
      game.tables.GameState.update({ onMap: current.value === EViewMode.Map });
    },
  });
};
