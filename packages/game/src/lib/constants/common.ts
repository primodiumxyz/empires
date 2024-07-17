export const ASSET_PACK = '/assets/pack.json';
export const KEY = 'MAIN';

export const Scenes = {
  UI: 'UI',
} as const;

export type SceneKeys = (typeof Scenes)[keyof typeof Scenes];
