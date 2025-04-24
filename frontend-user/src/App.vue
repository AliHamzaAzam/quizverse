<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
const auth = useAuthStore()
const router = useRouter()

// Ensure default route to Home on initial load
if (router.currentRoute.value.path === '') {
  router.replace({ path: '/' })
}
</script>

<template>
  <div class="app-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link v-if="auth.user" to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link v-if="auth.user" to="/quizzes" class="nav-link">Quizzes</router-link>
        <router-link v-if="auth.user" to="/my-attempts" class="nav-link">My Attempts</router-link>
        <router-link v-if="auth.user" to="/my-quizzes" class="nav-link">My Quizzes</router-link>
        <router-link v-if="auth.user" to="/bookmarked-quizzes" class="nav-link">Bookmarked</router-link>
        <router-link v-if="auth.user" to="/profile" class="nav-link">Profile</router-link>
      </div>
      <div class="auth-links">
        <template v-if="auth.user">
          <span class="welcome-message">Welcome, {{ auth.user.displayName || auth.user.email }}!</span>
          <button @click="auth.logout" class="btn-logout">Logout</button>
        </template>
        <template v-else>
          <router-link to="/auth" class="nav-link">Login / Sign Up</router-link>
        </template>
      </div>
    </nav>

    <!-- Page Content -->
    <router-view class="view-content" />

    <!-- Footer -->
    <footer class="footer">
      <p>© 2025 QuizVerse. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: var(--font-pixel);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: var(--text);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--bg-end);
}

.auth-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-message {
  color: var(--text);
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: var(--font-pixel);
}

.btn-logout:hover {
  background: #d62828;
}

.view-content {
  flex: 1;
}

.footer {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  font-family: var(--font-pixel);
  color: var(--text);
  border-top: 1px solid rgba(0,0,0,0.1);
}
</style>
