import { PlayerAccountProvider } from "@primodiumxyz/core/react";
import Game from "@/components/game";

const DEV = import.meta.env.PRI_DEV === "true";

function Core() {
  return (
    <PlayerAccountProvider allowBurner={!!DEV}>
      <Game />
    </PlayerAccountProvider>
  );
}
export default Core;
