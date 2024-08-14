import React from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";

export const ShieldEaterContent: React.FC<{ entity: Entity }> = ({ entity }) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(entity);
  const planetEmpire = planet?.empireId ?? (0 as EEmpire);

  const shieldEaterPriceWei = 0n;
  const shieldEaterPointsReceived = useOverridePointsReceived(EOverride.LENGTH, planetEmpire, shieldEaterPriceWei);

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
      <PointsReceived points={shieldEaterPointsReceived} inline explicit />
    </div>
  );
};
