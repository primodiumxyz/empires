import Game from "@/components/Game";
import { useBalance } from "@/hooks/useBalance";
import { useDripAccount } from "@/hooks/useDripAccount";
import { minEth } from "@primodiumxyz/core";
import { useAccountClient, useSyncStatus } from "@primodiumxyz/core/react";
import { useEffect, useMemo } from "react";

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

  const balanceReady = (playerBalance.value ?? 0n) >= minEth;

  return (
    <>
      {!balanceReady && (
        <div className="flex flex-col items-center justify-center h-screen text-white gap-4">
          <p className="text-lg text-white">
            <span className="animate-pulse">Dripping Eth </span>
          </p>
        </div>
      )}

      {balanceReady && <Game />}
    </>
  );
}
