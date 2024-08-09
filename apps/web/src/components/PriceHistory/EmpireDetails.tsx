import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { SmallHistoricalPointGraph } from "@/components/PriceHistory/SmallHistoricalPointGraph";
import { Price } from "@/components/shared/Price";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

// TODO: Change window size to use time instead of # of updates
const WINDOW_SIZE = 25;

const _EmpireDetails: React.FC<{ empire: EEmpire; hideGraph?: boolean }> = ({ empire, hideGraph = false }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const { price: sellPrice } = usePointPrice(empire, 1);
  const planetCount = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId: empire })?.itemKeys.length ?? 0;

  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");

  return (
    <div className="flex flex-col justify-center rounded-box text-center text-white">
      <div className="flex items-center justify-center gap-3">
        <img src={spriteUrl} className="h-12" />
        <div className={cn("flex flex-col items-start gap-1")}>
          <Price wei={sellPrice} />
          <p className="text-xs opacity-75">{planetCount} Planets</p>
        </div>
        {!hideGraph && <SmallHistoricalPointGraph width={75} height={25} empire={empire} windowSize={WINDOW_SIZE} />}
      </div>
    </div>
  );
};

export const EmpireDetails: React.FC<{ hideGraph?: boolean }> = ({ hideGraph }) => {
  return (
    <div className="flex flex-col items-start gap-1 text-center">
      <_EmpireDetails empire={EEmpire.Red} hideGraph={hideGraph} />
      <_EmpireDetails empire={EEmpire.Green} hideGraph={hideGraph} />
      <_EmpireDetails empire={EEmpire.Blue} hideGraph={hideGraph} />
    </div>
  );
};
