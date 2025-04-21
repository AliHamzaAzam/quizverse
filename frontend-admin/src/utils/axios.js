import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001', // Your backend API URL
  withCredentials: true, // Important for sending cookies
});

// Optional: Add interceptors for request/response handling (e.g., error handling)
api.interceptors.response.use(
  response => response,
  error => {
    // Handle errors globally if needed
    console.error('API Error:', error.response || error.message);
    // Example: Redirect to login on 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Maybe trigger logout action in auth store
      // import { useAuthStore } from '@/stores/auth'; // Be careful with imports outside setup
      // const authStore = useAuthStore();
      // authStore.logout();
      // Or simply redirect
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;