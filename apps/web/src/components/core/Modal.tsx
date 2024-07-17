import { Dispatch, FC, forwardRef, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { XCircleIcon } from "@heroicons/react/24/solid";

import { cn } from "@/util/client";

import "@/index.css";

/* ---------------------------------- MODAL --------------------------------- */

export const Modal: FC<{ children: ReactNode; icon: ReactNode; buttonClassName?: string; className?: string }> = ({
  children,
  icon,
  buttonClassName,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeModal = (e: MouseEvent) => {
      if (!open || !modalRef.current || !buttonRef.current) return;
      if (!modalRef.current.contains(e.target as Node) && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", closeModal);
    return () => document.removeEventListener("click", closeModal);
  }, [open]);

  return (
    <>
      {/* open button */}
      <ModalOpenButton
        ref={buttonRef}
        icon={icon}
        setOpen={setOpen}
        className={cn(buttonClassName, open ? "hidden" : "")}
      />
      {/* overlay */}
      <div
        className={cn(
          "absolute h-[95%] w-[95%] rounded-btn bg-gray-950 bg-opacity-90 md:h-[90%] md:w-[90%]",
          !open && "hidden",
        )}
      />
      {/* modal */}
      <div
        ref={modalRef}
        className={cn(
          "absolute flex h-[95%] w-[95%] flex-col gap-2 py-4 pl-4 pr-2 md:h-[90%] md:w-[90%]",
          !open && "hidden",
          className,
        )}
      >
        {/* close button */}
        <ModalCloseButton setOpen={setOpen} />
        {/* content */}
        {children}
      </div>
    </>
  );
};

/* --------------------------------- BUTTONS -------------------------------- */

type ModalButtonProps = {
  icon: ReactNode;
  setOpen: Dispatch<SetStateAction<boolean>>;
  className?: string;
};

const ModalOpenButton = forwardRef<HTMLButtonElement, ModalButtonProps>(({ icon, setOpen, className }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "absolute bottom-10 right-2 flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-btn bg-white opacity-70 transition-opacity hover:opacity-100",
        className,
      )}
      onClick={() => setOpen(true)}
    >
      {icon}
    </button>
  );
});

const ModalCloseButton = ({ setOpen, icon, className }: Omit<ModalButtonProps, "icon"> & { icon?: ReactNode }) => (
  <button
    className={cn("absolute right-2 top-2 rounded-btn bg-neutral p-2 transition-colors hover:bg-primary", className)}
    onClick={() => setOpen(false)}
  >
    {icon ?? <XCircleIcon className="h-6 w-6" />}
  </button>
);
