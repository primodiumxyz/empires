import { useEffect, useMemo, useRef, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { ToastContainer } from "react-toastify";
import { defineChain } from "viem";

import "react-toastify/dist/ReactToastify.min.css";

import { Core as CoreType, createCore } from "@primodiumxyz/core";
import { CoreProvider } from "@primodiumxyz/core/react";
import { BackgroundNebula } from "@/components/BackgroundNebula";
import { getCoreConfig } from "@/config/getCoreConfig";
import { BurnerAccountProvider } from "@/hooks/providers/BurnerAccountProvider";
import { EthPriceProvider } from "@/hooks/providers/EthPriceProvider";
import { useSettings } from "@/hooks/useSettings";
import Landing from "@/screens/Landing";
import { cn } from "@/util/client";

const App = () => {
  const settings = useSettings();
  const fontStyle = useMemo(() => {
    const { family, size } = settings.fontStyle;
    const fontFamily = {
      pixel: "font-pixel",
      mono: "font-mono",
    }[family];

    const fontSize = {
      sm: "text-sm",
      md: "text-md",
    }[size];

    return cn(fontFamily, fontSize);
  }, [settings.fontStyle]);
  const coreRef = useRef<CoreType | null>(null);
  const [core, setCore] = useState<CoreType | null>(null);

  useEffect(() => {
    if (coreRef.current) coreRef.current.network.world.dispose();
    const config = getCoreConfig();
    coreRef.current = createCore(config);

    setCore(coreRef.current);
  }, []);

  if (!core) {
    return <></>;
  }

  return (
    <>
      <PrivyProvider
        appId="clxvzvzrw063qh5c30om9h9x5"
        config={{
          // Customize Privy's appearance in your app
          appearance: {
            theme: "dark",
            accentColor: "#ef4444",
            logo: "vite.svg",
          },
          // Create embedded wallets for users who don't have a wallet
          loginMethods: ["wallet", "google", "twitter", "discord"],
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
          supportedChains: [defineChain(core.config.chain)],
        }}
      >
        <BurnerAccountProvider>
          <EthPriceProvider>
            <CoreProvider {...core}>
              <div
                className={cn(
                  "star-background flex h-screen w-screen cursor-default items-center justify-center",
                  fontStyle,
                )}
              >
                <BackgroundNebula />
                <Landing />
                <ToastContainer
                  toastClassName={cn("text-xs border text-base-100 bg-neutral border-neutral rounded-box", fontStyle)}
                  progressClassName="bg-primary"
                  position="top-center"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
              </div>
            </CoreProvider>
          </EthPriceProvider>
        </BurnerAccountProvider>
      </PrivyProvider>
      <div id="modal-root" className={cn("pointer-events-auto fixed top-0 z-50 cursor-default", fontStyle)} />
    </>
  );
};

export default App;
