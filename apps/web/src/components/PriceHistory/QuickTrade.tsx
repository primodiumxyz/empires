import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, EOverride, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card, SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { NumberInput } from "@/components/core/NumberInput";
import { Tabs } from "@/components/core/Tabs";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { usePointPrice } from "@/hooks/usePointPrice";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const QuickTrade = () => {
  const [tabIndex, setTabIndex] = useState(-1);
  const { tables } = useCore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const component = document.getElementById("quick-trade-component");
      if (component && !component.contains(event.target as Node)) {
        tables.SelectedTab.set({ value: -1 });
        setTabIndex(-1);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <Tabs
      defaultIndex={tabIndex}
      onChange={(index) => setTabIndex(index ?? -1)}
      className="-top-[6px] left-1/2 flex hidden -translate-x-1/2 flex-col items-center justify-center lg:absolute"
      id="quick-trade-component"
    >
      <Join className="-mt-[5px] flex justify-center">
        <Tabs.Button size="sm" index={0} togglable variant="primary" className="mr-1">
          Boost
        </Tabs.Button>
        <Tabs.Button size="sm" index={1} togglable variant="primary">
          Sell
        </Tabs.Button>
      </Join>
      <Tabs.Pane index={0} fragment>
        <BoostEmpire />
      </Tabs.Pane>
      <Tabs.Pane index={1} fragment>
        <SellPoints />
      </Tabs.Pane>
    </Tabs>
  );
};

const SellPoints = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);
  const [amount, setAmount] = useState("0");
  const empires = useEmpires();
  const { tables } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const {
    MAIN: { sprite },
  } = useGame();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: selectedEmpire, playerId: entity })?.value ?? 0n;

  const handleInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    const max = Math.floor(Number(formatEther(playerPoints)));
    if (value >= 0 && value <= max) {
      setAmount(value.toString());
    }
  };

  const { price: pointsToWei, message } = usePointPrice(selectedEmpire, Number(amount));
  const handleSubmit = () => {
    calls.sellPoints(selectedEmpire, BigInt(Number(amount) * POINTS_UNIT));

    setAmount("0");
  };

  return (
    <Card>
      <p className="mb-2 text-center text-xs text-gray-400">Sell points for a profit</p>
      <SecondaryCard className="flex-row items-center justify-center gap-4 bg-black/10">
        <Dropdown value={selectedEmpire} onChange={(value) => setSelectedEmpire(value)} className="w-32">
          {Array.from(empires.entries()).map(([key, empire]) => (
            <Dropdown.Item key={key} value={key}>
              <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} />
            </Dropdown.Item>
          ))}
        </Dropdown>
        <NumberInput
          count={amount}
          onChange={handleInputChange}
          min={0}
          max={Number(formatEther(playerPoints))}
          className="mt-4 w-32 place-self-center"
        />
      </SecondaryCard>

      <div className="mt-2 flex flex-col items-center">
        <TransactionQueueMask id="sell-points">
          <Button size="sm" className="w-24 text-base" disabled={amount == "0" || !pointsToWei} onClick={handleSubmit}>
            Sell
          </Button>
        </TransactionQueueMask>
        <Badge size="sm" variant="primary" className="rounded-t-none">
          {message ? (
            <span className="-none text-center text-[0.6rem] text-white">{message}</span>
          ) : (
            <Price wei={pointsToWei} className="text-sm text-white" />
          )}
        </Badge>
      </div>
    </Card>
  );
};

const BoostEmpire = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);
  const [amount, setAmount] = useState("0");
  const empires = useEmpires();
  const { tables } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const calls = useContractCalls();
  const {
    MAIN: { sprite },
  } = useGame();
  const balance = useBalance(entity);
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: selectedEmpire, playerId: entity })?.value ?? 0n;

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
    <Card noDecor>
      <span className="mb-2 block text-center text-xs text-gray-400">
        Gain empire points and airdrop gold to planets
      </span>

      <SecondaryCard className="flex-row justify-center gap-4 bg-black/10">
        <Dropdown value={selectedEmpire} onChange={(value) => setSelectedEmpire(value)} className="w-32">
          {Array.from(empires.entries()).map(([key, empire]) => (
            <Dropdown.Item key={key} value={key}>
              <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} />
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
            size="sm"
            className="w-24 text-base"
            disabled={amount == "0" || !boostPriceWei}
            onClick={handleSubmit}
          >
            Buy
          </Button>
        </TransactionQueueMask>
        <Badge size="sm" variant="primary" className="rounded-t-none">
          <Price wei={boostPriceWei} className="text-sm text-white" />
        </Badge>
      </div>
    </Card>
  );
};
