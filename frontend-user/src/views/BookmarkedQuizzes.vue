<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios'; // Use the configured axios instance
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Import auth store

const bookmarkedQuizzes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const router = useRouter();
const auth = useAuthStore(); // Use auth store

const fetchBookmarkedQuizzes = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Use the actual API endpoint
    const { data } = await api.get('/api/profile/bookmarks');
    bookmarkedQuizzes.value = data; // The endpoint returns the populated quizzes
  } catch (err) {
    console.error('Failed to fetch bookmarked quizzes:', err);
    error.value = err.response?.data?.message || 'Could not load your bookmarked quizzes. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const goToQuiz = (quizId) => {
  router.push({ name: 'QuizDetail', params: { id: quizId } });
};

// Use the auth store action to remove bookmark
const handleRemoveBookmark = async (quizId) => {
    try {
        await auth.removeBookmark(quizId);
        // Remove from the local list displayed on this page
        bookmarkedQuizzes.value = bookmarkedQuizzes.value.filter(q => q._id !== quizId);
        // Optionally show a success message
    } catch (err) {
        console.error('Failed to remove bookmark:', err);
        // Display error to the user (e.g., using a toast notification or setting the error ref)
        error.value = err.message || 'Failed to remove bookmark. Please try again.';
        // Clear error after some time
        setTimeout(() => { error.value = null; }, 3000);
    }
};

onMounted(fetchBookmarkedQuizzes);
</script>

<template>
  <div class="bookmarked-quizzes-container">
    <h1>My Bookmarked Quizzes</h1>

    <div v-if="isLoading" class="loading">Loading...</div>
    <!-- Display error message -->
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!isLoading && !error && bookmarkedQuizzes.length === 0" class="no-bookmarks">
      You haven't bookmarked any quizzes yet.
      <router-link to="/quizzes" class="btn btn-primary">Browse Quizzes</router-link>
    </div>

    <div v-if="!isLoading && bookmarkedQuizzes.length > 0" class="quiz-list">
      <div v-for="quiz in bookmarkedQuizzes" :key="quiz._id" class="quiz-card">
        <h2>{{ quiz.title }}</h2>
        <p>{{ quiz.description }}</p>
        <p class="author">Created by: {{ quiz.createdBy?.displayName || 'Unknown' }}</p>
        <div class="card-actions">
          <button @click="goToQuiz(quiz._id)" class="btn btn-secondary">View Quiz</button>
          <!-- Use handleRemoveBookmark -->
          <button @click="handleRemoveBookmark(quiz._id)" class="btn btn-danger">Remove Bookmark</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookmarked-quizzes-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.loading, .error-message, .no-bookmarks {
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
  padding: 1rem; /* Ensure padding */
  margin-bottom: 1rem; /* Add margin */
}

.no-bookmarks {
  color: #555;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.quiz-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.quiz-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Pushes actions to the bottom */
  transition: transform 0.2s ease-in-out;
}

.quiz-card:hover {
    transform: translateY(-5px);
}

.quiz-card h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  color: #333;
}

.quiz-card p {
  color: #555;
  margin-bottom: 0.5rem;
  flex-grow: 1; /* Allows description to take available space */
}

.quiz-card .author {
    font-size: 0.9rem;
    color: #777;
    margin-bottom: 1rem;
}

.card-actions {
  margin-top: 1rem; /* Add space above buttons */
  display: flex;
  justify-content: space-between; /* Space out buttons */
  gap: 0.5rem; /* Add gap between buttons */
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, opacity 0.2s;
  border: none;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}
.btn-primary:hover {
  background-color: #3a56d4;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
    background-color: #e63946;
    color: white;
}
.btn-danger:hover {
    background-color: #d62828;
}
</style>
