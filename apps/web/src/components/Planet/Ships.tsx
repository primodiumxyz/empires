import { InterfaceIcons } from "@primodiumxyz/assets";
import { IconLabel } from "@/components/core/IconLabel";
import { Tooltip } from "@/components/core/Tooltip";

export const Ships = ({ shipCount }: { shipCount: bigint }) => {
  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIPS`}>
        <p className="flex items-center justify-center gap-2">
          <IconLabel imageUri={InterfaceIcons.Fleet} text={shipCount.toLocaleString()} />
        </p>
      </Tooltip>
    </div>
  );
};
