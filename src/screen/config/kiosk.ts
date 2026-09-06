const DEFAULT_IDLE_TIMEOUT_MS = 90_000;

const readPositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

export const screenKioskConfig = Object.freeze({
  idleTimeoutMs: readPositiveNumber(
    import.meta.env.VITE_SCREEN_IDLE_TIMEOUT_MS,
    DEFAULT_IDLE_TIMEOUT_MS,
  ),
});
