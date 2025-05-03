import { createRouter, createWebHistory } from 'vue-router'
import AuthForm from '@/components/AuthForm.vue'
import Dashboard from '@/views/Dashboard.vue'
import Home from '@/views/Home.vue'
// Import new views
import Profile from '@/views/Profile.vue'
import QuizList from '@/views/QuizList.vue'
import QuizDetail from '@/views/QuizDetail.vue' 
import QuizAttempt from '@/views/QuizAttempt.vue' 
import MyAttempts from '@/views/MyAttempts.vue' 
import QuizForm from '@/views/QuizForm.vue' 
import MyQuizzes from '@/views/MyQuizzes.vue' 
import BookmarkedQuizzes from '@/views/BookmarkedQuizzes.vue'; 
import LobbyList from '@/views/LobbyList.vue';
import LobbyView from '@/views/LobbyView.vue';
import MyLobbies from '@/views/MyLobbies.vue'; // Import MyLobbies view

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/auth',
        name: 'Auth',
        component: AuthForm
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
    },
    {
        path: '/quizzes',
        name: 'QuizList',
        component: QuizList,
        meta: { requiresAuth: true }
    },
    // Add new routes for specific quiz actions
    {
        path: '/quizzes/new', // Route for creating a new quiz
        name: 'QuizCreate',
        component: QuizForm,
        meta: { requiresAuth: true }
    },
    {
        path: '/quizzes/:id', // Route for viewing quiz details & leaderboard
        name: 'QuizDetail',
        component: QuizDetail,
        meta: { requiresAuth: true },
        props: true // Pass route params as props
    },
     {
        path: '/quizzes/:id/edit', // Route for editing a quiz
        name: 'QuizEdit',
        component: QuizForm,
        meta: { requiresAuth: true },
        props: true
    },
    {
        path: '/quizzes/:id/attempt', // Route for taking a quiz
        name: 'QuizAttempt',
        component: QuizAttempt,
        meta: { requiresAuth: true },
        props: true
    },
    {
        path: '/my-attempts', // Route for viewing user's own attempts
        name: 'MyAttempts',
        component: MyAttempts,
        meta: { requiresAuth: true }
    },
    {
        path: '/my-quizzes', // Add route for My Quizzes
        name: 'MyQuizzes',
        component: MyQuizzes,
        meta: { requiresAuth: true }
    },
    {
        path: '/my-lobbies', // Add route for My Lobbies
        name: 'MyLobbies',
        component: MyLobbies,
        meta: { requiresAuth: true }
    },
    {
        path: '/bookmarked-quizzes', // Add route for Bookmarked Quizzes
        name: 'BookmarkedQuizzes',
        component: BookmarkedQuizzes,
        meta: { requiresAuth: true }
    },
    // Add Lobby Routes
    {
        path: '/lobbies',
        name: 'LobbyList',
        component: LobbyList,
        meta: { requiresAuth: true }
    },
    {
        path: '/lobbies/:id',
        name: 'LobbyView',
        component: LobbyView,
        meta: { requiresAuth: true },
        props: true
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// Refined route guard
import { useAuthStore } from '@/stores/auth'

router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore()

    // Check auth status if user is not loaded and the route requires auth
    // This helps maintain login state across page refreshes
    if (to.meta.requiresAuth && !auth.user) {
        const isAuthenticated = await auth.checkAuth(); // Attempt to fetch user
        if (!isAuthenticated) {
            // If checkAuth fails (returns false or throws), redirect to auth
            return next({ name: 'Auth', query: { redirect: to.fullPath } });
        }
        // If checkAuth succeeds, user is now loaded in the store, proceed
    }

    // If route requires auth and user is still not authenticated after check, redirect
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
         return next({ name: 'Auth', query: { redirect: to.fullPath } });
    }
    // If trying to access auth page while logged in, redirect to dashboard
    else if (to.name === 'Auth' && auth.isAuthenticated) {
        return next({ name: 'Dashboard' });
    }
    // Otherwise, allow navigation
    else {
        next();
    }
})

export default router