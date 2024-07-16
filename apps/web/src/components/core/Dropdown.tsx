import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { cn } from "@/util/client";
import { Entity } from "@primodiumxyz/reactive-tables";
import { VariantProps, cva } from "class-variance-authority";
import { ReactNode, useEffect, useRef } from "react";
import { FaAngleDown } from "react-icons/fa";

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
        bottomRight: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "bottomLeft",
    },
  }
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (!menuRef.current) return;
        menuRef.current.dataset.state = "close";
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    if (menuRef.current) menuRef.current.dataset.state = "close";

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  if (!children) return null;

  const toggleMenu = () => {
    if (!menuRef.current) return;

    const currentState = menuRef.current.dataset.state;
    menuRef.current.dataset.state = currentState === "open" ? "close" : "open";
  };
  const selectedChild = children.find((child) => child.props.value === value);

  return (
    <div ref={ref} className={cn("pointer-events-auto relative w-fit", className)}>
      <Button
        variant="neutral"
        size={size}
        className="border border-secondary/25 shadow-inner"
        role="button"
        onClick={toggleMenu}
      >
        <div className="pointer-events-none flex flex-row gap-2 items-center justify-center">
          {selectedChild} <FaAngleDown className="opacity-50" />
        </div>
      </Button>
      <SecondaryCard ref={menuRef} className={cn(dropdownVariants({ variant }))}>
        {children.map((child, i) => (
          <Button
            key={i}
            variant="ghost"
            shape="block"
            onClick={() => {
              if (!menuRef.current) return;
              menuRef.current.dataset.state = "close";
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
