import { useEffect, useRef, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { notificationConnectionStateAtom, notificationErrorAtom, type ConnectionState } from '../utils/atoms/notificationAtoms';

interface UseSSEOptions {
  url: string;
  autoConnect?: boolean;
  maxRetries?: number;
}

interface UseSSEReturn {
  addEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  close: () => void;
}

export const useSSE = ({ url, autoConnect = true, maxRetries = 3 }: UseSSEOptions): UseSSEReturn => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionState, setConnectionState] = useAtom(notificationConnectionStateAtom);
  const setError = useSetAtom(notificationErrorAtom);
  const listenersRef = useRef<Map<string, Set<(event: MessageEvent) => void>>>(new Map());
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const close = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      const listeners = listenersRef.current;
      listeners.forEach((listenerSet, type) => {
        listenerSet.forEach((listener) => {
          eventSourceRef.current?.removeEventListener(type, listener as EventListener);
        });
      });

      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnectionState('disconnected');
    }
  }, [setConnectionState]);

  const connect = useCallback(() => {
    if (!url || eventSourceRef.current) return;

    setConnectionState('connecting');
    setError(null);

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      listenersRef.current.forEach((listeners, type) => {
        listeners.forEach((listener) => {
          eventSource.addEventListener(type, listener as EventListener);
        });
      });

      eventSource.onopen = () => {
        if (!isMountedRef.current) return;
        retryCountRef.current = 0;
        setConnectionState('connected');
        setError(null);
      };

      eventSource.onerror = (event) => {
        if (!isMountedRef.current) return;

        const err = new Error('SSE connection error');
        setError(err);
        console.error('SSE connection error:', event);
        eventSource.close();
        eventSourceRef.current = null;

        if (retryCountRef.current < maxRetries) {
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          setConnectionState('error');
          console.log(`Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);

          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              retryCountRef.current++;
              connect();
            }
          }, delay);
        } else {
          setConnectionState('error');
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create EventSource');
      setError(error);
      setConnectionState('error');
      console.error('Failed to create EventSource:', err);
    }
  }, [url, maxRetries, setConnectionState, setError]);

  const addEventListener = useCallback((type: string, listener: (event: MessageEvent) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)?.add(listener);

    if (eventSourceRef.current) {
      eventSourceRef.current.addEventListener(type, listener as EventListener);
    }
  }, []);

  const removeEventListener = useCallback((type: string, listener: (event: MessageEvent) => void) => {
    const typeListeners = listenersRef.current.get(type);
    if (typeListeners) {
      typeListeners.delete(listener);

      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener(type, listener as EventListener);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect && url) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      close();
    };
  }, [url, autoConnect, connect, close]);

  return {
    addEventListener,
    removeEventListener,
    close,
  };
};
