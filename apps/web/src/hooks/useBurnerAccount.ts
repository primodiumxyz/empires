import { BurnerAccountContext } from "@/hooks/providers/BurnerAccountProvider";
import { useContext } from "react";

export const useBurnerAccount = () => {
  const context = useContext(BurnerAccountContext);
  if (!context) {
    throw new Error("useBurnerAccount must be used within an BurnerAccountProvider");
  }

  return context;
};
