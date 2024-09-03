import { useEffect } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import { EViewMode } from "@primodiumxyz/core";
import { usePlayerAccount } from "@primodiumxyz/core/react";
import { Modal } from "@/components/core/Modal";
import { Navigator } from "@/components/core/Navigator";
import { AudioSettings } from "@/components/settings/AudioSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";

export const Settings = () => (
  <Modal title="Settings">
    <Modal.Button variant="ghost" size="xs" shape="square">
      <Cog6ToothIcon className="size-6" />
    </Modal.Button>

    <Modal.Content className="h-120 !w-[300px]">
      <_Settings />
    </Modal.Content>
  </Modal>
);

const _Settings = () => {
  const { logout, playerAccount } = usePlayerAccount();

  const { ViewMode } = useSettings();
  const {
    ROOT: { tables: gameTables },
  } = useGame();

  useEffect(() => {
    const unsubscribe = ViewMode.watch({
      onChange: ({ properties: { current } }) => {
        // to be able to render animations only on the map (not in dashboard)
        gameTables.GameState.update({ onMap: current?.value === EViewMode.Map });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [gameTables]);

  return (
    <Navigator initialScreen="main" className="flex h-full w-full flex-col items-center gap-2 border-0 p-0 text-white">
      <Navigator.Screen title="main">
        <div className="my-3 flex flex-col items-center space-y-3">
          <Navigator.NavButton to="general" variant="secondary" size="sm" className="w-28">
            General
          </Navigator.NavButton>
          <Navigator.NavButton to="audio" variant="secondary" size="sm" className="w-28">
            Audio
          </Navigator.NavButton>
          {playerAccount && (
            <Modal.CloseButton variant="error" size="sm" className="w-28" onClick={logout}>
              Logout
            </Modal.CloseButton>
          )}
        </div>
      </Navigator.Screen>

      <AudioSettings />
      <GeneralSettings />
    </Navigator>
  );
};
