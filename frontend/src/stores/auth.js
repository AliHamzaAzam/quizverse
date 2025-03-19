import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/utils/axios';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();
    const user = ref(null);
    const error = ref(null);

    const signup = async (credentials) => {
        try {
            const { data } = await api.post('/api/auth/signup', credentials);
            user.value = data.user;
            router.push('/dashboard');
        } catch (err) {
            error.value = err.response?.data?.message || 'Signup failed';
        }
    };

    const login = async (credentials) => {
        try {
            const { data } = await api.post('/api/auth/login', credentials);
            user.value = data.user;
            router.push('/dashboard');
        } catch (err) {
            error.value = err.response?.data?.message || 'Login failed';
        }
    };

    const checkAuth = async () => {
        try {
            const { data } = await api.get('/api/auth/me');
            user.value = data.user;
        } catch {
            user.value = null;
        }
    };

    return { user, error, signup, login, checkAuth };
});