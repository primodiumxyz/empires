import { createLocalTable, Entity, Table, Type } from "@primodiumxyz/reactive-tables";
import { CreateNetworkResult } from "@core/lib/types";
import { Notification, NotificationType } from "@core/tables/types";

type NotificationQueueTable = Table<{
  ids: Type.StringArray;
  entities: Type.EntityArray;
  timestamp: Type.NumberArray;
  type: Type.StringArray;
}> & {
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
};

export const createNotificationQueueTable = ({ world }: CreateNetworkResult): NotificationQueueTable => {
  const table = createLocalTable(
    world,
    {
      ids: Type.StringArray,
      entities: Type.EntityArray,
      timestamp: Type.NumberArray,
      type: Type.StringArray,
    },
    {
      id: "NotificationQueue",
    },
  );

  const addNotification = (notification: Notification) => {
    const currentData = table.get() || {
      ids: new Array<string>(),
      entities: new Array<Entity>(),
      timestamp: new Array<number>(),
      type: new Array<NotificationType>(),
    };
    currentData.ids.push(notification.id);
    currentData.entities.push(notification.entity);
    currentData.timestamp.push(notification.timestamp);
    currentData.type.push(notification.type);
    table.set(currentData);
  };

  const removeNotification = (id: string) => {
    const currentData = table.get() || {
      ids: [],
      entities: [],
      timestamp: [],
      type: [],
    };
    const index = currentData.ids.indexOf(id);
    if (index !== -1) {
      currentData.ids.splice(index, 1);
      currentData.entities.splice(index, 1);
      currentData.timestamp.splice(index, 1);
      currentData.type.splice(index, 1);
    }
    table.set(currentData);
  };

  return {
    ...table,
    addNotification,
    removeNotification,
  };
};
