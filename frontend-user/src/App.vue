<script setup>
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'

const auth = useAuthStore()
const isNavExpanded = ref(false)

const toggleNav = () => {
  isNavExpanded.value = !isNavExpanded.value
}

const handleLogout = async () => {
  try {
    await auth.logout()
    isNavExpanded.value = false
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <div class="app-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-brand">
        <router-link to="/" class="brand-link">QuizVerse</router-link>
        <button class="hamburger" @click="toggleNav" :class="{ 'active': isNavExpanded }">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>

    <!-- Side Navigation -->
    <div class="side-nav" :class="{ 'expanded': isNavExpanded }">
      <div class="nav-content">
        <div class="nav-links">
          <router-link to="/" @click="isNavExpanded = false">Home</router-link>
          <router-link v-if="auth.user" to="/dashboard" @click="isNavExpanded = false">Dashboard</router-link>
          <router-link v-if="auth.user" to="/quizzes" @click="isNavExpanded = false">Quizzes</router-link>
          <router-link v-if="auth.user" to="/lobbies" @click="isNavExpanded = false">Lobbies</router-link>
          <router-link v-if="auth.user" to="/my-attempts" @click="isNavExpanded = false">My Attempts</router-link>
          <router-link v-if="auth.user" to="/my-quizzes" @click="isNavExpanded = false">My Quizzes</router-link>
          <router-link v-if="auth.user" to="/my-lobbies" @click="isNavExpanded = false">My Lobbies</router-link>
          <router-link v-if="auth.user" to="/bookmarked-quizzes" @click="isNavExpanded = false">Bookmarked</router-link>
          <router-link v-if="auth.user" to="/profile" @click="isNavExpanded = false">Profile</router-link>
        </div>

        <div class="auth-links">
          <template v-if="auth.user">
            <span class="welcome-message">Welcome, {{ auth.user.displayName || auth.user.email }}!</span>
            <button @click="handleLogout" class="btn-logout">Logout</button>
          </template>
          <template v-else>
            <router-link to="/auth" @click="isNavExpanded = false">Login / Sign Up</router-link>
          </template>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div class="overlay" :class="{ 'active': isNavExpanded }" @click="isNavExpanded = false"></div>

    <!-- Page Content -->
    <router-view />

    <!-- Footer -->
    <footer class="footer">
      <p>© 2025 QuizVerse. All rights reserved.</p>
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(124, 58, 237, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}

.nav-brand {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.brand-link {
  text-decoration: none;
  color: #4c1d95;
  font-weight: 700;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.brand-link:hover {
  color: #7c3aed;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 21px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;
}

.hamburger span {
  width: 100%;
  height: 3px;
  background: #4c1d95;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.hamburger.active span:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}

/* Side Navigation */
.side-nav {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 4px 0 30px rgba(124, 58, 237, 0.1);
  z-index: 1001;
  transition: left 0.3s ease;
  overflow-y: auto;
}

.side-nav.expanded {
  left: 0;
}

.nav-content {
  padding: 5rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-links a {
  text-decoration: none;
  color: #4c1d95;
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-links a::before {
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

.nav-links a:hover {
  color: white;
  transform: translateX(5px);
}

.nav-links a:hover::before {
  opacity: 1;
}

.auth-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
}

.welcome-message {
  color: #4c1d95;
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.8rem 1.2rem;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 8px;
  text-align: center;
}

.btn-logout {
  padding: 0.8rem 1.5rem;
  border: none;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1.05rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
  font-family: 'Outfit', sans-serif;
  width: 100%;
  text-align: center;
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
}

.auth-links a {
  text-decoration: none;
  color: #7c3aed;
  font-weight: 500;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(124, 58, 237, 0.1);
  font-size: 1.05rem;
  text-align: center;
}

.auth-links a:hover {
  background: #7c3aed;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
}

/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.overlay.active {
  opacity: 1;
  visibility: visible;
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
</style>