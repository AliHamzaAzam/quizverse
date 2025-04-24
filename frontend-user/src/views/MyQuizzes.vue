<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';

const myQuizzes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const router = useRouter();
const auth = useAuthStore();
const feedbackData = ref({});
const isLoadingFeedback = ref({});
const feedbackError = ref({});
const visibleFeedbackQuizId = ref(null);

const fetchMyQuizzes = async () => {
  isLoading.value = true;
  error.value = null;
  if (!auth.isAuthenticated) {
    error.value = 'Please log in to see your quizzes.';
    isLoading.value = false;
    return;
  }
  try {
    const { data } = await api.get('/api/quizzes/my-quizzes');
    myQuizzes.value = data;
  } catch (err) {
    console.error('Failed to fetch quizzes:', err);
    error.value = err.response?.data?.message || 'Failed to load your quizzes. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const editQuiz = (quizId) => {
  router.push(`/quizzes/${quizId}/edit`);
};

const deleteQuiz = async (quizId) => {
  if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
    return;
  }
  try {
    await api.delete(`/api/quizzes/${quizId}`);
    myQuizzes.value = myQuizzes.value.filter(q => q._id !== quizId);
  } catch (err) {
    console.error('Failed to delete quiz:', err);
    alert(err.response?.data?.message || 'Failed to delete quiz. Please try again.');
  }
};

const fetchFeedback = async (quizId) => {
  if (visibleFeedbackQuizId.value === quizId) {
    visibleFeedbackQuizId.value = null;
    return;
  }
  isLoadingFeedback.value[quizId] = true;
  feedbackError.value[quizId] = null;
  feedbackData.value[quizId] = null;
  visibleFeedbackQuizId.value = null;
  try {
    const { data } = await api.get(`/api/quizzes/${quizId}/feedback`);
    feedbackData.value[quizId] = data;
    visibleFeedbackQuizId.value = quizId;
  } catch (err) {
    console.error(`Failed to fetch feedback for quiz ${quizId}:`, err);
    feedbackError.value[quizId] = err.response?.data?.message || 'Failed to load feedback.';
  } finally {
    isLoadingFeedback.value[quizId] = false;
  }
};

const closeFeedback = () => {
  visibleFeedbackQuizId.value = null;
};

const formatDate = (dt) => dt ? new Date(dt).toLocaleString() : '';
const renderStars = (rating) => rating && rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : 'No rating';

onMounted(fetchMyQuizzes);
</script>

<template>
  <div class="view-container">
    <div class="content-wrapper">
      <h1>My Quizzes</h1>

      <div v-if="isLoading" class="status-message">Loading your quizzes...</div>
      <div v-if="error" class="status-message error">{{ error }}</div>

      <div v-if="!isLoading && !error && myQuizzes.length > 0" class="quiz-table-wrapper">
        <table class="quiz-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Code</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="quiz in myQuizzes" :key="quiz._id">
              <tr>
                <td>{{ quiz.title }}</td>
                <td><code>{{ quiz.code }}</code></td>
                <td>{{ quiz.description || '-' }}</td>
                <td class="actions-cell">
                  <button @click="fetchFeedback(quiz._id)" :disabled="isLoadingFeedback[quiz._id]" class="action-link small">
                    {{ visibleFeedbackQuizId === quiz._id ? 'Hide' : 'View' }} Feedback {{ isLoadingFeedback[quiz._id] ? '...' : '' }}
                  </button>
                  <button @click="editQuiz(quiz._id)" class="action-link small">Edit</button>
                  <button @click="deleteQuiz(quiz._id)" class="action-link small">Delete</button>
                </td>
              </tr>
              <tr v-if="visibleFeedbackQuizId === quiz._id">
                <td colspan="4" class="feedback-row">
                  <div class="feedback-panel">
                    <h4>Feedback for "{{ quiz.title }}"</h4>
                    <button @click="closeFeedback" class="close-btn">×</button>
                    <div v-if="isLoadingFeedback[quiz._id]" class="status-message">Loading feedback...</div>
                    <div v-if="feedbackError[quiz._id]" class="status-message error">{{ feedbackError[quiz._id] }}</div>
                    <ul v-if="feedbackData[quiz._id]?.length > 0" class="feedback-list">
                      <li v-for="fb in feedbackData[quiz._id]" :key="fb._id" class="feedback-item">
                        <div class="feedback-header">
                          <span>{{ fb.user?.displayName || 'Anonymous User' }}</span>
                          <span>{{ renderStars(fb.rating) }}</span>
                          <span>{{ formatDate(fb.createdAt) }}</span>
                        </div>
                        <p class="feedback-comment" v-if="fb.comment">{{ fb.comment }}</p>
                        <p class="feedback-comment-none" v-else><i>No comment provided.</i></p>
                      </li>
                    </ul>
                    <div v-else class="status-message">No feedback submitted for this quiz yet.</div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="!isLoading && !error && myQuizzes.length === 0" class="status-message">
        You haven't created any quizzes yet.
        <router-link to="/quizzes/new" class="action-link">Create one now!</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: transparent;
}

.content-wrapper {
  width: 100%;
  max-width: 1000px;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  color: var(--bg-end);
}

.status-message {
  text-align: center;
  font-size: 1rem;
  margin: 1rem 0;
  color: var(--text);
}
.status-message.error {
  color: #c62828;
}

.quiz-table-wrapper {
  overflow-x: auto;
}

.quiz-table {
  width: 100%;
  border-collapse: collapse;
  background-color: rgba(255,255,255,0.8);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

th, td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #ddd;
  font-family: var(--font-pixel);
}

th {
  background-color: var(--bg-mid);
  color: var(--text);
  text-transform: uppercase;
  font-size: 0.9rem;
}

td code {
  background-color: var(--bg-start);
  padding: 0.2em 0.4em;
  border-radius: 0.3rem;
  font-family: monospace;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-link.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  border: 1px solid var(--bg-end);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--bg-end);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.action-link.small:hover {
  background: var(--bg-end);
  color: #fff;
}

.feedback-row td {
  padding: 0;
  border-bottom: 1px solid #ccc;
}

.feedback-panel {
  background-color: rgba(255,255,255,0.9);
  padding: 1rem;
  position: relative;
  border-radius: 0 0 1rem 1rem;
}

.feedback-panel h4 {
  margin: 0;
  margin-bottom: 1rem;
  color: var(--text);
  font-size: 1rem;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.8rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text);
}

.feedback-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
}

.feedback-item {
  background: var(--bg-start);
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.feedback-comment,
.feedback-comment-none {
  font-size: 0.9rem;
  color: var(--text);
  margin: 0;
}

</style>