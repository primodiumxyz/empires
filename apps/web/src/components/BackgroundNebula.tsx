import { memo } from "react";

export const BackgroundNebula = memo(() => {
  return (
    <div className="screen-container absolute overflow-hidden">
      <img
        src="/img/backgrounds/nebula.png"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[175%] opacity-35"
      />
    </div>
  );
});
