import { Button } from '@/components/core/Button';
import { SecondaryCard } from '@/components/core/Card';
import { Join } from '@/components/core/Join';
import { NumberInput } from '@/components/core/NumberInput';
import { TextInput } from '@/components/core/TextInput';
import { Tooltip } from '@/components/core/Tooltip';
import { cn } from '@/util/client';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { adjustDecimals } from '@primodiumxyz/core';
import React, { useState } from 'react';

type OverrideName = 'CreateShip' | 'ChargeShield' | 'SellPoints' | 'AirdropGold' | 'PlaceMagnet' | 'DetonateShieldEater' | 'PlaceAcidRain'

export const SlippageSettings = () => {
  const [isAuto, setIsAuto] = useState(true);
  const autoSlippage = 5;
  const [customSlippage, setCustomSlippage] = useState("0.5");

  const slippage = isAuto ? autoSlippage : customSlippage;
  return (
    <SecondaryCard>
      <div className="flex flex-col">
        <div className="flex items-center">
        <span className="text-xs mr-2">MAX SLIPPAGE</span>
        <div>
          <Tooltip
            tooltipContent={`Allow tolerance for price fluctuations`}
            direction="top"
            className="w-40 text-xs"
          >
            <InformationCircleIcon className="size-3" />
          </Tooltip>
</div>
        </div>
        <div className="flex items-center gap-2">
            <Join>
        <Button 
          onClick={() => setIsAuto(true)}
          variant={isAuto ? 'secondary' : 'neutral'}
          size= "xs"
        >
          AUTO
        </Button>
        <Button 
          onClick={() => setIsAuto(false)}
          variant={isAuto ? 'neutral' : 'secondary'}
        >
          CUSTOM
        </Button>
      </Join>
      <div className="relative">
      <input
        type="number"
        className={cn(
          "w-20 rounded-md border border-secondary bg-neutral px-2 py-1 focus:outline-none disabled:opacity-50",
          Number(slippage) > 100 ? "text-error" : "",
        )}
        disabled={isAuto}
        value={`${slippage}`}
            placeholder={`${slippage}`}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { 
            let value = adjustDecimals(e.target.value, 2);
            if (Number(value) >= 1 && value.startsWith('0')) {
                value = value.replace(/^0+/, '');
            }
            console.log(value);
            if (Number(value) > 100) return;
            if (Number(value) === 0) return setCustomSlippage("0");
            setCustomSlippage(value);
        }}
      />
      <p className={cn("absolute top-1/2 -translate-y-1/2 right-1", isAuto ? "opacity-50" : "")}>%</p>
</div>
 
      </div>
      </div>
    </SecondaryCard>

  );
};