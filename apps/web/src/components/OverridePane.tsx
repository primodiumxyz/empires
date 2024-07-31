import React from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Divider } from "@/components/core/Divider";
import { NumberInput } from "@/components/core/NumberInput";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";

interface OverridePaneProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onAttackClick: () => void;
  onSupportClick: () => void;
  attackPrice: bigint;
  supportPrice: bigint;
  nextAttackPrice: bigint;
  nextSupportPrice: bigint;
  isAttackDisabled?: boolean;
  supportTxQueueId: string;
  attackTxQueueId: string;
  isSupportDisabled?: boolean;
}

export const OverridePane: React.FC<OverridePaneProps> = ({
  inputValue,
  onInputChange,
  onAttackClick,
  onSupportClick,
  attackPrice,
  supportPrice,
  nextAttackPrice,
  nextSupportPrice,
  isAttackDisabled = false,
  supportTxQueueId,
  attackTxQueueId,
  isSupportDisabled = false,
}) => {
  const { tables } = useCore();
  const expanded = tables.OverridePaneExpanded.use()?.value ?? false;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={onInputChange} />
      <div className="grid w-full grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1">
          <TransactionQueueMask id={attackTxQueueId}>
            <Button onClick={onAttackClick} disabled={isAttackDisabled} size="xs" variant="error">
              - ATTACK
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
            <Price wei={attackPrice} />
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <TransactionQueueMask id={supportTxQueueId}>
            <Button onClick={onSupportClick} disabled={isSupportDisabled} size="xs" variant="secondary">
              + SUPPORT
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
            <Price wei={supportPrice} />
          </p>
        </div>
      </div>
      {expanded && (
        <>
          <Divider className="self-center border-primary" />
          <div className="flex w-full flex-col gap-1">
            <p className="text-center text-xs opacity-75">Prices on next turn</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-center">
                <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
                  <Price wei={nextAttackPrice} />
                </p>
              </div>
              <div className="flex justify-center">
                <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
                  <Price wei={nextSupportPrice} />
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
