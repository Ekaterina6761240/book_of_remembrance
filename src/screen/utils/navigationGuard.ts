const NAVIGATION_LOCK_MS = 600;

let navigationLockedUntil = 0;

export const acquireScreenNavigation = (): boolean => {
  const now = Date.now();
  if (now < navigationLockedUntil) return false;

  navigationLockedUntil = now + NAVIGATION_LOCK_MS;
  return true;
};

export const guardScreenLinkNavigation = (event: { preventDefault: () => void }): void => {
  if (!acquireScreenNavigation()) event.preventDefault();
};
