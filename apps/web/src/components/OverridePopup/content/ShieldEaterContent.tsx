import React from "react";

import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";

export const ShieldEaterContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  return (
    <div className="flex flex-col items-center">
      <TransactionQueueMask id={`${entity}-boost-charge`}>
        <Button size="sm" variant="error">
          Activate
        </Button>
      </TransactionQueueMask>
      <p className="rounded-box rounded-t-none bg-error/25 p-1 text-center text-xs opacity-75">
        <Price wei={0n} />
      </p>
    </div>
  );
};
