<template>
  <div class="dashboard-container">
    <h1>Admin Dashboard</h1>
    <div v-if="isLoading" class="loading">Loading stats...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="!isLoading && !error && stats" class="stats-grid">
      <div class="stat-card">
        <h2>Total Users</h2>
        <p>{{ stats.userCount }}</p>
      </div>
      <div class="stat-card">
        <h2>Admin Users</h2>
        <p>{{ stats.adminCount }}</p>
      </div>
      <!-- Add more stat cards as needed -->
      <div class="stat-card">
        <h2>Total Quizzes</h2>
        <p>{{ stats.quizCount }}</p>
      </div>
      <div class="stat-card">
        <h2>Total Attempts</h2>
        <p>{{ stats.attemptCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios'; // Use the configured axios instance

const stats = ref(null);
const isLoading = ref(true);
const error = ref(null);

const fetchStats = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/admin/stats');
    stats.value = data;
  } catch (err) {
    console.error('Failed to load stats:', err);
    error.value = err.response?.data?.message || 'Failed to load dashboard statistics.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchStats);
</script>

<style scoped>
.dashboard-container {
  padding: 2rem;
}

h1 {
  margin-bottom: 1.5rem;
}

.loading, .error-message {
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  color: #6c757d;
}

.stat-card p {
  font-size: 2rem;
  font-weight: bold;
  color: #343a40;
  margin: 0;
}
</style>