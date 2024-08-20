import { ReactNode, useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";

import { EEmpire, EOverride, POINTS_UNIT } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { NumberInput } from "@/components/core/NumberInput";
import { Tabs } from "@/components/core/Tabs";
import { PointsReceived } from "@/components/shared/PointsReceived";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useAirdropGoldReceived } from "@/hooks/useAirdropGoldReceived";
import { useBalance } from "@/hooks/useBalance";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useOverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { usePointPrice } from "@/hooks/usePointPrice";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const BoostSell = () => {
  const { height } = useWindowDimensions();
  const empires = useEmpires();
  const {
    MAIN: { sprite },
  } = useGame();
  const [empire, setEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);

  const [amountToBoost, setAmountToBoost] = useState("0");
  const [amountToSell, setAmountToSell] = useState("0");

  useEffect(() => {
    setAmountToBoost("0");
    setAmountToSell("0");
  }, [empire]);

  if (height >= 1024)
    return (
      <Card noDecor className="pb-5">
        <div className="flex flex-col gap-4">
          <Dropdown value={empire} onChange={(value) => setEmpire(value)} className="w-56" justify="start">
            {Array.from(empires.entries()).map(([key, empire]) => (
              <Dropdown.Item key={key} value={key}>
                <IconLabel
                  imageUri={sprite.getSprite(empire.sprites.planet)}
                  text={empire.name}
                  caption={`${formatEther(empire.playerPoints)} pts available`}
                  className="gap-2"
                />
              </Dropdown.Item>
            ))}
          </Dropdown>

          <BoostCard empire={empire} amountToBoost={amountToBoost} setAmountToBoost={setAmountToBoost} />
          <div className="mx-auto my-4" />
          <SellCard empire={empire} amountToSell={amountToSell} setAmountToSell={setAmountToSell} />
        </div>
      </Card>
    );

  return (
    <Card noDecor className="pb-5">
      <Tabs persistIndexKey="boost-sell" defaultIndex={0} className="flex flex-col gap-2">
        <Join className="mb-1 self-center">
          <Tabs.Button index={0} size="sm">
            Boost
          </Tabs.Button>
          <Tabs.Button index={1} size="sm">
            Sell
          </Tabs.Button>
        </Join>
        <Tabs.Pane index={0} fragment>
          <BoostCard
            empire={empire}
            setEmpire={setEmpire}
            amountToBoost={amountToBoost}
            setAmountToBoost={setAmountToBoost}
          />
        </Tabs.Pane>
        <Tabs.Pane index={1} fragment>
          <SellCard
            empire={empire}
            setEmpire={setEmpire}
            amountToSell={amountToSell}
            setAmountToSell={setAmountToSell}
          />
        </Tabs.Pane>
      </Tabs>
    </Card>
  );
};

const BoostCard = ({
  empire,
  setEmpire,
  amountToBoost,
  setAmountToBoost,
}: {
  empire: EEmpire;
  setEmpire?: (empire: EEmpire) => void;
  amountToBoost: string;
  setAmountToBoost: (amount: string) => void;
}) => {
  const {
    playerAccount: { address },
  } = useAccountClient();
  const { airdropGold } = useContractCalls();
  const {
    MAIN: { sprite },
  } = useGame();
  const playerBalance = useBalance(address);

  const boostPriceWei = useOverrideCost(EOverride.AirdropGold, empire, BigInt(amountToBoost));
  const boostPointsReceived = useOverridePointsReceived(EOverride.AirdropGold, empire, BigInt(amountToBoost));
  const boostGoldReceived = useAirdropGoldReceived(empire, BigInt(amountToBoost));

  const handleBoostInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    if (value >= 0) {
      setAmountToBoost(value.toString());
    }
  };

  const handleBoostSubmit = () => {
    airdropGold(empire, BigInt(amountToBoost), boostPriceWei, boostPointsReceived.value);
    setAmountToBoost("0");
  };

  return (
    <>
      <span className="text-center text-xs text-gray-400">
        Gain points for an empire and airdrop gold to its planets
      </span>
      <OverrideCard
        empire={empire}
        setEmpire={setEmpire}
        type="boost"
        badgeContent={
          <div className="flex gap-2 text-xs">
            <PointsReceived points={boostPointsReceived} noCaption className="text-xs text-white opacity-100" /> and
            <IconLabel imageUri={sprite.getSprite("Gold")} text={boostGoldReceived.toLocaleString()} className="ml-1" />
          </div>
        }
        amount={amountToBoost}
        handleInputChange={handleBoostInputChange}
        handleSubmit={handleBoostSubmit}
        disabled={amountToBoost == "0" || boostPriceWei > (playerBalance.value ?? 0n)}
        buyPrice={boostPriceWei}
      />
    </>
  );
};

const SellCard = ({
  empire,
  setEmpire,
  amountToSell,
  setAmountToSell,
}: {
  empire: EEmpire;
  setEmpire?: (empire: EEmpire) => void;
  amountToSell: string;
  setAmountToSell: (amount: string) => void;
}) => {
  const { tables } = useCore();
  const {
    playerAccount: { address, entity },
  } = useAccountClient();
  const { sellPoints } = useContractCalls();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;

  const handleSellInputChange = (_value: string) => {
    const value = Math.floor(Number(_value));
    const max = Math.floor(Number(formatEther(playerPoints)));
    if (value >= 0 && value <= max) {
      setAmountToSell(value.toString());
    }
  };

  const handleSellSubmit = () => {
    sellPoints(empire, BigInt(Number(amountToSell) * POINTS_UNIT));

    setAmountToSell("0");
  };

  const { price: pointsToWei, message } = usePointPrice(empire, Number(amountToSell));

  return (
    <>
      <span className="block text-center text-xs text-gray-400">Sell points for ETH</span>
      <OverrideCard
        empire={empire}
        setEmpire={setEmpire}
        type="sell"
        amount={amountToSell}
        handleInputChange={handleSellInputChange}
        handleSubmit={handleSellSubmit}
        max={Number(formatEther(playerPoints))}
        badgeContent={
          message ? (
            <span className="text-center text-[0.6rem] text-white">{message}</span>
          ) : (
            <Price wei={pointsToWei} className="text-sm text-white" />
          )
        }
        disabled={amountToSell == "0" || !pointsToWei}
      />
    </>
  );
};

const OverrideCard = ({
  empire,
  setEmpire,
  type,
  badgeContent,
  amount,
  handleInputChange,
  handleSubmit,
  max,
  disabled,
  buyPrice,
}: {
  empire: EEmpire;
  setEmpire?: (empire: EEmpire) => void;
  type: "boost" | "sell";
  badgeContent: ReactNode;
  amount: string;
  handleInputChange: (value: string) => void;
  handleSubmit: () => void;
  max?: number;
  disabled?: boolean;
  buyPrice?: bigint;
}) => {
  const {
    MAIN: { sprite },
  } = useGame();
  const empires = useEmpires();

  return (
    <div className="relative mt-2 flex flex-col items-center gap-2 rounded-lg border border-gray-600 p-2 py-3">
      <h2 className="absolute -top-3 left-1 bg-neutral px-1 font-semibold text-gray-400">{type}</h2>
      {!!setEmpire && (
        <Dropdown value={empire} onChange={(value) => setEmpire(value)} className="w-56" justify="start">
          {Array.from(empires.entries()).map(([key, empire]) => (
            <Dropdown.Item key={key} value={key}>
              <IconLabel
                imageUri={sprite.getSprite(empire.sprites.planet)}
                text={empire.name}
                caption={type === "sell" ? `${formatEther(empire.playerPoints)} pts available` : undefined}
                className="gap-2"
              />
            </Dropdown.Item>
          ))}
        </Dropdown>
      )}

      <NumberInput
        count={amount}
        onChange={handleInputChange}
        min={0}
        max={max}
        className="w-40 place-self-center lg:mt-2"
      />

      <Badge
        size="lg"
        variant={type === "boost" ? "glass" : "secondary"}
        className={cn("mb-4 mt-2 p-2", type === "boost" ? "bg-gray-500" : "p-4")}
      >
        {badgeContent}
      </Badge>

      <div
        className={cn(
          "absolute left-[50%] flex -translate-x-1/2 flex-col items-center",
          buyPrice ? "-bottom-10" : "-bottom-4",
        )}
      >
        <TransactionQueueMask id={type === "boost" ? "boost-empire" : "sell-points"}>
          <Button
            variant="primary"
            size="sm"
            disabled={disabled}
            onClick={handleSubmit}
            className="w-20 disabled:bg-neutral disabled:opacity-100"
          >
            {type === "boost" ? "Buy" : "Sell"}
          </Button>
        </TransactionQueueMask>
        {!!buyPrice && (
          <p className="w-min rounded-box rounded-t-none bg-gray-500/25 p-1 text-center text-xs opacity-75">
            <Price wei={buyPrice} />
          </p>
        )}
      </div>
    </div>
  );
};
