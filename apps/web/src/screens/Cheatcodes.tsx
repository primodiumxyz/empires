import React, { Dispatch, SetStateAction, useState } from "react";
import ReactDOM from "react-dom/client";

import { CheatcodeInputs, CheatcodeInputsBase, Cheatcode as CheatcodeType, createCheatcode } from "@/util/cheatcodes";

import "@/index.css";

import { getCheatcodes } from "@/config/getCheatcodes";
import { cn } from "@/util/client";

/* -------------------------------------------------------------------------- */
/*                                 CHEATCODES                                 */
/* -------------------------------------------------------------------------- */

const Cheatcodes = () => {
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <h1 className="font-semibold uppercase text-gray-300">Cheatcodes</h1>
      <div className="flex flex-col gap-4">
        {getCheatcodes().map((cheatcode, i) => (
          <Cheatcode key={i} cheatcode={cheatcode} index={i} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
      </div>
    </div>
  );
};

const Cheatcode = <T extends CheatcodeInputsBase>({
  cheatcode,
  index,
  activeTab,
  setActiveTab,
}: {
  cheatcode: CheatcodeType<T>;
  index: number;
  activeTab: number | undefined;
  setActiveTab: Dispatch<SetStateAction<number | undefined>>;
}) => {
  const { title, caption, inputs, execute: _execute } = cheatcode;
  const [inputValues, setInputValues] = useState<CheatcodeInputs<T>>({} as CheatcodeInputs<T>);
  const [loading, setLoading] = useState(false);

  const execute = async (args: CheatcodeInputs<T>) => {
    setLoading(true);

    try {
      await _execute(args);
    } catch (err) {
      console.error("Error executing cheatcode", err);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "cursor-pointer bg-neutral px-4 py-2 transition-colors hover:bg-primary",
          activeTab === index && "bg-primary",
        )}
        onClick={() => setActiveTab(activeTab === index ? undefined : index)}
      >
        <h2 className="text-sm font-semibold text-gray-300">
          {index + 1}. {title}
        </h2>
        <p className="text-xs text-gray-400">{caption}</p>
      </div>
      <div
        className={cn(
          "hidden gap-2 overflow-hidden bg-neutral px-4 py-2 md:grid-cols-2 xl:grid-cols-4",
          activeTab === index && "grid",
        )}
      >
        {Object.entries(inputs).map(([inputKey, input]) => {
          return (
            <div key={inputKey} className="flex flex-col gap-1 text-sm">
              <label className="text-gray-300">{input.label}</label>
              <input
                type={input.inputType || "text"}
                placeholder={input.defaultValue.toString()}
                onChange={(e) => {
                  setInputValues((prev) => ({
                    ...prev,
                    [inputKey]: { ...input, value: e.target.value },
                  }));
                }}
                className="max-h-8 bg-gray-800 p-2 text-gray-300"
              />
            </div>
          );
        })}
        <button
          onClick={() => {
            const argsWithValues = Object.entries(inputs).reduce((acc, [inputKey, input]) => {
              return {
                ...acc,
                [inputKey]: { ...input, value: inputValues[inputKey]?.value ?? input.defaultValue },
              };
            }, {} as CheatcodeInputs<T>);

            execute(argsWithValues);
          }}
          className="col-span-full mt-2 bg-gray-800 p-2 text-gray-300 hover:bg-primary disabled:bg-gray-800"
          disabled={loading}
        >
          {loading ? "..." : "Execute"}
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   RENDER                                   */
/* -------------------------------------------------------------------------- */

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Cheatcodes />
  </React.StrictMode>,
);
