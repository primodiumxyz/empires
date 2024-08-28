import { ReactNode, useEffect, useState } from "react";

const EVENT_TIMEOUT = 5000;

export const useBanner = () => {
  /* ------------------------------ Banner logic ------------------------------ */
  const [content, setContent] = useState<string | ReactNode | null>(null);
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showEvent = (content: string, iconUri: string) => {
    if (timeoutId) clearTimeout(timeoutId);

    setContent(content);
    setIconUri(iconUri);

    setTimeoutId(
      setTimeout(() => {
        setContent(null);
        setIconUri(null);
      }, EVENT_TIMEOUT),
    );
  };

  /* -------------------------------- Watchers -------------------------------- */
  useEffect(() => {}, []);

  return { content, iconUri, showEvent };
};
