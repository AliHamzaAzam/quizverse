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

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <ul>
          <li>
            <router-link to="/admin">Dashboard</router-link>
          </li>
          <li>
            <router-link to="/admin/users">Users</router-link>
          </li>
          <!-- Add more admin navigation items here -->
        </ul>
      </nav>
    </aside>
    <main class="admin-content">
      <header class="admin-header">
        <h1>QuizVerse Admin</h1>
        <div class="admin-user">
          <span>{{ user?.name || 'Admin' }}</span>
          <button @click="logout">Logout</button>
        </div>
      </header>
      <div class="admin-container">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 250px;
  background-color: #1a1a2e;
  color: white;
  padding: 1rem;
}

.admin-sidebar h2 {
  margin-bottom: 2rem;
  text-align: center;
}

.admin-sidebar ul {
  list-style: none;
  padding: 0;
}

.admin-sidebar li {
  margin-bottom: 0.5rem;
}

.admin-sidebar a {
  display: block;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  border-radius: 4px;
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
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-container {
  flex: 1;
  padding: 2rem;
  background-color: #f5f5f5;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-user button {
  padding: 0.5rem 1rem;
  background-color: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>