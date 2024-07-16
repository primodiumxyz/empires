import { FC, ReactNode } from "react";

interface JoinProps {
  className?: string;
  direction?: "vertical" | "horizontal";
  children?: ReactNode;
}

export const Join: FC<JoinProps> = ({ className, direction = "horizontal", children }) => {
  return (
    <div
      className={`join ${className} w-fit p-1 backdrop-blur-md transition-all hover:bg-secondary/25 ${
        direction === "horizontal" ? "join-horizontal" : "join-vertical"
      }`}
    >
      {children}
    </div>
  );
};
