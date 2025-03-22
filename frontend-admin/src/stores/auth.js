import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/axios';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();
    const user = ref(null);
    const error = ref(null);
    const isLoading = ref(false);

    // Add admin role checking
    const isAdmin = computed(() => user.value?.role === 'admin');
    const isAuthenticated = computed(() => !!user.value);

    const signup = async (credentials) => {
        try {
            isLoading.value = true;
            const { data } = await api.post('/api/auth/signup', credentials);
            user.value = data.user;

            // Only redirect if user is admin
            if (isAdmin.value) {
                router.push('/dashboard');
            } else {
                error.value = 'Access denied. Admin privileges required.';
                logout();
            }
        } catch (err) {
            error.value = err.response?.data?.message || 'Signup failed';
        } finally {
            isLoading.value = false;
        }
    };

    const login = async (credentials) => {
        try {
            isLoading.value = true;
            const { data } = await api.post('/api/auth/login', credentials);
            user.value = data.user;

            // Only redirect if user is admin
            if (isAdmin.value) {
                router.push('/dashboard');
            } else {
                error.value = 'Access denied. Admin privileges required.';
                logout();
            }
        } catch (err) {
            error.value = err.response?.data?.message || 'Login failed';
        } finally {
            isLoading.value = false;
        }
    };

    const checkAuth = async () => {
        try {
            isLoading.value = true;
            const { data } = await api.get('/api/auth/me');
            user.value = data.user;

            // Redirect non-admins away from admin interface
            if (user.value && !isAdmin.value) {
                error.value = 'Access denied. Admin privileges required.';
                logout();
            }

            return data.user;
        } catch {
            user.value = null;
            return null;
        } finally {
            isLoading.value = false;
        }
    };

    const logout = async () => {
        try {
            isLoading.value = true;
            await api.post('/api/auth/logout');
            user.value = null;
            router.push('/login');
        } catch (err) {
            error.value = err.response?.data?.message || 'Logout failed';
        } finally {
            isLoading.value = false;
        }
    };

    return {
        user,
        error,
        isLoading,
        isAdmin,
        isAuthenticated,
        signup,
        login,
        checkAuth,
        logout
    };
});