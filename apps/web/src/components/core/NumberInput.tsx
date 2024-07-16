import { useGame } from "@/hooks/useGame";
import { adjustDecimals } from "@primodiumxyz/core";
import { Button } from "./Button";

export const NumberInput: React.FC<{
  min?: number;
  max?: number;
  toFixed?: number;
  onChange?: (val: string) => void;
  count: string;
}> = ({ count, min = 0, max = Infinity, onChange, toFixed = 0 }) => {
  const game = useGame();

  const handleUpdate = (newCount: string) => {
    newCount = adjustDecimals(newCount, toFixed);
    // const allZeroes = newCount.split("").every((digit) => digit == "0");

    if (isNaN(Number(newCount))) {
      onChange?.(min.toString());
      return;
    }

    const countNum = Number(newCount);
    if (countNum > max) {
      newCount = max.toString();
    } else if (countNum < min) {
      newCount = min.toString();
    }

    onChange?.(newCount);
  };

  return (
    <div className={`flex mb-4 relative justify-center items-center gap-2`}>
      <Button
        size={"xs"}
        variant={"ghost"}
        disabled={Number(count) <= min}
        onClick={(e) => {
          e?.preventDefault();
          handleUpdate(Math.max(min, count == "" ? 0 : Number(count) - 1).toString());
        }}
      >
        -
      </Button>
      <input
        type="number"
        className={`bg-neutral px-2 text-center w-24 border border-secondary focus:outline-none ${
          Number(count) > max ? "text-error" : ""
        }`}
        value={count}
        placeholder={min.toString()}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          e.preventDefault();
          handleUpdate(e.target.value);
        }}
        onFocus={game.GLOBAL.disableGlobalInput}
        onBlur={game.GLOBAL.enableGlobalInput}
        min={0}
        max={max}
      />
      <Button
        size={"xs"}
        variant={"ghost"}
        disabled={Number(count) >= max}
        onClick={(e) => {
          e?.preventDefault();
          handleUpdate(Math.min(max, count == "" ? min + 1 : Number(count) + 1).toString());
        }}
      >
        +
      </Button>
      {max !== Infinity && (
        <div className="absolute right-1/2 -bottom-1/2 translate-x-1/2 translate-y-1/2">
          <Button
            variant={"ghost"}
            size={"xs"}
            disabled={Number(count) >= max}
            onClick={() => handleUpdate(max.toString())}
          >
            max
          </Button>
        </div>
      )}
    </div>
  );
};
