import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { fontStyleOptions, useSettings } from "@/hooks/useSettings";

export const UserSettings = () => {
  const { fontStyle } = useSettings();

  return (
    <Modal title="Settings">
      <Modal.Button className="btn-md h-[58px] w-fit" variant="ghost">
        <Cog6ToothIcon className="size-8" />
      </Modal.Button>
      <Modal.Content>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="col-span-2 font-semibold text-gray-400">Font family</h2>
            <RadioGroup
              name="settings-font-family"
              value={fontStyle.family.toString()}
              options={[
                ...fontStyleOptions.family.map((family) => ({
                  id: family,
                  label: family,
                })),
              ]}
              onChange={(value) => fontStyle.setFamily(value as (typeof fontStyleOptions.family)[number])}
              className="grid grid-cols-[8rem_8rem]"
            />
            <h2 className="col-span-2 font-semibold text-gray-400">Font size</h2>
            <RadioGroup
              name="settings-font-size"
              value={fontStyle.size.toString()}
              options={[
                ...fontStyleOptions.size.map((size) => ({
                  id: size,
                  label: size,
                })),
              ]}
              onChange={(value) => fontStyle.setSize(value as (typeof fontStyleOptions.size)[number])}
              className="grid grid-cols-[8rem_8rem]"
            />
          </div>
        </div>
      </Modal.Content>
    </Modal>
  );
};
