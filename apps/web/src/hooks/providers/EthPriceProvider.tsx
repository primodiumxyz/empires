import React, { createContext, ReactNode, useEffect, useState } from "react";

export interface EthPriceContextType {
  price: number | null;
  loading: boolean;
}

export const EthPriceContext = createContext<EthPriceContextType | undefined>(undefined);

interface EthPriceProviderProps {
  children: ReactNode;
}

export const EthPriceProvider: React.FC<EthPriceProviderProps> = ({ children }) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = (await response.json()) as { USD: number };

        setPrice(data.USD);
        setLoading(false);
      } catch (error) {
        console.log({ error });
        setLoading(false);
      }
    };

    fetchPrice();
  }, []);

  return <EthPriceContext.Provider value={{ price, loading }}>{children}</EthPriceContext.Provider>;
};
