// import { Core, getRandomRange } from "@primodiumxyz/core";
// import { namespaceWorld } from "@primodiumxyz/reactive-tables";

// import { PrimodiumScene } from "@game/types";

// export const setupAudioEffects = (scene: PrimodiumScene, core: Core) => {
//   const {
//     tables,
//     network: { world },
//   } = core;
//   const systemsWorld = namespaceWorld(world, "systems");

//   tables.woverEntity.watch({
//     world: systemsWorld,
//     onChange: ({ properties: { current } }) => {
//       const entity = current?.value;
//       if (!entity) return;

//       scene.audio.play("DataPoint2", "ui", {
//         volume: 0.1,
//         detune: getRandomRange(-200, 200),
//       });
//     },
//   });
// };
