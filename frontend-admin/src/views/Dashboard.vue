<template>
  <div class="dashboard-container">
    <h1>Admin Dashboard</h1>
    <div v-if="isLoading" class="status-message">Loading stats...</div>
    <div v-if="error" class="status-message error">{{ error }}</div>
    <div v-if="!isLoading && !error && stats" class="stats-grid">
      <div class="stat-card">
        <h2>Total Users</h2>
        <p>{{ stats.userCount }}</p>
      </div>
      <div class="stat-card">
        <h2>Admin Users</h2>
        <p>{{ stats.adminCount }}</p>
      </div>
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
import api from '@/utils/axios';

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
  background: rgba(255,255,255,0.85);
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-family: var(--font-pixel);
}

h1 {
  text-align: center;
  color: var(--bg-end);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.status-message {
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
  color: var(--text);
  font-family: var(--font-pixel);
}
.status-message.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  border-radius: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255,255,255,0.9);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  font-family: var(--font-pixel);
}

.stat-card h2 {
  margin: 0;
  margin-bottom: 0.5rem;
  color: var(--bg-mid);
  font-size: 1.1rem;
}

.stat-card p {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: var(--text);
}
</style>