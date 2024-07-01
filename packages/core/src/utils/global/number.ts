/**
 * Converts a bigint or number to a number within the safe range of JavaScript.
 * @param value - The value to convert.
 * @returns The converted number.
 */
export function bigintToNumber(value: bigint | number): number {
  if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) {
    return Number(value);
  } else {
    return 0;
  }
}

/**
 * Adjusts the decimals of a number.
 * @param num - The number to adjust.
 * @param toFixed - The number of fixed decimal places.
 * @returns The adjusted number.
 */
export function adjustDecimals(num: string, toFixed: number): string {
  const allZeroes = num.split("").every((digit) => digit == "0");
  if (allZeroes) return "";
  const parts = num.split(".");
  if (parts.length > 2) throw new Error("Invalid number");
  if (parts.length === 2 && parts[1].length > toFixed) {
    parts[1] = parts[1].substring(0, toFixed);
  }
  return toFixed == 0 ? parts[0] : parts.join(".");
}

/**
 * Gets the decimal representation of a number.
 * @param num - The number.
 * @param max - The maximum number of decimal places.
 * @returns The decimal representation.
 */
function getDecimals(num: number, max = 3): string {
  const parts = num.toString().split(".");
  const digits = parts[1] ? (parts[1].length > max ? max : parts[1].length) : 0;
  return num.toFixed(digits);
}

type FormatOptions = {
  fractionDigits?: number;
  short?: boolean;
  showZero?: boolean;
  notLocale?: boolean;
};

/**
 * Returns the maximum of two bigints.
 * @param a - The first bigint.
 * @param b - The second bigint.
 * @returns The maximum bigint.
 */
export const bigintMax = (a: bigint, b: bigint): bigint => (a > b ? a : b);

/**
 * Returns the minimum of two bigints.
 * @param a - The first bigint.
 * @param b - The second bigint.
 * @returns The minimum bigint.
 */
export const bigintMin = (a: bigint, b: bigint): bigint => (a < b ? a : b);

const shorten = (n: number, digits: number): string => {
  const units = ["", "K", "M", "B", "T"];
  let unitIndex = 0;
  while (Math.abs(n) >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }
  return getDecimals(n, digits) + units[unitIndex];
};

/**
 * Formats a number.
 * @param num - The number to format.
 * @param options - The formatting options.
 * @returns The formatted number.
 */

export function formatNumber(
  num: number | bigint,
  options?: FormatOptions
): string {
  const digits =
    options?.fractionDigits === undefined ? 0 : options.fractionDigits;
  if (num === 0 || num === 0n) return options?.showZero ? "0" : "--";

  if (typeof num === "number") {
    if (options?.short) return shorten(num, digits);
    const fixedNum =
      digits == 0 ? String(Math.floor(num)) : num.toFixed(digits);
    if (num < 1) {
      return fixedNum.replace(/(\.\d*?[1-9])0+$|\.0*$/, "$1");
    }
    return options?.notLocale
      ? parseFloat(fixedNum).toString()
      : parseFloat(fixedNum).toLocaleString();
  }

  if (typeof num === "bigint") {
    if (options?.short) return shorten(Number(num), digits);
    return options?.notLocale ? num.toString() : num.toLocaleString();
  }
  return "";
}

/**
 * Formats time.
 * @param rawSeconds - The raw time in seconds.
 * @returns The formatted time.
 */
export function formatTime(
  rawSeconds: number | bigint,
  short?: boolean
): string {
  if (short) return formatTimeShort(rawSeconds);
  const seconds = Number(rawSeconds);
  if (seconds < 0) return "00:00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Formats time in a short format.
 * @param rawSeconds - The raw time in seconds.
 * @returns The formatted time.
 */
function formatTimeShort(rawSeconds: number | bigint): string {
  const seconds = Number(rawSeconds);
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}hr`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes > 0) return `${minutes}m`;
  const secs = Math.floor(seconds % 60);
  return `${secs}s`;
}

/**
 * Formats time ago.
 * @param time - The time.
 * @returns The formatted time ago string.
 */
export function formatTimeAgo(time: number | bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(time);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
