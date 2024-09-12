import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { ServerIcon } from "@heroicons/react/24/solid";

import { AutoSizer } from "@/components/core/AutoSizer";
import { Button } from "@/components/core/Button";
import { Dropdown } from "@/components/core/Dropdown";
import { Modal } from "@/components/core/Modal";
import { TextInput } from "@/components/core/TextInput";
import { useCheatcodes } from "@/hooks/useCheatcodes";
import { CheatcodeInputs, CheatcodeInputsBase, Cheatcode as CheatcodeType, formatValue } from "@/util/cheatcodes";
import { cn } from "@/util/client";
import { withTransactionStatus } from "@/util/notify";

import "@/index.css";

import { usePlayerAccount } from "@/hooks/usePlayerAccount";

/* -------------------------------------------------------------------------- */
/*                                 CHEATCODES                                 */
/* -------------------------------------------------------------------------- */

export const Cheatcodes = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const cheatcodes = useCheatcodes();
  const { playerAccount } = usePlayerAccount();

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

  if (!cheatcodes || !playerAccount) return null;
  return (
    <div className={className}>
      <Modal title="Cheatcodes">
        <Modal.Button variant="warning">
          <ServerIcon className="size-6" /> CHEATCODES
        </Modal.Button>
        <Modal.Content className={cn("w-1/2 min-w-[500px]", activeTab == undefined && "h-screen")}>
          {activeTab !== undefined && (
            <Button
              variant="primary"
              size="sm"
              className="absolute -top-10 right-12"
              onClick={() => setActiveTab(undefined)}
            >
              Back
            </Button>
          )}
          {activeTab === undefined ? (
            <AutoSizer
              items={cheatcodes}
              itemSize={64}
              render={(item, index) => (
                // @ts-expect-error wrong type inference -- will fix on base template
                <Cheatcode cheatcode={item} index={index} activeTab={activeTab} setActiveTab={setActiveTab} />
              )}
            />
          ) : (
            <Cheatcode
              // @ts-expect-error wrong type inference -- will fix on base template
              cheatcode={cheatcodes[activeTab]}
              index={activeTab}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </Modal.Content>
      </Modal>
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
  const {
    title,
    caption,
    inputs,
    execute: _execute,
    loading: getLoadingMsg,
    success: getSuccessMsg,
    error: getErrorMsg,
    disabled = false,
    bg = "bg-gray-500/10",
  } = cheatcode;
  const [inputValues, setInputValues] = useState<CheatcodeInputs<T>>({} as CheatcodeInputs<T>);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | undefined>(undefined);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const execute = async (args: CheatcodeInputs<T>) => {
    setLoading(true);

    try {
      const success = await withTransactionStatus(() => _execute(args), {
        loading: getLoadingMsg?.(args) ?? "Executing cheatcode...",
        success: getSuccessMsg?.(args) ?? "Cheatcode executed",
        error: getErrorMsg?.(args) ?? "Error executing cheatcode",
      });

      setStatus(success ? "success" : "error");
      setTimeout(() => setStatus(undefined), 2000);
    } catch (err) {
      console.error("Error executing cheatcode", err);
    }

    setLoading(false);
  };

  if (activeTab !== undefined && activeTab !== index) return null;
  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "h-14 cursor-pointer rounded-box bg-neutral px-4 py-2 transition-colors hover:bg-primary",
          activeTab === undefined && bg,
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => !disabled && setActiveTab(activeTab === index ? undefined : index)}
        aria-disabled={disabled}
      >
        <h2 className="text-sm font-semibold text-gray-300">
          {index + 1}. {title}
        </h2>
        <div className="whitespace-nowrap text-xs text-gray-400">{caption}</div>
      </div>
      <div
        className={cn("hidden gap-2 bg-neutral px-4 py-2 md:grid-cols-2 xl:grid-cols-4", activeTab === index && "grid")}
      >
        {Object.entries(inputs).map(([inputKey, input]) => {
          const { label, inputType = "string", options } = input;
          if (options && options?.length !== new Set(options?.map((o) => o.id)).size) {
            console.error('Cheatcode input options must have unique "id" values', input);
            return;
          }
          const defaultValue = formatValue(inputType, input.defaultValue).toString();

          const filteredOptions = options?.filter((option) =>
            (option.value ?? "")
              .toString()
              .toLowerCase()
              .includes(searchTerms[inputKey]?.toLowerCase() || ""),
          );

          return (
            <div key={inputKey} className="flex flex-col gap-1 text-sm">
              <span id={inputKey} className="text-gray-300">
                {label}
              </span>
              {options ? (
                <>
                  <TextInput
                    placeholder="Search..."
                    onChange={(e) => setSearchTerms((prev) => ({ ...prev, [inputKey]: e.target.value }))}
                    className="mb-1 max-h-8 text-sm"
                  />
                  <Dropdown
                    size="sm"
                    value={inputValues[inputKey]?.id ?? options[0].id}
                    onChange={(value) => {
                      setInputValues((prev) => ({
                        ...prev,
                        [inputKey]: {
                          ...input,
                          id: value,
                          value: formatValue(inputType, options.find((o) => o.id === value)?.value),
                        },
                      }));
                    }}
                    className="w-full"
                  >
                    {filteredOptions?.map((option) => (
                      <Dropdown.Item key={option.id} value={option.id}>
                        {option.value?.toString()}
                      </Dropdown.Item>
                    ))}
                  </Dropdown>
                </>
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
