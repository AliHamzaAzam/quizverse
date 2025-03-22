import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/axios';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();
    const user = ref(null);
    const error = ref(null);
    const isAuthenticated = computed(() => !!user.value);

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
            return !!user.value;
        } catch {
            user.value = null;
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
            user.value = null;
            router.push('/');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const clearError = () => {
        error.value = null;
    };

    const setUser = (userData) => {
        user.value = userData;
    };

    const fetchCurrentUser = async () => {
        try {
            const { data } = await api.get('/api/auth/me');
            user.value = data.user;
            return data.user;
        } catch (err) {
            console.error('Failed to fetch current user:', err);
            return null;
        }
    };

    return {
        user,
        error,
        isAuthenticated,
        signup,
        login,
        checkAuth,
        logout,
        clearError,
        setUser,
        fetchCurrentUser
    };
});