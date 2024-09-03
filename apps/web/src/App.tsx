import { useEffect, useMemo, useRef, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { ToastContainer } from "react-toastify";
import { defineChain } from "viem";

import "react-toastify/dist/ReactToastify.min.css";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { Core as CoreType, createCore } from "@primodiumxyz/core";
import { CoreProvider, PlayerAccountProvider } from "@primodiumxyz/core/react";
import { BackgroundNebula } from "@/components/BackgroundNebula";
import Game from "@/components/game";
import { getCoreConfig } from "@/config/getCoreConfig";
import { EthPriceProvider } from "@/hooks/providers/EthPriceProvider";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

import { ampli } from "./ampli/index";

const DEV = import.meta.env.PRI_DEV === "true";

const App = () => {
  const { FontStyle } = useSettings();
  const fontStyle = FontStyle.use();
  const fontFamily = useMemo(
    () =>
      ({
        pixel: "font-pixel",
        mono: "font-mono",
      })[fontStyle?.family ?? "pixel"],
    [fontStyle],
  );

  const fontSize = useMemo(
    () =>
      ({
        sm: "text-sm",
        md: "text-md",
      })[fontStyle?.size ?? "md"],
    [fontStyle],
  );

  // Amplitude Analytics
  useEffect(() => {
    if (DEV) {
      ampli.load({ client: { apiKey: import.meta.env.PRI_AMPLI_API_KEY_DEV } });
    } else {
      ampli.load({ client: { apiKey: import.meta.env.PRI_AMPLI_API_KEY_PROD } });
    }
  }, []);

  const coreRef = useRef<CoreType | null>(null);
  const [core, setCore] = useState<CoreType | null>(null);

  useEffect(() => {
    if (coreRef.current) coreRef.current.network.world.dispose();
    const config = getCoreConfig();
    coreRef.current = createCore(config);

    setCore(coreRef.current);
  }, []);

  if (!core) {
    return <>Loading...</>;
  }

  const usingFoundry = core.config.chain.name === "Foundry";

  return (
    <>
      <PrivyProvider
        appId="clxvzvzrw063qh5c30om9h9x5"
        config={{
          // Customize Privy's appearance in your app
          appearance: {
            theme: "dark",
            accentColor: "#22d3ee",
            logo: InterfaceIcons.ShieldEater,
            landingHeader: "Primodium Empires",
            loginMessage: "It's free to login!",
          },

          // Create embedded wallets for users who don't have a wallet
          loginMethods: ["twitter"],
          supportedChains: [defineChain(core.config.chain)],
        }}
      >
        <EthPriceProvider>
          <CoreProvider {...core}>
            <div
              className={cn(
                "star-background flex h-screen w-screen cursor-default items-center justify-center",
                fontFamily,
                fontSize,
              )}
            >
              <BackgroundNebula />

              <PlayerAccountProvider allowBurner={!!DEV} defaultLogin={usingFoundry ? "burner" : "privy"}>
                <Game />
                <ToastContainer
                  toastClassName={cn(
                    fontFamily,
                    fontSize,
                    "text-xs border text-base-100 bg-neutral border-neutral rounded-box",
                  )}
                  progressClassName="bg-primary"
                  position="bottom-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
              </PlayerAccountProvider>
            </div>
          </CoreProvider>
        </EthPriceProvider>
      </PrivyProvider>
      <div id="modal-root" className={cn("pointer-events-auto fixed top-0 z-50 cursor-default", fontStyle)} />
    </>
  );
};

export default App;
