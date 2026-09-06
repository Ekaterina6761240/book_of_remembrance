import { useEffect, useRef } from 'react';
import { IdleManager } from '../services/IdleManager';

export const useIdleManager = (timeoutMs: number, onIdle: () => void): void => {
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    const manager = new IdleManager({
      timeoutMs,
      onIdle: () => onIdleRef.current(),
    });

    manager.start();
    return () => manager.stop();
  }, [timeoutMs]);
};
