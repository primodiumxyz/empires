import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Progress } from "@/components/core/Progress";
import { useCharge } from "@/hooks/useCharge";
import { useContractCalls } from "@/hooks/useContractCalls";
import { notify } from "@/util/notify";

export const PlanetCharge = ({ planetId }: { planetId: Entity }) => {
  const { charge, maxCharge, percent } = useCharge(planetId);
  const { tables } = useCore();
  const calls = useContractCalls();

  const handleStrike = () => {
    notify("info", "Tactical Strike initiated");
    calls.tacticalStrike(planetId);
  };
  return (
    <div className="relative w-24">
      <Progress value={percent} max={100} variant="secondary" />
      {percent >= 100 && (
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2">
          <Button size="xs" variant="error" onClick={handleStrike}>
            STRIKE
          </Button>
        </div>
      )}
    </div>
  );
};
