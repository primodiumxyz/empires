import { useEffect } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { useBanner } from "@/hooks/useBanner";
import { cn } from "@/util/client";

export const Banner = () => {
  const { content, iconUri } = useBanner();

  return (
    <div
      className={cn(
        "flex w-full items-center gap-4 rounded-badge bg-info px-4 py-2 transition-opacity duration-300",
        content && iconUri ? "opacity-100" : "opacity-0",
      )}
    >
      {!!iconUri && (
        <img src={iconUri} alt="Banner icon" className="pixel-images m-1 w-[1.25em] scale-150" draggable="false" />
      )}
      {content}
    </div>
  );
};
