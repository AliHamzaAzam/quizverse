<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const sidebarExpanded = ref(window.innerWidth > 768);
const isMobile = ref(window.innerWidth <= 768);

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value;
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  sidebarExpanded.value = !isMobile.value;
};

onMounted(() => {
  authStore.checkAuth();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

watch(() => route.path, () => {
  if (isMobile.value) {
    sidebarExpanded.value = false;
  }
});
</script>

<template>
  <div class="app-container">
    <!-- Admin Sidebar - Only visible when authenticated as admin -->
    <aside v-if="authStore.isAuthenticated && authStore.isAdmin" class="sidebar" :class="{ 'sidebar-expanded': sidebarExpanded }">
      <div class="sidebar-header">
        <h1 v-if="sidebarExpanded">QuizVerse Admin</h1>
        <h1 v-else>QV</h1>
        <button @click="toggleSidebar" class="toggle-btn">
          {{ sidebarExpanded ? '«' : '»' }}
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item">
          <span class="nav-icon">📊</span>
          <span v-if="sidebarExpanded" class="nav-text">Dashboard</span>
        </router-link>
        <router-link to="/users" class="nav-item">
          <span class="nav-icon">👥</span>
          <span v-if="sidebarExpanded" class="nav-text">Users</span>
        </router-link>
        <router-link to="/quizzes" class="nav-item">
          <span class="nav-icon">📝</span>
          <span v-if="sidebarExpanded" class="nav-text">Quizzes</span>
        </router-link>
        <router-link to="/reports" class="nav-item">
          <span class="nav-icon">📈</span>
          <span v-if="sidebarExpanded" class="nav-text">Reports</span>
        </router-link>
        <router-link to="/settings" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span v-if="sidebarExpanded" class="nav-text">Settings</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="authStore.logout" class="logout-btn">
          <span class="nav-icon">🚪</span>
          <span v-if="sidebarExpanded">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'main-expanded': !sidebarExpanded || !authStore.isAuthenticated }">
      <!-- Top bar for mobile -->
      <div v-if="authStore.isAuthenticated && authStore.isAdmin && isMobile" class="mobile-topbar">
        <button @click="toggleSidebar" class="mobile-toggle">
          ☰
        </button>
        <h2>QuizVerse Admin</h2>
      </div>

      <!-- Router View -->
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  background-color: #1a1a2e;
  color: white;
  width: 80px;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar-expanded {
  width: 250px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #2d2d42;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  color: #ddd;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-icon {
  font-size: 1.2rem;
  min-width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #2d2d42;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: #ddd;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background-color: #e63946;
  color: white;
  border-radius: 4px;
}

.main-content {
  flex: 1;
  margin-left: 80px;
  padding: 2rem;
  background-color: #f5f5f5;
  transition: margin-left 0.3s ease;
}

.main-expanded {
  margin-left: 0;
}

.sidebar-expanded + .main-content {
  margin-left: 250px;
}

.mobile-topbar {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 250px;
  }

  .sidebar-expanded {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
    padding-top: 5rem;
  }

  .mobile-topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #1a1a2e;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    z-index: 90;
  }

  .mobile-toggle {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
  }
}
</style>