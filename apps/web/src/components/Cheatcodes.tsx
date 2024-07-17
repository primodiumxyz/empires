import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import CheatcodesButton, { CheatcodesCloseButton } from "@/components/CheatcodesButton";
import { setupCheatcodes } from "@/config/setupCheatcodes";
import { useContractCalls } from "@/hooks/useContractCalls";
import { CheatcodeInputs, CheatcodeInputsBase, Cheatcode as CheatcodeType, formatValue } from "@/util/cheatcodes";
import { cn } from "@/util/client";

import "@/index.css";

import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Modal } from "@/components/core/Modal";
import { TextInput } from "@/components/core/TextInput";

/* -------------------------------------------------------------------------- */
/*                                 CHEATCODES                                 */
/* -------------------------------------------------------------------------- */

export const Cheatcodes = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const core = useCore();
  const accountClient = useAccountClient();
  const contractCalls = useContractCalls();
  const cheatcodes = setupCheatcodes(core, accountClient, contractCalls);

  useEffect(() => {
    const closeCheatcodes = (e: MouseEvent) => {
      if (!open || !modalRef.current || !buttonRef.current) return;
      if (!modalRef.current.contains(e.target as Node) && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", closeCheatcodes);
    return () => document.removeEventListener("click", closeCheatcodes);
  }, [open]);

  return (
    <Modal title="Cheatcodes">
      <Modal.Button className="absolute bottom-10 right-2 h-[26px] w-[26px] p-0" variant="warning">
        {/* <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="#000000">
          <path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-64c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0z" />
        </svg>
      </Modal.Button>
      {/* TODO: remove when default overflow-y behavior on modal */}
      <Modal.Content className="overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 pr-2 md:grid-cols-2 lg:grid-cols-3">
          {cheatcodes.map((cheatcode, i) => (
            // @ts-expect-error wrong type inference -- will fix on base template
            <Cheatcode key={i} cheatcode={cheatcode} index={i} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
        </div>
      </Modal.Content>
    </Modal>
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
  const { title, caption, inputs, execute: _execute, bg = "bg-gray-500/10" } = cheatcode;
  const [inputValues, setInputValues] = useState<CheatcodeInputs<T>>({} as CheatcodeInputs<T>);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | undefined>(undefined);

  const execute = async (args: CheatcodeInputs<T>) => {
    setLoading(true);

    try {
      const success = await _execute(args);
      setStatus(success ? "success" : "error");
      setTimeout(() => setStatus(undefined), 2000);
    } catch (err) {
      console.error("Error executing cheatcode", err);
    }

    setLoading(false);
  };

  return (
    <div className={cn("flex flex-col", activeTab === index && "col-span-full")}>
      <div
        className={cn(
          "cursor-pointer rounded-box bg-neutral px-4 py-2 transition-colors hover:bg-primary",
          bg,
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
          const { label, inputType = "string", options } = input;
          if (options && options?.length !== new Set(options?.map((o) => o.id)).size) {
            console.error('Cheatcode input options must have unique "id" values', input);
            return;
          }
          // default value will be either provided, or first option if any, or default value corresponding to the input type
          const defaultValue = formatValue(inputType, input.defaultValue ?? options?.[0]?.value).toString();

          return (
            <div key={inputKey} className="flex flex-col gap-1 text-sm">
              <label className="text-gray-300">{label}</label>
              {options ? (
                <select
                  defaultValue={defaultValue}
                  onChange={(e) => {
                    setInputValues((prev) => ({
                      ...prev,
                      [inputKey]: {
                        ...input,
                        id: e.target.value,
                        value: formatValue(inputType, options.find((o) => o.id === e.target.value)?.value),
                      },
                    }));
                  }}
                  className="max-h-8 bg-gray-800 p-2 text-gray-300"
                >
                  {options?.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.value.toString()}
                    </option>
                  ))}
                </select>
              ) : (
                <TextInput
                  placeholder={defaultValue}
                  defaultValue={defaultValue}
                  onChange={(e) => {
                    setInputValues((prev) => ({
                      ...prev,
                      [inputKey]: { ...input, value: formatValue(inputType, e.target.value) },
                    }));
                  }}
                  className="max-h-8 text-sm"
                />
              )}
            </div>
          );
        })}
        <Button
          variant={status === "success" ? "success" : status === "error" ? "warning" : "secondary"}
          className="col-span-full mt-2 h-8"
          disabled={loading}
          onClick={() => {
            const argsWithValues = Object.entries(inputs).reduce((acc, [inputKey, input]) => {
              return {
                ...acc,
                [inputKey]: {
                  ...input,
                  value: inputValues[inputKey]?.value ?? input.defaultValue,
                  id: inputValues[inputKey]?.id ?? input.options?.[0]?.id,
                },
              };
            }, {} as CheatcodeInputs<T>);

            execute(argsWithValues);
          }}
        >
          {loading ? "..." : status === "success" ? "Executed" : status === "error" ? "Error executing" : "Execute"}
        </Button>
      </div>
    </div>
  );
};
