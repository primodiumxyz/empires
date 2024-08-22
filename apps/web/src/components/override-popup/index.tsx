import ReactDOM from "react-dom";

import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { HUD } from "@/components/core/HUD";
import { OverridePane } from "@/components/override-popup/OverridePane";
import { PlanetSummary } from "@/components/override-popup/PlanetSummary";
import { Portfolio } from "@/components/Portfolio";
import { cn } from "@/util/client";

export const OverridePopup = () => {
  const { tables } = useCore();
  const selectedPlanet = tables.SelectedPlanet.use()?.value;
  const { playerAccount } = usePlayerAccount();

  if (!selectedPlanet) return null;

  return ReactDOM.createPortal(
    <div className="fixed left-0 top-0 z-50 h-screen w-screen bg-slate-900/25 backdrop-blur-md">
      <HUD.TopRight className="z-[1000] flex flex-col gap-1 p-1 lg:!p-3">
        <Account className="gap-0" />
        <div className={cn("flex flex-col gap-1 transition-opacity duration-300")}>
          {playerAccount && (
            <>
              <hr className="my-1 w-full border-secondary/50" />
              <Portfolio entity={playerAccount.entity} />
            </>
          )}
        </div>
      </HUD.TopRight>
      <div className="screen-container pointer-events-auto absolute" onClick={() => tables.SelectedPlanet.remove()} />
      <div className="screen-container flex items-center justify-center gap-2 py-5">
        <div className="mr-1/3 flex h-[30rem] max-h-full items-start justify-center gap-2">
          <PlanetSummary entity={selectedPlanet} className="hidden lg:flex" />
          <OverridePane entity={selectedPlanet} className="" />
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!,
  );
};
