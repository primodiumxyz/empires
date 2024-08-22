import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, EOverride } from "@primodiumxyz/contracts";
import { useAccountClient } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const BoostEmpire = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);
  const [amount, setAmount] = useState("0");
  const empires = useEmpires();
  const {
    playerAccount: { address, entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const {
    MAIN: { sprite },
  } = useGame();
  const balance = useBalance(address);

  const boostPriceWei = useOverrideCost(EOverride.AirdropGold, selectedEmpire, BigInt(amount));
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
    calls.airdropGold(selectedEmpire, BigInt(amount), boostPriceWei, boostPointsReceived.value);
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

        <SecondaryCard className="flex-row justify-center gap-4 bg-black/10">
          <Dropdown
            value={selectedEmpire}
            onChange={(value) => setSelectedEmpire(value)}
            variant="bottomRight"
            className="w-32 gap-1"
          >
            {Array.from(empires.entries()).map(([key, empire]) => (
              <Dropdown.Item key={key} value={key}>
                <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} className="text-xs" />
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
          <TransactionQueueMask id="sell-points">
            <Button
              size="md"
              className="w-28 text-base"
              disabled={amount == "0" || !boostPriceWei || boostPriceWei > (balance.value ?? 0n)}
              onClick={handleSubmit}
            >
              Buy
            </Button>
          </TransactionQueueMask>
          <Badge size="sm" variant="primary" className="rounded-t-none p-3">
            <Price wei={boostPriceWei} className="text-sm text-white" />
          </Badge>
        </div>
      </div>
    </SecondaryCard>
  );
};
