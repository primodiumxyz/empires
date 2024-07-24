import { useEffect, useMemo } from "react";

import { minEth } from "@primodiumxyz/core";
import { useAccountClient } from "@primodiumxyz/core/react";
import Game from "@/components/Game";
import { useBalance } from "@/hooks/useBalance";
import { useDripAccount } from "@/hooks/useDripAccount";

export default function DripScreen() {
  const dripAccount = useDripAccount();
  const { playerAccount } = useAccountClient();

  const playerBalance = useBalance(playerAccount.address, 2000);

  useEffect(() => {
    if (playerBalance.loading || (playerBalance.value ?? 0n) >= minEth) return;
    dripAccount(playerAccount.address);
  }, [playerAccount.address, playerBalance.value, dripAccount]);

  useEffect(() => {
    if (playerBalance.loading || (playerBalance.value ?? 0n) >= minEth) return;
    dripAccount(playerAccount.address);
  }, [playerAccount.address, playerBalance.value, dripAccount]);

  const balanceReady = useMemo(() => (playerBalance.value ?? 0n) >= minEth, [playerBalance.value]);

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
