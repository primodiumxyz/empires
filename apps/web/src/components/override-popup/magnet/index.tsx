import React, { useState } from "react";

import { EEmpire } from "@primodiumxyz/contracts/config/enums";
import { usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Divider } from "@/components/core/Divider";
import { NumberInput } from "@/components/core/NumberInput";
import { ExecuteButton } from "@/components/override-popup/magnet/ExecuteButton";
import { FakeExecuteButton } from "@/components/override-popup/magnet/FakeExecuteButton";
import { MagnetButton } from "@/components/override-popup/magnet/MagnetButton";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";

/*
1. disable magnets if no adjacent planets of current empire
*/
export const MagnetContent: React.FC<{ entity: Entity }> = ({ entity: planetId }) => {
  const [empire, setEmpire] = useState<EEmpire>(EEmpire.LENGTH);

  const { playerAccount } = usePlayerAccount();
  const [inputValue, setInputValue] = useState("1");

  const magnets = usePlanetMagnets(planetId);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex flex-row items-center gap-2">
        <div>
          <div className="grid grid-cols-3 gap-2">
            {magnets.map((magnet, index) => (
              <MagnetButton
                key={index}
                planetId={planetId}
                selected={empire === magnet.empire}
                magnetData={magnet}
                onClick={() => setEmpire(magnet.empire)}
              />
            ))}
          </div>
          {empire === EEmpire.LENGTH && <p className="text-xs opacity-50">Select empire </p>}
        </div>
        <Divider direction="vertical" className="self-center" />
        <div className="flex flex-col items-center justify-start">
          <NumberInput min={1} max={Infinity} count={inputValue} onChange={setInputValue} />
        </div>
      </div>
      {playerAccount && (
        <ExecuteButton
          planetId={planetId}
          empire={empire}
          address={playerAccount.address}
          entity={playerAccount.entity}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
      )}
      {!playerAccount && (
        <FakeExecuteButton planetId={planetId} empire={empire} inputValue={inputValue} setInputValue={setInputValue} />
      )}
    </div>
  );
};
