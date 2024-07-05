import { useMemo, useRef } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { defineChain } from "viem";

import { Core as CoreType, createCore } from "@core";
import { CoreProvider } from "@core/react";
import { getCoreConfig } from "@/config/getCoreConfig";
import { BurnerAccountProvider } from "@/hooks/providers/BurnerAccountProvider";
import Landing from "@/screens/Landing";

const App = () => {
  const coreRef = useRef<CoreType | null>(null);
  const core = useMemo(() => {
    if (coreRef.current) coreRef.current.network.world.dispose();
    const config = getCoreConfig();
    const core = createCore(config);
    coreRef.current = core;
    return core;
  }, []);
  return (
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
        <CoreProvider {...core}>
          <div className="flex h-screen w-screen items-center justify-center bg-neutral">
            <Landing />
          </div>
        </CoreProvider>
      </BurnerAccountProvider>
    </PrivyProvider>
  );
};

export default App;
