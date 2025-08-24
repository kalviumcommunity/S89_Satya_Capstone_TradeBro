// Disable Pusher in production to prevent 404 errors
export const PUSHER_ENABLED = false;

export const pusherConfig = {
  key: import.meta.env.VITE_PUSHER_KEY,
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  encrypted: true,
  authEndpoint: '/api/pusher/auth'
};