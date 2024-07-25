import React from "react";

import { Button } from "@/components/core/Button";
import { NumberInput } from "@/components/core/NumberInput";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";

interface ActionPaneProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onAttackClick: () => void;
  onSupportClick: () => void;
  attackPrice: string;
  supportPrice: string;
  isAttackDisabled?: boolean;
  supportTxQueueId: string;
  attackTxQueueId: string;
  isSupportDisabled?: boolean;
}

export const ActionPane: React.FC<ActionPaneProps> = ({
  inputValue,
  onInputChange,
  onAttackClick,
  onSupportClick,
  attackPrice,
  supportPrice,
  isAttackDisabled = false,
  supportTxQueueId,
  attackTxQueueId,
  isSupportDisabled = false,
}) => {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <NumberInput min={1} max={Infinity} count={inputValue} onChange={onInputChange} />
      <div className="flex gap-2">
        <div className="gap1 flex flex-col items-center">
          <TransactionQueueMask id={attackTxQueueId}>
            <Button onClick={onAttackClick} disabled={isAttackDisabled} size="xs" variant="error">
              - ATTACK
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">{attackPrice}</p>
        </div>

        <div className="flex flex-col items-center">
          <TransactionQueueMask id={supportTxQueueId}>
            <Button onClick={onSupportClick} disabled={isSupportDisabled} size="xs" variant="secondary">
              + SUPPORT
            </Button>
          </TransactionQueueMask>
          <p className="rounded-box rounded-t-none bg-secondary/25 p-1 text-center text-xs opacity-75">
            {supportPrice}
          </p>
        </div>
      </div>
    </div>
  );
};
