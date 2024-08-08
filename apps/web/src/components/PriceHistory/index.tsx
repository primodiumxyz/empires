import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { HistoricalPointPriceModal } from "@/components/PriceHistory/HistoricalPointPriceModal";
import { SmallHistoricalPointGraph } from "@/components/PriceHistory/SmallHistoricalPointGraph";
import { Price } from "@/components/shared/Price";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

const WINDOW_SIZE = 10;

export const PriceHistory = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col justify-center gap-1 text-center">
        <EmpireDetails empire={EEmpire.Red} />
        <EmpireDetails empire={EEmpire.Green} />
        <EmpireDetails empire={EEmpire.Blue} />
      </div>

      <hr className="mt-2 w-full border-secondary/50" />
      <HistoricalPointPriceModal />
    </div>
  );
};

const EmpireDetails = ({ empire }: { empire: EEmpire }) => {
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
        <SmallHistoricalPointGraph width={75} height={25} empire={empire} windowSize={WINDOW_SIZE} />
      </div>
    </div>
  );
};
