import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { useGame } from "@/hooks/useGame";
import { useCore } from "@primodiumxyz/core/react";
import { KeybindActionKeys } from "@primodiumxyz/game";
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { FaTimes } from "react-icons/fa";

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
  const { tables } = useCore();
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
      tables.HoverEntity.remove(); // remove any hovered entity (probably displaying a tooltip)
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
      className="absolute top-0 w-screen h-screen bg-secondary/10 backdrop-blur-md flex items-center justify-center animate-in fade-in ease-in-out"
      onClick={handleClickOutside}
    >
      <div className={`max-w-screen max-h-screen space-y-2 ${className} p-5 pt-12`} ref={modalRef}>
        <Card className="w-full h-full shadow-2xl pointer-events-auto" noMotion>
          <div className="absolute top-0 -translate-y-full w-full flex justify-between items-center p-2">
            <p className="font-bold uppercase pr-2 text-accent">{title}</p>
            {!blockClose && (
              <Button onClick={handleClose} className="btn-sm ghost">
                <FaTimes />
              </Button>
            )}
          </div>
          {children}
        </Card>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};
