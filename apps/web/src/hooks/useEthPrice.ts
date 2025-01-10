import { useContext } from "react";

import { EthPriceContext, EthPriceContextType } from "@/hooks/providers/EthPriceProvider";

export const useEthPrice = (): EthPriceContextType => {
  const context = useContext(EthPriceContext);
  if (!context) {
    throw new Error("useEthPrice must be used within an EthPriceProvider");
  }
  return context;
};
