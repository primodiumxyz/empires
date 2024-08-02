import { InterfaceIcons } from "@primodiumxyz/assets";
import { IconLabel } from "@/components/core/IconLabel";
import { Tooltip } from "@/components/core/Tooltip";

export const GoldCount = ({ goldCount }: { goldCount: bigint }) => {
  return (
    <div className="pointer-events-auto relative z-50">
      <Tooltip tooltipContent={`GOLD`}>
        <p className="pointer-events-auto flex items-center justify-center gap-1.5">
          <IconLabel imageUri={InterfaceIcons.Vault} text={goldCount.toLocaleString()} />
        </p>
      </Tooltip>
    </div>
  );
};
