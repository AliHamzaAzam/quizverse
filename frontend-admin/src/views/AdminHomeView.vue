<template>
  <div class="view-container admin-layout">
    <aside class="admin-sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <ul>
          <li><router-link to="/admin" class="nav-link">Dashboard</router-link></li>
          <li><router-link to="/admin/users" class="nav-link">Users</router-link></li>
          <!-- Add more admin navigation items here -->
        </ul>
      </nav>
    </aside>
    <main class="admin-content">
      <header class="admin-header">
        <h1>QuizVerse Admin</h1>
        <div class="admin-user">
          <span>{{ user?.name || 'Admin' }}</span>
          <button @click="logout" class="btn-logout">Logout</button>
        </div>
      </header>
      <div class="admin-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const user = computed(() => auth.user);

const logout = () => {
  auth.logout();
  router.push('/auth');
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 220px;
  background-color: var(--bg-end);
  color: #fff;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-pixel);
}

.admin-sidebar h2 {
  margin-bottom: 2rem;
  font-size: 1.2rem;
  text-transform: uppercase;
}

.admin-sidebar ul {
  list-style: none;
  padding: 0;
  width: 100%;
}

.admin-sidebar li {
  margin-bottom: 1rem;
}

.admin-sidebar .nav-link {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.5rem 0;
  color: #fff;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.admin-sidebar .nav-link:hover {
  background-color: var(--bg-mid);
}

.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-family: var(--font-pixel);
}

.admin-header h1 {
  margin: 0;
  color: var(--bg-end);
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-logout {
  padding: 0.5rem 1rem;
  font-family: var(--font-pixel);
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #d62828;
}

.admin-container {
  flex: 1;
  padding: 2rem;
  background: transparent;
}
</style>