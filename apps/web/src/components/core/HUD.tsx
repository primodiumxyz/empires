import { createContext, CSSProperties, FC, memo, ReactNode, useContext, useEffect, useRef } from "react";

import { cn } from "@/util/client";

interface HUDProps {
  children?: ReactNode;
  scale?: number;
  pad?: boolean;
}

interface HUDElementProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const ScaleContext = createContext<number | undefined>(undefined);

const useScale = () => {
  const scale = useContext(ScaleContext);
  if (scale === undefined) {
    throw new Error("useScale must be used within a ScaleProvider");
  }
  return scale;
};

const CursorFollower: FC<HUDElementProps> = ({ children, className }) => {
  const scale = useScale();
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (divRef.current) {
        divRef.current.style.left = `${event.clientX}px`;
        divRef.current.style.top = `${event.clientY}px`;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={divRef}
      style={{
        zIndex: 1001,
        scale,
      }}
      className={`fixed z-[1001] ${className}`}
    >
      {children}
    </div>
  );
};

const TopRight: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "top right", ...style }}
      className={`absolute right-0 top-0 ${className}`}
    >
      {children}
    </div>
  );
});

const TopLeft: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "top left", ...style }}
      className={`absolute left-0 top-0 ${className}`}
    >
      {children}
    </div>
  );
});

const BottomRight: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "bottom right", ...style }}
      className={`absolute bottom-0 right-0 ${className}`}
    >
      {children}
    </div>
  );
});

const BottomLeft: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "bottom left", ...style }}
      className={`absolute bottom-0 left-0 ${className}`}
    >
      {children}
    </div>
  );
});

const TopMiddle: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "top center",
        ...style,
      }}
      className={`absolute left-1/2 top-0 ${className}`}
    >
      {children}
    </div>
  );
});

const BottomMiddle: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "bottom center",
        ...style,
      }}
      className={`absolute bottom-0 left-1/2 ${className}`}
    >
      {children}
    </div>
  );
});

const Left: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{
        transform: `translateY(50%) scale(${scale})`,
        transformOrigin: "left center",
        ...style,
      }}
      className={`absolute bottom-1/2 left-0 ${className}`}
    >
      {children}
    </div>
  );
});

const Right: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{
        transform: `translateY(50%) scale(${scale})`,
        transformOrigin: "right center",
        ...style,
      }}
      className={`absolute bottom-1/2 right-0 ${className}`}
    >
      {children}
    </div>
  );
});
const Center: FC<HUDElementProps> = memo(({ children, className, style }) => {
  const scale = useScale();
  return (
    <div
      style={{
        transform: `translateY(50%) translateX(50%) scale(${scale})`,
        transformOrigin: "center center",
        ...style,
      }}
      className={`absolute bottom-1/2 right-1/2 ${className}`}
    >
      {children}
    </div>
  );
});
export const HUD: FC<HUDProps> & {
  CursorFollower: typeof CursorFollower;
  TopRight: typeof TopRight;
  TopLeft: typeof TopLeft;
  BottomRight: typeof BottomRight;
  BottomLeft: typeof BottomLeft;
  TopMiddle: typeof TopMiddle;
  BottomMiddle: typeof BottomMiddle;
  Left: typeof Left;
  Right: typeof Right;
  Center: typeof Center;
} = ({ children, scale = 1, pad = false }) => {
  const paddingClass = pad ? "p-1 lg:!p-3" : "";
  return (
    <ScaleContext.Provider value={scale}>
      <div className={cn("screen-container pointer-events-none fixed right-0 top-0", paddingClass)}>
        <div className="pointer-events-none relative h-full">{children}</div>
      </div>
    </ScaleContext.Provider>
  );
};

HUD.CursorFollower = CursorFollower;
HUD.TopRight = TopRight;
HUD.TopLeft = TopLeft;
HUD.BottomRight = BottomRight;
HUD.BottomLeft = BottomLeft;
HUD.TopMiddle = TopMiddle;
HUD.BottomMiddle = BottomMiddle;
HUD.Left = Left;
HUD.Right = Right;
HUD.Center = Center;
