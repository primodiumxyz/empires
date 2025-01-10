import { Core } from "@core/lib/types";
import React, { createContext, ReactNode } from "react";

export const CoreContext = createContext<Core | null>(null);

type Props = Core & {
  children: ReactNode;
};

/**
 * Provides the core context to its children components.
 *
 * @component
 * @param {Props} props - The component props.
 * @param {React.ReactNode} props.children - The children components.
 * @param {object} props.value - The value to be provided by the context.
 * @returns {JSX.Element} The rendered component.
 */
export const CoreProvider = ({ children, ...value }: Props): JSX.Element => {
  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
};
