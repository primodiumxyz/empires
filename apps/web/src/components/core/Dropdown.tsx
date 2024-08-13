import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { cva, VariantProps } from "class-variance-authority";

import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { cn } from "@/util/client";

const dropdownVariants = cva(
  "z-50 absolute mt-1 p-1 bg-neutral border border-secondary/25 w-44 pointer-events-auto data-[state=close]:pointer-events-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=close]:animate-out data-[state=close]:fade-out fill-mode-forwards",
  {
    variants: {
      size: {
        sm: "sm",
        md: "md",
        lg: "md",
      },
      variant: {
        bottomLeft: "origin-top-right right-0",
        topLeft: "origin-top-left left-0",
        topRight: "origin-top-right right-0",
        bottomRight: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "bottomLeft",
    },
  },
);
type DropdownValue = string | number | boolean | Entity;

interface DropdownProps<T extends DropdownValue> extends VariantProps<typeof dropdownVariants> {
  children?: React.ReactElement<DropdownItemProps<T>>[];
  className?: string;
  value: T;
  onChange?: (value: T) => void;
}
export const Dropdown = <T extends DropdownValue>({
  children,
  className,
  variant,
  size = "md",
  value,
  onChange,
}: DropdownProps<T>) => {
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (!menuRef.current) return;
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    if (menuRef.current) menuRef.current.dataset.state = "close";

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Adjust this value to match your animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!children) return null;

  const toggleMenu = () => {
    if (!menuRef.current) return;
    if (isOpen) {
      closeMenu();
    } else {
      menuRef.current.dataset.state = "open";
      setIsOpen(true);
    }
  };

  const closeMenu = () => {
    if (!menuRef.current) return;
    menuRef.current.dataset.state = "close";
    setIsOpen(false);
  };

  const selectedChild = children.find((child) => child.props.value === value);

  return (
    <div ref={ref} className={cn("pointer-events-auto relative w-fit", className)}>
      <Button
        variant="neutral"
        size={size}
        className="w-full border border-secondary/25 shadow-inner"
        role="button"
        onClick={toggleMenu}
      >
        <div className="pointer-events-none flex flex-row items-center justify-center gap-2">
          {selectedChild} <ChevronDownIcon className="size-4 opacity-50" />
        </div>
      </Button>
      <SecondaryCard
        ref={menuRef}
        data-state={isOpen ? "open" : "close"}
        className={cn(dropdownVariants({ variant }), isVisible ? "visible" : "invisible")}
      >
        {children.map((child, i) => (
          <Button
            key={i}
            variant="ghost"
            shape="block"
            onClick={() => {
              closeMenu();
              const value = child.props.value as T;
              onChange && onChange(value);
            }}
          >
            {child}
          </Button>
        ))}
      </SecondaryCard>
    </div>
  );
};

interface DropdownItemProps<T extends DropdownValue> {
  value: T;
  children: ReactNode;
  className?: string;
}

const DropdownItem = <T extends DropdownValue>({ children, value, className = "" }: DropdownItemProps<T>) => (
  <div className={`${className}`} data-value={value}>
    {children}
  </div>
);

Dropdown.Item = DropdownItem;
