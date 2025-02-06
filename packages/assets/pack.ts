//sprite atlas and texture
import { PackConfig } from "@primodiumxyz/engine";

import audioAc3 from "./atlas/audio/atlas.ac3?url";
//audio atlas
import audioAtlas from "./atlas/audio/atlas.json?url";
import audioM4a from "./atlas/audio/atlas.m4a?url";
//audio sprites
import audioMp3 from "./atlas/audio/atlas.mp3?url";
import audioOgg from "./atlas/audio/atlas.ogg?url";
import spriteAtlas from "./atlas/sprites/atlas.json?url";
import spriteAtlasTexture from "./atlas/sprites/atlas.png?url";
//sprite atlas and texture
import vfxAtlas from "./atlas/vfx/atlas.json?url";
import vfxAtlasTexture from "./atlas/vfx/atlas.png?url";

export const pack: PackConfig = {
  audioSprite: [
    {
      key: "audio-atlas",
      urls: [audioMp3, audioOgg, audioM4a, audioAc3],
      jsonURL: audioAtlas,
    },
  ],
  atlas: [
    {
      key: "sprite-atlas",
      textureURL: spriteAtlasTexture,
      atlasURL: spriteAtlas,
    },
    {
      key: "vfx-atlas",
      textureURL: vfxAtlasTexture,
      atlasURL: vfxAtlas,
    },
  ],
};
