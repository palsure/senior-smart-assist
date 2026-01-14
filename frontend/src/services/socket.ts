import io from "socket.io-client";

// Safe Platform check
const getPlatformOS = (): string => {
  try {
    const { Platform } = require('react-native');
    if (Platform && Platform.OS) {
      return Platform.OS;
    }
  } catch (e) {
    // Platform not available
  }
  return 'android'; // Default fallback
};

const getSocketURL = () => {
  // Check for environment variable (production/Docker/containerized environments)
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  
  // Check for Vercel environment variable
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  try {
    if (getPlatformOS() === 'web') {
      // In production (Vercel), use environment variable or default to localhost for development
      return process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:5000";
    }
  } catch (e) {
    // Fall through to default
  }
  // For mobile, use your machine's IP address or 10.0.2.2 for Android emulator
  return "http://10.0.2.2:5000"; // Change to your IP for physical device
};

// Lazy socket creation to avoid module load time issues
let _socket: any = null;
const getSocket = () => {
  try {
    if (!_socket) {
      const url = getSocketURL();
      _socket = io(url, {
        autoConnect: false, // Don't auto-connect to avoid blocking
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      // Handle connection errors gracefully
      _socket.on('connect_error', (error: Error) => {
        console.warn('Socket connection error:', error.message);
        console.warn('Make sure the backend server is running on port 5000');
      });

      _socket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      _socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
      });

      // Try to connect asynchronously
      setTimeout(() => {
        try {
          _socket.connect();
        } catch (e) {
          console.warn('Socket connect error:', e);
        }
      }, 100);
    }
    return _socket;
  } catch (error) {
    console.error('Error creating socket:', error);
    // Return a mock socket object to prevent crashes
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      connect: () => {},
      disconnect: () => {},
      connected: false
    };
  }
};

// Export socket with lazy initialization
export const socket = new Proxy({} as any, {
  get: (target, prop) => {
    const socketInstance = getSocket();
    const value = socketInstance[prop];
    // Bind methods to the socket instance
    if (typeof value === 'function') {
      return value.bind(socketInstance);
    }
    return value;
  }
});

export interface AssignedData {
  request_id: number;
  volunteer_id: number;
  volunteer_name: string;
  volunteer_address?: string;
  match_score?: number;
  match_breakdown?: any;
}

