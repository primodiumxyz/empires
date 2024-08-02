import { InterfaceIcons } from "@primodiumxyz/assets";
import { IconLabel } from "@/components/core/IconLabel";
import { Tooltip } from "@/components/core/Tooltip";

export const Shields = ({ shieldCount }: { shieldCount: bigint }) => {
  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIELDS`}>
        <p className="flex items-center justify-center">
          <IconLabel imageUri={InterfaceIcons.Defense} text={shieldCount.toLocaleString()} />
        </p>
      </Tooltip>
    </div>
  );
};
