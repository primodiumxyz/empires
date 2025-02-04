import React, { createContext, ReactNode } from "react";

import { Core } from "@core/lib/types";

export const CoreContext = createContext<Core | null>(null);

type Props = Core & {
  children: ReactNode;
};

/**
 * Provides the core context to its children components.
 *
 * @param {Props} props - The component props.
 * @param {React.ReactNode} props.children - The children components.
 * @param {object} props.value - The value to be provided by the context.
 * @returns {JSX.Element} The rendered component.
 * @component
 */
export const CoreProvider = ({ children, ...value }: Props): JSX.Element => {
  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
};
