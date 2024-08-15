import { useEffect, useState } from "react";

import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { NumberInput } from "@/components/core/NumberInput";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";

export const BoostEmpire = ({ selectedEmpire }: { selectedEmpire: EEmpire }) => {
  const {
    playerAccount: { address, publicClient },
  } = useAccountClient();
  const calls = useContractCalls();
  const {
    tables,
    utils: { getTotalCost },
  } = useCore();
  const time = tables.Time.use();

  const [amountToBoost, setAmountToBoost] = useState("0");
  const boostPriceWei = useOverrideCost(EOverride.AirdropGold, selectedEmpire, BigInt(amountToBoost));
  const boostPointsReceived = useOverridePointsReceived(EOverride.AirdropGold, selectedEmpire, BigInt(amountToBoost));

  const [playerBalance, setPlayerBalance] = useState<bigint>(0n);
  //   const max = useMemo(() => {
  //     const costForOne = getTotalCost(EOverride.AirdropGold, selectedEmpire, 1n);
  //     return Math.floor(Number(formatEther(playerBalance)) / Number(costForOne));
  //   }, [playerBalance]);
  const max = 100;

  useEffect(() => {
    setAmountToBoost("0");
  }, [selectedEmpire]);

  useEffect(() => {
    const unsubscribe = tables.Time.watch({
      onChange: () => {
        publicClient.getBalance({ address }).then(setPlayerBalance);
      },
    });

    return () => unsubscribe();
  }, [address, publicClient, time]);

  const handleInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    if (value >= 0 && value <= max) {
      setAmountToBoost(value.toString());
    }
  };

  const handleSubmit = () => {
    calls.airdropGold(selectedEmpire, BigInt(amountToBoost), boostPriceWei, boostPointsReceived.value);
    setAmountToBoost("0");
  };

  return (
    <div className="flex w-full gap-2">
      <SecondaryCard className="w-full flex-row items-center justify-around gap-2 bg-none">
        <NumberInput
          count={amountToBoost}
          onChange={handleInputChange}
          min={0}
          max={max}
          className="mt-4 w-32 place-self-center"
        />

        <div className="flex gap-2">
          <Badge size="sm" variant="error" className="p-4 lg:badge-lg">
            <Price wei={boostPriceWei} className="text-sm text-white lg:!text-lg" />
          </Badge>
          <Badge size="sm" variant="secondary" className="p-4 lg:badge-lg">
            <PointsReceived
              points={boostPointsReceived}
              noCaption
              className="text-sm text-white opacity-100 lg:!text-lg"
            />
          </Badge>
        </div>

        <TransactionQueueMask id="sell-points">
          <Button
            size="sm"
            className="w-full lg:btn-md lg:text-lg"
            disabled={amountToBoost == "0"}
            onClick={handleSubmit}
          >
            Buy
          </Button>
        </TransactionQueueMask>
      </SecondaryCard>
    </div>
  );
};
