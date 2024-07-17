import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

export const EmpireEnumToColor = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

export const AdvanceTurn = () => {
  const { tables } = useCore();
  const { updateWorld } = useContractCalls();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  const turn = tables.Turn.use();

  if (!turn) return null;

  return (
    <TransactionQueueMask id={`update-world`}>
      <Button
        size="lg"
        shape="square"
        variant="ghost"
        className={cn(EmpireEnumToColor[turn.empire as EEmpire], "w-fit px-4")}
        onClick={() => updateWorld()}
        disabled={turn.nextTurnBlock > blockNumber}
      >
        <div className="flex flex-col gap-2">
          <p className="text-md font-bold">{EmpireEnumToName[turn.empire as EEmpire]}'s Turn</p>
          {turn.nextTurnBlock <= blockNumber && (
            <p className="flex items-center gap-2 text-sm">
              ADVANCE TURN <ArrowRightIcon className="size-4" />
            </p>
          )}
          {turn.nextTurnBlock > blockNumber && (
            <p className="text-sm">{(turn.nextTurnBlock - blockNumber).toLocaleString()} blocks remaining</p>
          )}
        </div>
      </Button>
    </TransactionQueueMask>
  );
};
