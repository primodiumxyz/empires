import Landing from "@/screens/Landing";
import { PrivyProvider } from "@privy-io/react-auth";
import { useMemo, useRef } from "react";

import { getCoreConfig } from "@/config/getCoreConfig";
import { Core as CoreType, createCore } from "@primodiumxyz/core";
import { CoreProvider } from "@primodiumxyz/core/react";
import { defineChain } from "viem";

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
      <CoreProvider {...core}>
        <div className="bg-neutral w-screen h-screen flex justify-center items-center">
          <Landing />
        </div>
      </CoreProvider>
    </PrivyProvider>
  );
};

export default App;
