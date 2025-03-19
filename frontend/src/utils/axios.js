import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001',
    withCredentials: true, // this ensures cookies are sent along with requests
});

export default api;