import { useEffect, useRef, useState } from 'react';

export function useRealtimeUpdates(onDataUpdated) {
  const [isLive, setIsLive] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const callbackRef = useRef(onDataUpdated);
  callbackRef.current = onDataUpdated;

  useEffect(() => {
    let source;
    let reconnectTimer;

    const connect = () => {
      source = new EventSource('/api/events');

      source.onopen = () => {
        setIsLive(true);
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            setIsLive(true);
          } else if (data.type === 'data_updated') {
            setLastEvent(data);
            if (callbackRef.current) {
              callbackRef.current(data);
            }
          }
        } catch {
          // Ignore keepalive or malformed comments
        }
      };

      source.onerror = () => {
        setIsLive(false);
        source.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (source) source.close();
    };
  }, []);

  return { isLive, lastEvent };
}

