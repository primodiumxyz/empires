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
    <>
      <Progress value={percent} max={100} />
      {percent >= 100 && (
        <Button size="xs" onClick={handleStrike}>
          DO IT
        </Button>
      )}
    </>
  );
};
