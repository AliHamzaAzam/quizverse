import { io } from 'socket.io-client';

// Use the VITE_API_BASE_URL from environment variables, fallback to localhost
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true, // Send cookies with the connection request
      autoConnect: false, // Don't connect automatically, wait for explicit connect()
      // Add other options if needed, e.g., transports: ['websocket']
    });

    // Optional: Add global listeners for debugging or connection status
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = () => {
  const s = getSocket();
  if (s.connected) {
    s.disconnect();
  }
  socket = null; // Allow re-creation on next getSocket call if needed
};
