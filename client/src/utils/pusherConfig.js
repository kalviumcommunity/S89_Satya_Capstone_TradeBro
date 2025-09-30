// Enable Pusher for real-time notifications
export const PUSHER_ENABLED = true;

export const pusherConfig = {
  key: import.meta.env.VITE_PUSHER_KEY,
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  encrypted: true,
  authEndpoint: '/api/pusher/auth'
};