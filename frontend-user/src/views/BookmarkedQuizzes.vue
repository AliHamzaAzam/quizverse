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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.bookmarked-quizzes-container {
  max-width: 900px;
  margin: 2.5rem auto;
  padding: 2.5rem 1.5rem;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.10);
  font-family: 'Outfit', sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2.2rem;
  font-weight: 800;
  color: #4c1d95;
  letter-spacing: 0.5px;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loading, .error-message, .no-bookmarks {
  text-align: center;
  padding: 1.5rem;
  font-size: 1.1rem;
  margin-top: 1rem;
  border-radius: 12px;
  font-weight: 500;
  font-family: 'Outfit', sans-serif;
}

.error-message {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
  margin-bottom: 1rem;
}

.no-bookmarks {
  color: #5b21b6;
  background: rgba(124, 58, 237, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  border: 1px solid #ede9fe;
}

.quiz-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.quiz-card {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.10);
  border: 1px solid #ede9fe;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: 'Outfit', sans-serif;
}

.quiz-card:hover {
  transform: translateY(-7px) scale(1.02);
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.18);
}

.quiz-card h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  color: #7c3aed;
  font-weight: 700;
}

.quiz-card p {
  color: #5b21b6;
  margin-bottom: 0.5rem;
  flex-grow: 1;
  font-size: 1.05rem;
}

.quiz-card .author {
  font-size: 0.95rem;
  color: #a78bfa;
    margin-bottom: 1rem;
}

.card-actions {
  margin-top: 1.2rem;
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
}

.btn {
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
}

.btn-primary {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: #fff;
}
.btn-primary:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
}

.btn-secondary {
  background: #ede9fe;
  color: #7c3aed;
}
.btn-secondary:hover {
  background: #c4b5fd;
  color: #4c1d95;
}

.btn-danger {
  background: linear-gradient(45deg, #f472b6, #a21caf);
  color: #fff;
}
.btn-danger:hover {
  background: linear-gradient(45deg, #a21caf, #f472b6);
  opacity: 0.92;
}

@media (max-width: 700px) {
  .bookmarked-quizzes-container {
    padding: 1.2rem 0.3rem;
  }
  .quiz-list {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
  .quiz-card {
    padding: 1.2rem 0.7rem;
  }
}
</style>
