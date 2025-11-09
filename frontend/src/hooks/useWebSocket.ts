import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  channel?: string;
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Connect to WebSocket on port 8000 with client ID
    const socket = new WebSocket(`ws://localhost:8000/ws/${clientIdRef.current}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const subscribe = (channel: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'subscribe',
        payload: { channel },
      }));
    }
  };

  const unsubscribe = (channel: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        payload: { channel },
      }));
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    isConnected,
    messages,
    subscribe,
    unsubscribe,
    clearMessages,
  };
}


