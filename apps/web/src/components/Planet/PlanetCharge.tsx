import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Progress } from "@/components/core/Progress";
import { useCharge } from "@/hooks/useCharge";

export const PlanetCharge = ({ planetId }: { planetId: Entity }) => {
  const { charge, maxCharge, percent } = useCharge(planetId);

  const handleStrike = () => {
    console.log("MAKE IT RAIN");
  };
  return (
    <>
      <Progress value={percent} max={100} />
      {percent >= 100 && (
        <Button size="xs" onClick={handleStrike}>
          MAKE IT RAIN
        </Button>
      )}
    </>
  );
};
