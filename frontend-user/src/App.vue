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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  font-family: 'Outfit', sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 3rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(124, 58, 237, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}

.navbar div:first-child {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.navbar div:first-child a {
  text-decoration: none;
  color: #4c1d95;
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.navbar div:first-child a::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.navbar div:first-child a:hover {
  color: white;
  transform: translateY(-2px);
}

.navbar div:first-child a:hover::before {
  opacity: 1;
}

.auth-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.welcome-message {
  color: #4c1d95;
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.6rem 1.2rem;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 8px;
}

.btn-logout {
  padding: 0.7rem 1.5rem;
  border: none;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1.05rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
  position: relative;
  overflow: hidden;
}

.btn-logout::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
}

.btn-logout:hover::before {
  left: 100%;
}

.auth-links a {
  text-decoration: none;
  color: #7c3aed;
  font-weight: 500;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(124, 58, 237, 0.1);
  font-size: 1.05rem;
}

.auth-links a:hover {
  background: #7c3aed;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
}

.footer {
  margin-top: auto;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(124, 58, 237, 0.1);
  color: #4c1d95;
  font-size: 1rem;
  font-weight: 500;
}

:root {
  --primary-color: #7c3aed;
  --primary-hover: #6d28d9;
  --text-primary: #4c1d95;
  --text-secondary: #5b21b6;
  --background-light: #f5f3ff;
  --white: #ffffff;
  --shadow-sm: 0 4px 6px rgba(124, 58, 237, 0.1);
  --shadow-md: 0 8px 15px rgba(124, 58, 237, 0.15);
  --transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .navbar div:first-child {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .auth-links {
    flex-direction: column;
    width: 100%;
    gap: 1rem;
  }

  .btn-logout, .auth-links a {
    width: 100%;
    text-align: center;
  }

  .welcome-message {
    text-align: center;
    width: 100%;
  }
}
</style>