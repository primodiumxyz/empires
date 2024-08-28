import { ReactNode, useEffect, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { useWorldEvents, WorldEvent } from "@primodiumxyz/core/react";

const EVENT_TIMEOUT = 5000;

export const useBanner = () => {
  const { onEvent } = useWorldEvents();

  const [show, setShow] = useState(false);
  const [content, setContent] = useState<string | ReactNode>("");
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showEvent = (content: string, iconUri: string) => {
    if (timeoutId) clearTimeout(timeoutId);

    setShow(true);
    setContent(content);
    setIconUri(iconUri);

    setTimeoutId(
      setTimeout(() => {
        setShow(false);
      }, EVENT_TIMEOUT),
    );
  };

  const getIcon = (type: WorldEvent["type"]) => {
    switch (type) {
      case "whale":
        // TODO: whale icon, or something to convey a large transaction
        return InterfaceIcons.Objective;
      case "acidRain":
        return InterfaceIcons.AcidRain;
      case "shieldEater":
        return InterfaceIcons.ShieldEater;
      case "citadel":
        return InterfaceIcons.Crown;
      case "planet":
        return InterfaceIcons.Planet;
      case "opportunity":
        // TODO: opportunity icon (star, idea of making good return)
        return InterfaceIcons.Dashboard;
      default:
        return "";
    }
  };

  useEffect(() => {
    onEvent((e) => showEvent(e.content, getIcon(e.type)));
  }, [onEvent, showEvent, getIcon]);

  return { content, iconUri, show };
};
