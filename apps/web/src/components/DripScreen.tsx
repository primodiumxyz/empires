import { useEffect, useMemo } from "react";

import { minEth } from "@primodiumxyz/core";
import { useAccountClient } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import Game from "@/components/Game";
import { useBalance } from "@/hooks/useBalance";
import { useDripAccount } from "@/hooks/useDripAccount";
import { useSettings } from "@/hooks/useSettings";

export default function DripScreen() {
  const dripAccount = useDripAccount();
  const { playerAccount } = useAccountClient();
  const { Dripped } = useSettings();

  const playerBalance = useBalance(playerAccount.address, 2000);

  useEffect(() => {
    if (playerBalance.loading || (playerBalance.value ?? 0n) >= minEth) return;
    dripAccount(playerAccount.address);
  }, [playerAccount.address, playerBalance.value]);

  const dripped = Dripped.use(playerAccount.address as Entity)?.value;
  const balanceReady = useMemo(() => dripped || (playerBalance.value ?? 0n) >= minEth, [playerBalance.value, dripped]);

  return (
    <>
      {!balanceReady && (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-white">
          <p className="text-lg text-white">
            <span className="animate-pulse">Dripping Eth</span>
          </p>
        </div>
      )}

      {balanceReady && <Game />}
    </>
  );
}
