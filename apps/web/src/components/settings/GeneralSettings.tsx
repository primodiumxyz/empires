import { Navigator } from "@/components/core/Navigator";
import { RadioGroup } from "@/components/core/Radio";
import { Toggle } from "@/components/core/Toggle";
import { fontStyleOptions, useSettings } from "@/hooks/useSettings";

export const GeneralSettings = () => {
  const { FontStyle, showBlockchainUnits } = useSettings();
  const fontStyle = FontStyle.use();
  const fontFamily = fontStyle?.family ?? "pixel";
  const fontSize = fontStyle?.size ?? "md";

  const setFontStyleFamily = (family: (typeof fontStyleOptions.family)[number]) => FontStyle.update({ family });
  const setFontStyleSize = (size: (typeof fontStyleOptions.size)[number]) => FontStyle.update({ size });
  const setFontStyleFamilyRaw = (familyRaw: (typeof fontStyleOptions.familyRaw)[number]) =>
    FontStyle.update({ familyRaw });

  return (
    <Navigator.Screen title="general" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="col-span-2 font-semibold text-gray-400">Font family</h2>
        <RadioGroup
          name="settings-font-family"
          value={fontFamily}
          options={[
            ...fontStyleOptions.family.map((family) => ({
              id: family,
              label: family,
            })),
          ]}
          onChange={(value) => {
            setFontStyleFamily(value as (typeof fontStyleOptions.family)[number]);
            setFontStyleFamilyRaw(
              fontStyleOptions.familyRaw[
                fontStyleOptions.family.indexOf(value as (typeof fontStyleOptions.family)[number])
              ],
            );
          }}
          className="grid grid-cols-[8rem_8rem]"
        />
        <h2 className="col-span-2 font-semibold text-gray-400">Font size</h2>
        <RadioGroup
          name="settings-font-size"
          value={fontSize}
          options={[
            ...fontStyleOptions.size.map((size) => ({
              id: size,
              label: size,
            })),
          ]}
          onChange={(value) => setFontStyleSize(value as (typeof fontStyleOptions.size)[number])}
          className="grid grid-cols-[8rem_8rem]"
        />
      </div>
      <div className="flex flex-col">
        <h2 className="font-semibold text-gray-400">Blockchain units</h2>
        <span className="text-xs text-gray-400/70">Display values in blockchain units (ETH, blocks)</span>
        <Toggle
          defaultChecked={showBlockchainUnits.enabled}
          onToggle={() => showBlockchainUnits.setEnabled(!showBlockchainUnits.enabled)}
        />
      </div>
      <Navigator.BackButton />
    </Navigator.Screen>
  );
};
