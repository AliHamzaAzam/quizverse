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
    // Assuming the backend route is /api/attempts/my
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

// Function to format date (optional)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString(); // More detailed date/time
};
</script>

<template>
  <div class="my-attempts-container">
    <h1>My Quiz Attempts</h1>

    <div v-if="isLoading" class="loading">Loading attempts...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!isLoading && !error && attempts.length > 0" class="attempts-list">
      <div v-for="attempt in attempts" :key="attempt._id" class="attempt-card">
        <h2>{{ attempt.quiz?.title || 'Quiz Title Missing' }}</h2>
        <p class="score">Score: {{ attempt.score }} / {{ attempt.quiz?.questions?.length || 'N/A' }}</p>
        <p class="date">Completed: {{ formatDate(attempt.completedAt) }}</p>
        <!-- Optional: Link to view the specific quiz or detailed results -->
        <router-link v-if="attempt.quiz?._id" :to="`/quizzes/${attempt.quiz._id}`" class="btn btn-details">View Quiz</router-link>
        <!-- <router-link :to="`/attempts/${attempt._id}`" class="btn btn-details">View Details</router-link> -->
      </div>
    </div>

    <div v-if="!isLoading && !error && attempts.length === 0" class="no-attempts">
      You haven't attempted any quizzes yet.
      <router-link to="/quizzes">Find a quiz to take!</router-link>
    </div>
  </div>
</template>

<style scoped>
.my-attempts-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.loading, .error-message, .no-attempts {
  text-align: center;
  padding: 1.5rem;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.error-message {
  color: #c62828;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
}

.no-attempts {
    color: #555;
}
.no-attempts a {
    color: #4361ee;
    text-decoration: underline;
    margin-left: 0.5rem;
}

.attempts-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.attempt-card {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.attempt-card h2 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
  color: #333;
}

.score {
  font-size: 1.1rem;
  font-weight: bold;
  color: #4361ee;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 1rem;
}

.btn-details {
  margin-top: auto; /* Push button to bottom */
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  background-color: #e9ecef;
  color: #333;
  border: 1px solid #ced4da;
  align-self: flex-start; /* Align button left */
}

.btn-details:hover {
  background-color: #dee2e6;
}
</style>
