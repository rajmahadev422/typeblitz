import { io } from 'socket.io-client';

// In dev, Vite proxies /socket.io to the Node server. In production set VITE_SERVER_URL if the API lives elsewhere.
export const socket = io(import.meta.env.VITE_SERVER_URL || '/', { transports: ['websocket', 'polling'] });
