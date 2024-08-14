import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { usePrivy } from "@privy-io/react-auth";

import { Button } from "@/components/core/Button";
import { Modal } from "@/components/core/Modal";
import { Navigator } from "@/components/core/Navigator";
import { AudioSettings } from "@/components/Settings/AudioSettings";
import { GeneralSettings } from "@/components/Settings/GeneralSettings";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";

const params = new URLSearchParams(window.location.search);

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
  const { logout } = usePrivy();
  const { cancelBurner, usingBurner } = useBurnerAccount();

  const handleLogout = async () => {
    if (usingBurner) cancelBurner();
    else await logout();
  };
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
          <Button variant="error" size="sm" className="w-28" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Navigator.Screen>

      <AudioSettings />
      <GeneralSettings />
    </Navigator>
  );
};
