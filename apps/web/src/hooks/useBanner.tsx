import { ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { useWorldEvents, WorldEvent } from "@/hooks/useWorldEvents";

// Display time when there is only one event in the queue
const DISPLAY_DURATION = 5000;
// Display time when there are multiple events in the queue
const QUEUE_DISPLAY_DURATION = 2000;

interface BannerEvent {
  content: string | ReactNode;
  iconUri: string;
}

export const useBanner = () => {
  const { onEvent } = useWorldEvents();
  const { queueEvent, processQueue } = useMemo(createQueueManager, []);

  const [show, setShow] = useState(false);
  const [content, setContent] = useState<string | ReactNode>("");
  const [iconUri, setIconUri] = useState<string | null>(null);

  const getIcon = (type: WorldEvent["type"]) => {
    switch (type) {
      // TODO: whale icon, or something to convey a large transaction
      case "whale":
        return InterfaceIcons.Objective;
      case "acidRain":
        return InterfaceIcons.AcidRain;
      case "shieldEater":
        return InterfaceIcons.ShieldEater;
      case "citadel":
        return InterfaceIcons.Crown;
      case "planet":
        return InterfaceIcons.Planet;
      // TODO: opportunity icon (star, idea of making good return)
      case "opportunity":
        return InterfaceIcons.Dashboard;
      default:
        return "";
    }
  };

  useEffect(() => {
    onEvent((e) => {
      /* ------------------------------------ - ----------------------------------- */
      // TODO: TEMP switch to test out banner/toast
      // * 1. Banner:
      queueEvent({ content: e.content, iconUri: getIcon(e.type) });
      processQueue(setShow, setContent, setIconUri);
      // * 2. Toast:
      // toast.info(e.content, {
      //   icon: () => (
      //     <img
      //       src={getIcon(e.type)}
      //       alt="Banner icon"
      //       className="pixel-images m-1 w-[1.25em] scale-150"
      //       draggable="false"
      //     />
      //   ),
      // });
      /* ------------------------------------ - ----------------------------------- */
    });
  }, [onEvent, queueEvent, processQueue]);

  return { content, iconUri, show };
};

function createQueueManager() {
  const queue: BannerEvent[] = [];
  let processing = false;

  const showEvent = (
    setShow: (show: boolean) => void,
    setContent: (content: string | ReactNode) => void,
    setIconUri: (iconUri: string | null) => void,
  ) => {
    return new Promise<void>((resolve) => {
      const event = queue[0];
      setShow(true);
      setContent(event.content);
      setIconUri(event.iconUri);

      setTimeout(
        () => {
          setShow(false);
          queue.shift();
          resolve();
        },
        queue.length > 1 ? QUEUE_DISPLAY_DURATION : DISPLAY_DURATION,
      );
    });
  };

  const processQueue = async (
    setShow: (show: boolean) => void,
    setContent: (content: string | ReactNode) => void,
    setIconUri: (iconUri: string | null) => void,
  ) => {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
      await showEvent(setShow, setContent, setIconUri);
    }

    processing = false;
  };

  function queueEvent(event: BannerEvent) {
    queue.push(event);
  }

  return { queueEvent, processQueue };
}
