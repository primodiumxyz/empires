import { Entity } from "@primodiumxyz/reactive-tables";

export interface IPrimodiumGameObject {
  readonly id: Entity;
  spawn(): void;
  isSpawned(): boolean;
}
