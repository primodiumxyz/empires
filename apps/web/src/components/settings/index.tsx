import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import { usePlayerAccount } from "@primodiumxyz/core/react";
import { Modal } from "@/components/core/Modal";
import { Navigator } from "@/components/core/Navigator";
import { AudioSettings } from "@/components/settings/AudioSettings";

export const Settings = () => (
  <Modal title="Settings">
    <Modal.Button variant="ghost" size="xs" shape="square">
      <Cog6ToothIcon className="size-6 hover:rotate-45 transition-all duration-300" />
    </Modal.Button>

    <Modal.Content className="h-120 !w-[300px]">
      <_Settings />
    </Modal.Content>
  </Modal>
);

const _Settings = () => {
  const { logout, playerAccount } = usePlayerAccount();

  return (
    <Navigator initialScreen="main" className="flex h-full w-full flex-col items-center gap-2 border-0 p-0 text-white">
      <Navigator.Screen title="main">
        <div className="my-3 flex flex-col items-center space-y-3">
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
    </Navigator>
  );
};
