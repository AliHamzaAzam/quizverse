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
        <p class="date">Completed: {{ formatDate(attempt.createdAt) }}</p> 
        <router-link v-if="attempt.quiz?._id" :to="`/quizzes/${attempt.quiz._id}`" class="btn btn-details">View Quiz</router-link>
      </div>
    </div>

    <div v-if="!isLoading && !error && attempts.length === 0" class="no-attempts">
      You haven't attempted any quizzes yet.
      <router-link to="/quizzes">Find a quiz to take!</router-link>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.my-attempts-container {
  max-width: 900px;
  margin: 2.5rem auto;
  padding: 2.5rem;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.10);
  font-family: 'Outfit', sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2.5rem;
  font-weight: 800;
  color: #4c1d95;
  letter-spacing: 0.5px;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loading, .error-message, .no-attempts {
  text-align: center;
  padding: 1.5rem;
  font-size: 1.1rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.error-message {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
}

.no-attempts {
  color: #5b21b6;
  font-weight: 500;
}

.no-attempts a {
  color: #7c3aed;
  text-decoration: none;
  margin-left: 0.5rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.no-attempts a:hover {
  color: #4c1d95;
    text-decoration: underline;
}

.attempts-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.attempt-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.8rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(124, 58, 237, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.attempt-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
}

.attempt-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.4rem;
  color: #4c1d95;
  font-weight: 700;
}

.score {
  font-size: 1.2rem;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 0.8rem;
  background: rgba(124, 58, 237, 0.06);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: inline-block;
}

.date {
  font-size: 1rem;
  color: #5b21b6;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.btn-details {
  margin-top: auto;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  align-self: flex-start;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
}

.btn-details:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .my-attempts-container {
    padding: 1.5rem;
    margin: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  .attempts-list {
    grid-template-columns: 1fr;
  }

  .attempt-card {
    padding: 1.5rem;
  }

  .btn-details {
    width: 100%;
  }
}
</style>
