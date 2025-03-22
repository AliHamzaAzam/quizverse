import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false, title: 'Admin Login' }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin Dashboard' }
    },
    // {
    //     path: '/users',
    //     name: 'Users',
    //     component: () => import('@/views/UsersView.vue'),
    //     meta: { requiresAuth: true, requiresAdmin: true, title: 'Manage Users' }
    // },
    // {
    //     path: '/quizzes',
    //     name: 'Quizzes',
    //     component: () => import('@/views/QuizzesView.vue'),
    //     meta: { requiresAuth: true, requiresAdmin: true, title: 'Manage Quizzes' }
    // },
    // {
    //     path: '/reports',
    //     name: 'Reports',
    //     component: () => import('@/views/ReportsView.vue'),
    //     meta: { requiresAuth: true, requiresAdmin: true, title: 'Analytics & Reports' }
    // },
    // {
    //     path: '/settings',
    //     name: 'Settings',
    //     component: () => import('@/views/SettingsView.vue'),
    //     meta: { requiresAuth: true, requiresAdmin: true, title: 'System Settings' }
    // },
    // {
    //     path: '/:pathMatch(.*)*',
    //     name: 'NotFound',
    //     component: () => import('@/views/NotFoundView.vue'),
    //     meta: { title: 'Page Not Found' }
    // }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    document.title = `QuizVerse Admin - ${to.meta.title || 'Admin Portal'}`;

    try {
        // Check authentication status if store doesn't have user data
        if (!authStore.user) {
            await authStore.checkAuth();
        }

        if (to.meta.requiresAuth && !authStore.isAuthenticated) {
            // Redirect to login if authentication is required but user is not authenticated
            return next('/login');
        } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
            // Redirect to login if admin role is required but user is not admin
            // authStore.error = 'Access denied. Admin privileges required.';
            return next('/login');
        } else if (to.path === '/login' && authStore.isAuthenticated && authStore.isAdmin) {
            // Redirect to dashboard if already logged in as admin
            return next('/dashboard');
        }

        next();
    } catch (error) {
        console.error('Navigation guard error:', error);
        next('/login');
    }
});

export default router;