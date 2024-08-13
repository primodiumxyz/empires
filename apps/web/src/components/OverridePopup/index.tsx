import ReactDOM from "react-dom";

import { useCore } from "@primodiumxyz/core/react";
import { OverridePane } from "@/components/OverridePopup/OverridePane";
import { PlanetSummary } from "@/components/OverridePopup/PlanetSummary";

export const OverridePopup = () => {
  const { tables } = useCore();
  const selectedPlanet = tables.SelectedPlanet.use()?.value;

  if (!selectedPlanet) return null;

  return ReactDOM.createPortal(
    <div className="fixed left-0 top-0 z-50 h-screen w-screen bg-slate-900/25 backdrop-blur-md">
      <div className="screen-container pointer-events-auto absolute" onClick={() => tables.SelectedPlanet.remove()} />
      <div className="screen-container flex items-center justify-center gap-2 py-5">
        <div className="flex h-[30rem] max-h-full items-center justify-center gap-2">
          <PlanetSummary entity={selectedPlanet} className="hidden lg:flex" />
          <OverridePane entity={selectedPlanet} className="flex-row gap-5 lg:flex-col" />
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!,
  );
};
