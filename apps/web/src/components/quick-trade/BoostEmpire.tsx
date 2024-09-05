import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { usePlayerAccount } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { NumberInput } from "@/components/core/NumberInput";
import { EmpireLogo } from "@/components/shared/EmpireLogo";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { DEFAULT_EMPIRE } from "@/util/lookups";
import { SlippageSettings } from "@/components/shared/SlippageSettings";

export const BoostEmpire = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);
  const [amount, setAmount] = useState("0");
  const empires = useEmpires();
  const calls = useContractCalls();
  const {
    MAIN: { sprite },
  } = useGame();
  const { playerAccount, login } = usePlayerAccount();

  const {expected: boostPriceWei, max: boostPriceWeiMax} = useOverrideCost(EOverride.AirdropGold, selectedEmpire, BigInt(amount));
  const boostPointsReceived = useOverridePointsReceived(EOverride.AirdropGold, selectedEmpire, BigInt(amount));

  useEffect(() => {
    setAmount("0");
  }, [selectedEmpire]);

  const handleInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    if (value >= 0) {
      setAmount(value.toString());
    }
  };

  const handleSubmit = () => {
    calls.airdropGold(selectedEmpire, BigInt(amount), boostPriceWeiMax, boostPointsReceived.value);
    setAmount("0");
  };
  return (
    <SecondaryCard>
      <div className="h-64 p-2">
        <div className="flex items-center justify-center">
          <p className="mb-2 block w-4/5 text-center text-xs text-gray-400">
            Gain empire points and airdrop gold to planets
          </p>
        </div>

        <SecondaryCard className="flex-row justify-center gap-4 bg-black/10 py-4">
          <Dropdown
            value={selectedEmpire}
            onChange={(value) => setSelectedEmpire(value)}
            variant="bottomRight"
            justify="start"
            className="w-32 gap-1"
          >
            {Array.from(empires.entries()).map(([key, empire]) => (
              <Dropdown.Item key={key} value={key}>
                <EmpireLogo empireId={key} size="sm" />
              </Dropdown.Item>
            ))}
          </Dropdown>
          <NumberInput count={amount} onChange={handleInputChange} min={0} className="w-40 place-self-center" />
        </SecondaryCard>

        <div className="flex items-center justify-center gap-2">
          <Badge size="md" variant="success" className="mt-2 p-4 opacity-80">
            +{formatEther(boostPointsReceived.value)} PTS
            {/* todo: add gold amount calculation */}
            {/* AND {formatEther(boostPriceWei)} GOLD */}
          </Badge>
        </div>
        <div className="mt-2 flex flex-col items-center">
          {!!playerAccount && (
            <TransactionQueueMask id="sell-points" className="relative">
              <Button size="md" className="text-base" disabled={amount == "0" || !boostPriceWei} onClick={handleSubmit}>
                Buy
              </Button>
              <SlippageSettings className="absolute top-1/2 -translate-y-1/2 left-full" disabled={amount == "0" || !boostPriceWei} />
            </TransactionQueueMask>
          )}
          {!playerAccount && (
            <Button size="md" className="text-base" onClick={() => login()}>
              Login to Buy
            </Button>
          )}
          <div className="w-fit rounded-box rounded-t-none bg-secondary/25 px-1 text-center text-xs opacity-75">
            <Price wei={boostPriceWei} />
            <p className="opacity-70 text-[0.6rem]" >Max <Price wei={boostPriceWeiMax}  /></p>
          </div>
        </div>
      </div>
    </SecondaryCard>
  );
};
