import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import CheatcodesButton, { CheatcodesCloseButton } from "@/components/CheatcodesButton";
import { setupCheatcodes } from "@/config/setupCheatcodes";
import { CheatcodeInputs, CheatcodeInputsBase, Cheatcode as CheatcodeType, createCheatcode } from "@/util/cheatcodes";
import { cn } from "@/util/client";

import "@/index.css";

import { useContractCalls } from "@/hooks/useContractCalls";
import { useTxExecute } from "@/hooks/useTxExecute";

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
    <>
      {/* open button */}
      <CheatcodesButton ref={buttonRef} setOpen={setOpen} className={open ? "hidden" : ""} />
      {/* overlay */}
      <div
        className={cn(
          "cheatcodes-modal absolute h-[95%] w-[95%] rounded-btn bg-gray-950 bg-opacity-90 md:h-[90%] md:w-[90%]",
          !open && "hidden",
        )}
      />
      {/* modal */}
      <div
        ref={modalRef}
        className={cn(
          "cheatcodes-modal absolute flex h-[95%] w-[95%] flex-col gap-2 py-4 pl-4 pr-2 md:h-[90%] md:w-[90%]",
          !open && "hidden",
        )}
      >
        {/* close button */}
        <CheatcodesCloseButton setOpen={setOpen} />
        {/* cheatcodes */}
        <h1 className="font-semibold uppercase text-gray-300">Cheatcodes</h1>
        <div className="flex flex-col gap-4 overflow-auto pr-2">
          {cheatcodes.map((cheatcode, i) => (
            <Cheatcode key={i} cheatcode={cheatcode} index={i} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
        </div>
      </div>
    </>
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
    <div className="flex flex-col">
      <div
        className={cn(
          "cursor-pointer rounded-box bg-neutral px-4 py-2 transition-colors hover:bg-primary",
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
          className={cn(
            "col-span-full mt-2 bg-gray-800 p-2 text-gray-300 hover:bg-primary disabled:bg-gray-800",
            status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : "",
          )}
          disabled={loading}
        >
          {loading ? "..." : status === "success" ? "Executed" : status === "error" ? "Error executing" : "Execute"}
        </button>
      </div>
    </div>
  );
};
