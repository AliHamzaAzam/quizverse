<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="app-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div>
        <router-link to="/">Home</router-link>
        <router-link v-if="auth.user" to="/dashboard">Dashboard</router-link>
        <!-- Add new links for authenticated users -->
        <router-link v-if="auth.user" to="/quizzes">Quizzes</router-link>
        <router-link v-if="auth.user" to="/lobbies">Lobbies</router-link> <!-- Add Lobbies link -->
        <router-link v-if="auth.user" to="/my-attempts">My Attempts</router-link>
        <router-link v-if="auth.user" to="/my-quizzes">My Quizzes</router-link> <!-- Add My Quizzes link -->
        <router-link v-if="auth.user" to="/my-lobbies">My Lobbies</router-link> <!-- Add My Lobbies link -->
        <router-link v-if="auth.user" to="/bookmarked-quizzes">Bookmarked</router-link> <!-- Add Bookmarked Quizzes link -->
        <router-link v-if="auth.user" to="/profile">Profile</router-link>
      </div>

      <div class="auth-links">
        <!-- Show user info and logout if logged in -->
        <template v-if="auth.user">
          <span class="welcome-message">Welcome, {{ auth.user.displayName || auth.user.email }}!</span>
          <button @click="auth.logout" class="btn-logout">Logout</button>
        </template>
        <!-- Show login/signup link if not logged in -->
        <template v-else>
          <router-link to="/auth">Login / Sign Up</router-link>
        </template>
      </div>
    </nav>

    <!-- Page Content -->
    <router-view />

    <!-- Footer -->
    <footer class="footer">
      <p>© 2025 QuizVerse. All rights reserved.</p> <!-- Added footer content -->
    </footer>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Vertically align items */
  padding: 1rem 2rem;
  background-color: #f8f8f8;
  border-bottom: 1px solid #ddd;
}

.navbar div:first-child a { /* Target links in the first div */
  margin-right: 1rem;
  text-decoration: none;
  color: #333;
  transition: color 0.2s;
}
.navbar div:first-child a:hover {
  color: #4361ee;
}

.auth-links {
  display: flex;
  align-items: center;
  gap: 1rem; /* Space between items */
}

.welcome-message {
  color: #555;
}

.btn-logout {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #e63946; /* Logout button color */
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: #d62828;
}

.auth-links a {
  text-decoration: none;
  color: #4361ee;
}
.auth-links a:hover {
  text-decoration: underline;
}

.footer {
  margin-top: 3rem;
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #ddd;
  color: #888;
}
</style>