import { initGame } from "@game/api";
import { createSceneApi } from "@game/api/scene";

export type SceneApi = ReturnType<typeof createSceneApi>;
export type PrimodiumScene = SceneApi & { runSystems?: () => void };
export type PrimodiumGame = Awaited<ReturnType<typeof initGame>>;
