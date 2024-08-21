import { Dispatch, forwardRef, SetStateAction } from "react";

import { cn } from "@/util/client";

type CheatcodesButtonProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
  className?: string;
};

const CheatcodesButton = forwardRef<HTMLButtonElement, CheatcodesButtonProps>(({ setOpen, className }, ref) => {
  return (
    <button
      ref={ref}
      id="cheatcodes-button"
      className={cn(
        "absolute bottom-10 right-2 flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-btn bg-white opacity-70 transition-opacity hover:opacity-100",
        className,
      )}
      onClick={() => setOpen(true)}
    >
      {/* <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="#000000">
        <path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-64c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0z" />
      </svg>
    </button>
  );
});

export const CheatcodesCloseButton = ({ setOpen, className }: CheatcodesButtonProps) => (
  <button
    className={cn("absolute right-2 top-2 rounded-btn bg-neutral p-2 transition-colors hover:bg-primary", className)}
    onClick={() => setOpen(false)}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" className="fill-gray-300">
      <path d="m24 20.188-8.315-8.209 8.2-8.282L20.188 0l-8.212 8.318L3.666.115 0 3.781l8.321 8.24-8.206 8.313L3.781 24l8.237-8.318 8.285 8.203z" />
    </svg>
  </button>
);

export default CheatcodesButton;
