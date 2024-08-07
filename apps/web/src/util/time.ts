export const msToDuration = (ms: number): string => {
  // Ensure ms is non-negative
  const duration = Math.max(0, Math.floor(ms / 1000));

  const seconds = duration % 60;
  const minutes = Math.floor(duration / 60) % 60;
  const hours = Math.floor(duration / 3600);

  // Pad each component with zeros if necessary
  const pad = (num: number): string => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
