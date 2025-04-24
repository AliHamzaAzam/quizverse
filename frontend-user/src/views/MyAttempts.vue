<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios';

const attempts = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchMyAttempts = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/attempts/my');
    attempts.value = data;
  } catch (err) {
    console.error('Failed to fetch attempts:', err);
    error.value = 'Could not load your attempts.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchMyAttempts);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};
</script>

<template>
  <div class="view-container">
    <div class="attempts-wrapper">
      <h1>My Quiz Attempts</h1>

      <div v-if="isLoading" class="loading">Loading attempts...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="!isLoading && !error && attempts.length > 0" class="attempts-list">
        <div v-for="attempt in attempts" :key="attempt._id" class="attempt-card">
          <h2>{{ attempt.quiz?.title || 'Quiz Title Missing' }}</h2>
          <p class="score">Score: {{ attempt.score }} / {{ attempt.quiz?.questions?.length || 'N/A' }}</p>
          <p class="date">Completed: {{ formatDate(attempt.createdAt) }}</p>
          <router-link v-if="attempt.quiz?._id" :to="`/quizzes/${attempt.quiz._id}`" class="action-link">
            View Quiz
          </router-link>
        </div>
      </div>

      <div v-if="!isLoading && !error && attempts.length === 0" class="no-attempts">
        You haven't attempted any quizzes yet.
        <router-link to="/quizzes" class="action-link">Find a quiz to take!</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: 2rem;
  background: transparent;
}

.attempts-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  color: var(--bg-end);
}

.loading,
.error-message,
.no-attempts {
  text-align: center;
  font-size: 1rem;
  margin-top: 1rem;
  color: var(--text);
}

.error-message {
  background-color: #ffe5e5;
  padding: 1rem;
  border: 1px solid #ffcccc;
  border-radius: 0.5rem;
  color: var(--text);
}

.no-attempts .action-link {
  margin-left: 0.5rem;
}

.attempts-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.attempt-card {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.attempt-card h2 {
  margin: 0;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
  color: var(--bg-end);
}

.score {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: 1rem;
}

.action-link {
  align-self: flex-start;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid var(--bg-end);
  color: var(--bg-end);
  transition: background-color 0.2s, color 0.2s;
}

.action-link:hover {
  background-color: var(--bg-end);
  color: #fff;
}
</style>
