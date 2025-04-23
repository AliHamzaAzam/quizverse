import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/axios';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();
    const user = ref(null);
    const error = ref(null);
    const isAuthenticated = computed(() => !!user.value);
    const bookmarkedQuizIds = computed(() => user.value?.bookmarkedQuizzes || []);

    const signup = async (formData) => {
        try {
            error.value = null;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                error.value = data.message || 'Signup failed';
                return;
            }

            user.value = data.user;
            router.push('/dashboard');
        } catch (err) {
            error.value = 'An error occurred during signup';
            console.error('Signup error:', err);
        }
    };

    const login = async (credentials) => {
        // console.log('User try data:');
        try {
            const { data } = await api.post('/api/auth/login', credentials);
            // console.log('User try data:', data);
            user.value = data.user;
            router.push('/dashboard');
        } catch (err) {
            error.value = err.response?.data?.message || 'Login failed';
        }
    };

    const checkAuth = async () => {
        // console.log('User try auth:');
        try {
            const { data } = await api.get('/api/auth/me');
            // console.log('User data:', data);
            user.value = data.user;
            return !!user.value;
        } catch (err) { // Add err parameter to catch block
            // console.log('User data:', data); // Removed: data is not defined here
            // console.error('Check auth failed:', err); // Log the actual error
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

    const updateProfile = async (formData) => {
        try {
            const { data } = await api.patch('/api/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            user.value = data.user;
            error.value = null;
        } catch (err) {
            console.error('Profile update error:', err);
            error.value = err.response?.data?.message || 'Failed to update profile';
            throw new Error(error.value);
        }
    };

    const addBookmark = async (quizId) => {
        if (!user.value) return;
        try {
            await api.post(`/api/profile/bookmarks/${quizId}`);
            if (user.value.bookmarkedQuizzes && !user.value.bookmarkedQuizzes.includes(quizId)) {
                user.value.bookmarkedQuizzes.push(quizId);
            }
        } catch (err) {
            console.error('Failed to add bookmark:', err);
            throw new Error(err.response?.data?.message || 'Failed to add bookmark');
        }
    };

    const removeBookmark = async (quizId) => {
        if (!user.value) return;
        try {
            await api.delete(`/api/profile/bookmarks/${quizId}`);
            if (user.value.bookmarkedQuizzes) {
                user.value.bookmarkedQuizzes = user.value.bookmarkedQuizzes.filter(id => id !== quizId);
            }
        } catch (err) {
            console.error('Failed to remove bookmark:', err);
            throw new Error(err.response?.data?.message || 'Failed to remove bookmark');
        }
    };

    return {
        user,
        error,
        isAuthenticated,
        bookmarkedQuizIds,
        signup,
        login,
        checkAuth,
        logout,
        clearError,
        setUser,
        fetchCurrentUser,
        updateProfile,
        addBookmark,
        removeBookmark
    };
});