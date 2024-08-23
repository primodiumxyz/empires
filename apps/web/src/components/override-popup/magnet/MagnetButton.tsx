import { EEmpire } from "@primodiumxyz/contracts/config/enums";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { IconLabel } from "@/components/core/IconLabel";
import { useAdjacentEmpirePlanets } from "@/hooks/useAdjacentEmpirePlanets";
import { EmpireEnumToConfig } from "@/util/lookups";

type MagnetData = { empire: EEmpire; exists: boolean; endTurn: bigint | undefined };
export const MagnetButton = ({
  planetId,
  selected,
  magnetData,
  onClick,
}: {
  planetId: Entity;
  selected: boolean;
  magnetData: MagnetData;
  onClick: () => void;
}) => {
  const hasAdjacentEmpirePlanets = useAdjacentEmpirePlanets(planetId, magnetData.empire);
  const disabled = hasAdjacentEmpirePlanets.length === 0 || magnetData.exists;
  const errorMessage =
    hasAdjacentEmpirePlanets.length === 0 ? "No planet adjacent" : magnetData.exists ? "Magnet already exists" : "";
  return (
    <Button
      variant={selected ? "secondary" : "neutral"}
      shape="square"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      tooltip={errorMessage}
    >
      <IconLabel imageUri={EmpireEnumToConfig[magnetData.empire].icons.magnet} />
    </Button>
  );
};
