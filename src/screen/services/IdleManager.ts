export const IDLE_ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'touchstart',
  'keydown',
  'scroll',
] as const;

type IdleManagerOptions = {
  timeoutMs: number;
  onIdle: () => void;
  eventTarget?: EventTarget;
};

export class IdleManager {
  private readonly timeoutMs: number;
  private readonly onIdle: () => void;
  private readonly eventTarget: EventTarget;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  constructor({ timeoutMs, onIdle, eventTarget = window }: IdleManagerOptions) {
    this.timeoutMs = timeoutMs;
    this.onIdle = onIdle;
    this.eventTarget = eventTarget;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    IDLE_ACTIVITY_EVENTS.forEach((eventName) => {
      this.eventTarget.addEventListener(eventName, this.handleActivity, {
        capture: true,
        passive: true,
      });
    });
    this.reset();
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    IDLE_ACTIVITY_EVENTS.forEach((eventName) => {
      this.eventTarget.removeEventListener(eventName, this.handleActivity, true);
    });
    this.clearTimer();
  }

  reset = (): void => {
    if (!this.isRunning) return;

    this.clearTimer();
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.onIdle();
    }, this.timeoutMs);
  };

  private readonly handleActivity = (): void => {
    this.reset();
  };

  private clearTimer(): void {
    if (this.timeoutId === null) return;

    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }
}
