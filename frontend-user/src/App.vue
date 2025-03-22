<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="app-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <router-link to="/">Home</router-link>
      <router-link v-if="auth.user" to="/dashboard">Dashboard</router-link>

      <div class="auth-links">
        <template v-if="auth.user">
          <button @click="auth.logout">Logout</button>
        </template>
        <template v-else>
          <router-link to="/auth">Login / Sign Up</router-link>
        </template>
      </div>
    </nav>

    <!-- Page Content -->
    <router-view />

    <!-- Footer -->
    <footer class="footer">
      <p>© 2025 QuizVerse. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #f8f8f8;
  border-bottom: 1px solid #ddd;
}

.navbar a {
  margin-right: 1rem;
  text-decoration: none;
  color: #333;
}

.navbar button {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #4361ee;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.navbar button:hover {
  background-color: #3a56d4;
}

.footer {
  margin-top: 3rem;
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #ddd;
  color: #888;
}
</style>