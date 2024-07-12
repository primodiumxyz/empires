import { Entity } from "@primodiumxyz/reactive-tables";

// populate with notifications
export type NotificationType = "";
export type Notification = {
  id: string;
  entity: Entity;
  timestamp: number;
  type: NotificationType;
};

export type TxQueueOptions = {
  id: string;
  force?: true;
  metadata?: object;
  type?: string;
  timeout?: number;
};
