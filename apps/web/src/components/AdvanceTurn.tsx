import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

export const EmpireEnumToColor = {
  [EEmpire.Blue]: "btn-accent",
  [EEmpire.Green]: "btn-success",
  [EEmpire.Red]: "btn-error",
};

export const AdvanceTurn = () => {
  const { tables } = useCore();
  const calls = useContractCalls();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  const turn = tables.Turn.use();

  if (!turn) return null;

  return (
    <div className="absolute bottom-0 left-1/2 m-5 -translate-x-1/2">
      <TransactionQueueMask id={`update-world`}>
        <button
          onClick={() => calls.updateWorld()}
          disabled={turn.nextTurnBlock > blockNumber}
          className={cn("btn btn-lg uppercase", EmpireEnumToColor[turn.empire as EEmpire])}
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
        </button>
      </TransactionQueueMask>
    </div>
  );
};
