import { Navigator } from "@/components/core/Navigator";
import { RadioGroup } from "@/components/core/Radio";
import { Toggle } from "@/components/core/Toggle";
import { fontStyleOptions, useSettings } from "@/hooks/useSettings";

export const UserSettings = () => {
  const { fontStyle, showBlockchainUnits } = useSettings();

  return (
    <Navigator.Screen title="user" className="flex flex-col gap-4">
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-400">Blockchain units</h2>
          <span className="text-xs text-gray-400">Display values in blockchain units (ETH, blocks)</span>
        </div>
        <Toggle
          defaultChecked={showBlockchainUnits.enabled}
          onToggle={() => showBlockchainUnits.setEnabled(!showBlockchainUnits.enabled)}
        />
      </div>
    </Navigator.Screen>
  );
};
