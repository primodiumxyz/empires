import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";

import { storage } from "@primodiumxyz/core";

type AccountProviderProps = { children: ReactNode };

type BurnerAccount = {
  usingBurner: boolean;
  value: Hex | undefined;
  createBurner: (privateKey?: Hex) => void;
  cancelBurner: () => void;
};

export const BurnerAccountContext = createContext<BurnerAccount | undefined>(undefined);

const localKey = "primodium_local_pkey";
const DEV = import.meta.env.PRI_DEV === "true";

export const BurnerAccountProvider = ({ children }: AccountProviderProps) => {
  const localPKey = (storage.getItem(localKey) ?? undefined) as Hex | undefined;
  const [value, setValue] = useState(localPKey);

  const [useBurnerAccount, setUseBurnerAccount] = useState(false);

  useEffect(() => {
    const burnerAccount = storage.getItem("burnerAccount");
    const localPKey = storage.getItem(localKey) as Hex;
    if (DEV && burnerAccount && localPKey) {
      setUseBurnerAccount(true);
      setValue(localPKey);
    }
  }, []);

  const createBurner = useCallback(
    (privateKey?: Hex) => {
      setUseBurnerAccount(true);
      const localPKey = privateKey ?? (storage.getItem(localKey) as Hex) ?? generatePrivateKey();
      storage.setItem("burnerAccount", "true");
      storage.setItem(localKey, localPKey);
      setValue(localPKey);
    },
    [storage, setValue],
  );

  const cancelBurner = useCallback(() => {
    setUseBurnerAccount(false);
    setValue(undefined);
    storage.removeItem("burnerAccount");
  }, [storage, setUseBurnerAccount]);

  return (
    <BurnerAccountContext.Provider value={{ usingBurner: useBurnerAccount, createBurner, cancelBurner, value }}>
      {children}
    </BurnerAccountContext.Provider>
  );
};
