<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios'; // Use the configured axios instance
import { useAuthStore } from '@/stores/auth'; // Import auth store

const quizzes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const auth = useAuthStore(); // Get auth store instance

const fetchQuizzes = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/quizzes');
    quizzes.value = data;
  } catch (err) {
    error.value = 'Failed to load quizzes.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// Function to check if the current user created the quiz
const isCreator = (quiz) => {
    return auth.user && quiz.createdBy && auth.user._id === quiz.createdBy._id;
};

onMounted(fetchQuizzes);
</script>

<template>
  <div class="quiz-list-container">
    <h1>Available Quizzes</h1>

    <!-- Add Quiz Button -->
    <div class="add-quiz-section">
       <router-link to="/quizzes/new" class="btn-add-quiz">Create New Quiz</router-link>
    </div>


    <div v-if="isLoading" class="loading">Loading quizzes...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <ul v-if="!isLoading && !error && quizzes.length > 0" class="quiz-list">
      <li v-for="quiz in quizzes" :key="quiz._id" class="quiz-item">
        <h2>{{ quiz.title }}</h2>
        <p>{{ quiz.description }}</p>
        <p class="created-by">Created by: {{ quiz.createdBy?.displayName || 'Unknown' }}</p>
        <div class="quiz-actions">
          <router-link :to="`/quizzes/${quiz._id}/attempt`" class="btn-take">Take Quiz</router-link>
           <!-- Add link to view details/leaderboard -->
          <router-link :to="`/quizzes/${quiz._id}`" class="btn-details">View Details</router-link>
          <!-- Add Edit button only if user is the creator -->
          <router-link v-if="isCreator(quiz)" :to="`/quizzes/${quiz._id}/edit`" class="btn-edit">Edit</router-link>
        </div>
      </li>
    </ul>
     <div v-if="!isLoading && !error && quizzes.length === 0" class="no-quizzes">
        No quizzes available yet. Why not <router-link to="/quizzes/new">create one</router-link>?
    </div>
  </div>
</template>

<style scoped>
.quiz-list-container {
  max-width: 900px; /* Wider container */
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
}

.add-quiz-section {
    margin-bottom: 2rem;
    text-align: right;
}

.btn-add-quiz {
    padding: 0.75rem 1.5rem;
    background-color: #2a9d8f;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 1rem;
    transition: background-color 0.2s;
    border: none;
    cursor: pointer;
}

.btn-add-quiz:hover {
    background-color: #268c7f;
}

.loading, .error-message, .no-quizzes {
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

.no-quizzes {
    color: #555;
}
.no-quizzes a {
    color: #4361ee;
    text-decoration: underline;
}

.quiz-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
}

.quiz-item {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.quiz-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.quiz-item h2 {
  margin-top: 0;
  margin-bottom: 0.75rem; /* Increased margin */
  color: #333;
  font-size: 1.3rem; /* Slightly larger title */
}

.quiz-item p {
  color: #555;
  flex-grow: 1; /* Make description take available space */
  margin-bottom: 1rem;
  line-height: 1.5;
}

.created-by {
    font-size: 0.9rem;
    color: #777;
    margin-bottom: 1rem;
}

.quiz-actions {
  margin-top: auto; /* Push actions to the bottom */
  display: flex;
  flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
  gap: 0.75rem; /* Increased gap */
}

.quiz-actions a {
  padding: 0.6rem 1.2rem; /* Adjusted padding */
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500; /* Slightly bolder text */
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  border: none;
}

.btn-take {
  background-color: #4361ee;
  color: white;
}
.btn-take:hover {
  background-color: #3a56d4;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-details {
    background-color: #e9ecef;
    color: #333;
    border: 1px solid #ced4da;
}
.btn-details:hover {
    background-color: #dee2e6;
}

.btn-edit {
    background-color: #ffb703;
    color: #333;
}
.btn-edit:hover {
    background-color: #fca311;
}

</style>
