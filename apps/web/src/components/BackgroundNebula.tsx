import { memo } from "react";

export const BackgroundNebula = memo(() => {
  return (
    <div className="screen-container absolute scale-[175%]">
      <img
        src="/img/backgrounds/nebula.png"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35"
      />
    </div>
  );
});
