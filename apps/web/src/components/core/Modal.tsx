import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import ReactDOM from "react-dom";

import { KeybindActionKeys } from "@primodiumxyz/game";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";

// TODO: default overlow-y behavior on modal
interface ModalContextType {
  isOpen: boolean;
  title?: string;
  handleClose: () => void;
  blockClose: boolean;
  handleOpen: () => void;
}

const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  title: undefined,
  handleClose: () => null,
  handleOpen: () => null,
  blockClose: false,
});

interface ModalProps {
  children: ReactNode;
  title?: string;
  keybind?: KeybindActionKeys;
  keybindClose?: boolean;
  startOpen?: boolean;
  onClose?: () => void;
  blockClose?: boolean;
}

export const Modal: React.FC<ModalProps> & {
  Button: React.FC<React.ComponentProps<typeof Button>>;
  CloseButton: React.FC<React.ComponentProps<typeof Button>>;
  Content: React.FC<{ children: ReactNode; className?: string }>;
} = ({ children, title, keybind, keybindClose, startOpen = false, onClose, blockClose = false }) => {
  const [isOpen, setIsOpen] = useState(startOpen);
  const game = useGame();
  const {
    audio,
    input: { addListener },
  } = useRef(game.UI).current;

  const handleClose = useCallback(() => {
    if (blockClose || !isOpen) return;
    audio.play("Sequence2", "ui");
    onClose?.();
    setIsOpen(false);
  }, [isOpen, audio, onClose]);

  useEffect(() => {
    const handleOpenPress = () => {
      if (!isOpen) setIsOpen(true);
      if (isOpen && keybindClose) setIsOpen(false);
    };

    if (isOpen) {
      game.GLOBAL.disableGlobalInput();
    } else {
      game.GLOBAL.enableGlobalInput();
    }

    const openListener = keybind ? addListener(keybind, handleOpenPress) : null;
    // use a dom listener to keep esc in any case
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    addEventListener("keydown", closeOnEsc);

    return () => {
      openListener?.dispose();
      removeEventListener("keydown", closeOnEsc);

      game.GLOBAL.enableGlobalInput();
    };
  }, [isOpen, audio, keybind, keybindClose, addListener, game, handleClose]);

  return (
    <ModalContext.Provider
      value={{
        isOpen,
        handleClose,
        title,
        handleOpen: () => setIsOpen(true),
        blockClose,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

Modal.Button = function ModalButton(props: React.ComponentProps<typeof Button>) {
  const { handleOpen } = useContext(ModalContext);

  return (
    <Button
      {...props}
      clickSound={props.clickSound ?? "Sequence"}
      onClick={(e) => {
        handleOpen();
        props.onClick?.(e);
      }}
    />
  );
};

Modal.CloseButton = function ModalButton(props: React.ComponentProps<typeof Button>) {
  const { handleClose } = useContext(ModalContext);

  return (
    <Button
      {...props}
      clickSound={props.clickSound ?? "Sequence"}
      onClick={(e) => {
        if (props.onClick) props.onClick(e);
        handleClose();
      }}
    />
  );
};

Modal.Content = function ModalContent({ children, className }) {
  const { isOpen, title, blockClose, handleClose } = useContext(ModalContext);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      handleClose();
    }
  };

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div
      className="absolute top-0 flex h-screen w-screen items-center justify-center bg-secondary/10 backdrop-blur-md ease-in-out animate-in fade-in"
      onClick={handleClickOutside}
    >
      <div
        className={cn("max-h-screen w-screen max-w-screen-xl space-y-2 p-5 pt-12 md:w-[90%]", className)}
        ref={modalRef}
      >
        <Card className="pointer-events-auto h-full w-full shadow-2xl" noMotion>
          <div className="absolute top-0 flex w-full -translate-y-full items-center justify-between p-2">
            <p className="pr-2 font-bold uppercase text-accent">{title}</p>
            {!blockClose && (
              <Button onClick={handleClose} className="ghost btn-sm">
                <XMarkIcon className="size-4" />
              </Button>
            )}
          </div>
          {children}
        </Card>
      </div>
    </div>,
    document.getElementById("modal-root")!,
  );
};
