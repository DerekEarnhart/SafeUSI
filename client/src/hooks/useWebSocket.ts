import { useEffect, useState, useRef } from 'react';
import { type WebSocketMessage } from '@shared/schema';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      // Ensure we only attempt connection in browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Clear any pending reconnect attempts
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Only warn about truly unknown message types - silent handling for known types
          const knownTypes = [
            'wsm_metrics', 'component_status', 'processing_stats', 'rsis_status', 
            'agent_status', 'vm_status', 'task_queue', 'benchmarking_status', 
            'evaluation_results', 'vm_benchmarking', 'code_execution'
          ];
          
          // Debug logging for message processing
          if (knownTypes.includes(message.type)) {
            console.debug(`WebSocket: Received ${message.type} message`);
          } else {
            console.warn('Unknown message type:', message);
          }
          
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        // Don't throw errors - just log them
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
      
      // Retry connection after 5 seconds on error - but don't throw
      reconnectTimeout.current = setTimeout(() => {
        try {
          connect();
        } catch (retryError) {
          console.error('WebSocket retry failed:', retryError);
        }
      }, 5000);
    }
  };

  useEffect(() => {
    // Delay initial connection to avoid blocking render
    const connectTimer = setTimeout(() => {
      try {
        connect();
      } catch (error) {
        console.error('Initial WebSocket connection failed:', error);
        // Don't throw - just set disconnected state
        setIsConnected(false);
      }
    }, 100);

    return () => {
      clearTimeout(connectTimer);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        try {
          ws.current.close();
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
