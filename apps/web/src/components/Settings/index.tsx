import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import { Modal } from "@/components/core/Modal";
import { Navigator } from "@/components/core/Navigator";
import { AudioSettings } from "@/components/Settings/AudioSettings";
import { GeneralSettings } from "@/components/Settings/GeneralSettings";

const params = new URLSearchParams(window.location.search);

export const Settings = () => (
  <Modal title="Settings">
    <Modal.Button className="btn-md h-[58px] w-fit" variant="ghost">
      <Cog6ToothIcon className="size-8" />
    </Modal.Button>

    <Modal.Content className="h-120 !w-[300px]">
      <_Settings />
    </Modal.Content>
  </Modal>
);

const _Settings = () => {
  return (
    <Navigator initialScreen="main" className="flex h-full w-full flex-col items-center gap-2 border-0 p-0 text-white">
      <Navigator.Screen title="main">
        <div className="my-3 flex flex-col items-center space-y-3">
          <Navigator.NavButton to="general" className="btn-seconday btn-sm w-28 border-secondary">
            General
          </Navigator.NavButton>
          <Navigator.NavButton to="audio" className="btn-seconday btn-sm w-28 border-secondary">
            Audio
          </Navigator.NavButton>
        </div>
      </Navigator.Screen>

      <AudioSettings />
      <GeneralSettings />
    </Navigator>
  );
};
