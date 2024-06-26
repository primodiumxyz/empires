export let storage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };
if (typeof window !== "undefined") {
  // Browser environment
  storage = {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
  };
} else {
  storage = {
    getItem: () => null,
    setItem: () => null,
  };
}
