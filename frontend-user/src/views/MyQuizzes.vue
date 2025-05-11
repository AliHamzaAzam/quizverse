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
const feedbackData = ref({}); // Store feedback keyed by quizId
const isLoadingFeedback = ref({}); // Track loading state for feedback per quiz
const feedbackError = ref({}); // Store feedback errors per quiz
const visibleFeedbackQuizId = ref(null); // ID of quiz whose feedback is shown

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
    // Refresh the list after deletion
    myQuizzes.value = myQuizzes.value.filter(quiz => quiz._id !== quizId);
  } catch (err) {
    console.error('Failed to delete quiz:', err);
    alert(err.response?.data?.message || 'Failed to delete quiz. Please try again.');
  }
};

const fetchFeedback = async (quizId) => {
  if (visibleFeedbackQuizId.value === quizId) {
    // Toggle off if already visible
    visibleFeedbackQuizId.value = null;
    return;
  }

  isLoadingFeedback.value[quizId] = true;
  feedbackError.value[quizId] = null;
  feedbackData.value[quizId] = null; // Clear previous data
  visibleFeedbackQuizId.value = null; // Hide any other open feedback

  try {
    const { data } = await api.get(`/api/quizzes/${quizId}/feedback`);
    feedbackData.value[quizId] = data;
    visibleFeedbackQuizId.value = quizId; // Show feedback for this quiz
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

// Helper to format date (optional)
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

// Helper to render stars
const renderStars = (rating) => {
  if (!rating || rating < 1) return 'No rating';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

onMounted(fetchMyQuizzes);
</script>

<template>
  <div class="my-quizzes-container">
    <h1>My Quizzes</h1>

    <div v-if="isLoading" class="loading">Loading your quizzes...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!isLoading && !error && myQuizzes.length > 0" class="quiz-management-list">
      <table>
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
                 <button @click="fetchFeedback(quiz._id)" class="btn-feedback" :disabled="isLoadingFeedback[quiz._id]">
                   {{ visibleFeedbackQuizId === quiz._id ? 'Hide' : 'View' }} Feedback {{ isLoadingFeedback[quiz._id] ? '...' : '' }}
                 </button>
                <button @click="editQuiz(quiz._id)" class="btn-edit">Edit</button>
                <button @click="deleteQuiz(quiz._id)" class="btn-delete">Delete</button>
              </td>
            </tr>
            <!-- Feedback Section - Conditionally rendered below the row -->
            <tr v-if="visibleFeedbackQuizId === quiz._id" class="feedback-row">
              <td colspan="4">
                <div class="feedback-details">
                  <h4>Feedback for "{{ quiz.title }}"</h4>
                   <button @click="closeFeedback" class="btn-close-feedback">×</button>
                  <div v-if="isLoadingFeedback[quiz._id]" class="loading-feedback">Loading feedback...</div>
                  <div v-if="feedbackError[quiz._id]" class="error-message">{{ feedbackError[quiz._id] }}</div>
                  <div v-if="feedbackData[quiz._id]">
                    <ul v-if="feedbackData[quiz._id].length > 0" class="feedback-list">
                      <li v-for="fb in feedbackData[quiz._id]" :key="fb._id" class="feedback-item">
                        <div class="feedback-header">
                          <span class="feedback-user">{{ fb.user?.displayName || 'Anonymous User' }}</span>
                          <span class="feedback-rating">{{ renderStars(fb.rating) }}</span>
                          <span class="feedback-date">{{ formatDate(fb.createdAt) }}</span>
                        </div>
                        <p class="feedback-comment" v-if="fb.comment">{{ fb.comment }}</p>
                        <p v-else class="feedback-comment-none"><i>No comment provided.</i></p>
                      </li>
                    </ul>
                    <div v-else class="no-feedback">No feedback submitted for this quiz yet.</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="!isLoading && !error && myQuizzes.length === 0" class="no-quizzes">
      You haven't created any quizzes yet.
      <router-link to="/quizzes/new">Create one now!</router-link>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.my-quizzes-container {
  max-width: 1000px;
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

.loading, .error-message, .no-quizzes {
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

.no-quizzes {
  color: #5b21b6;
  font-weight: 500;
}

.no-quizzes a {
  color: #7c3aed;
  text-decoration: none;
  margin-left: 0.5rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.no-quizzes a:hover {
  color: #4c1d95;
  text-decoration: underline;
}

.quiz-management-list {
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  margin-top: 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.1rem;
}

th, td {
  padding: 1.2rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}

th {
  background: rgba(124, 58, 237, 0.06);
  font-weight: 700;
  color: #4c1d95;
  text-transform: uppercase;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

tr:last-child td {
    border-bottom: none;
}

tr:hover {
  background: rgba(124, 58, 237, 0.03);
}

td code {
  background: rgba(124, 58, 237, 0.06);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-family: 'Outfit', monospace;
  color: #7c3aed;
  font-weight: 500;
}

.actions-cell {
  white-space: nowrap;
  text-align: right;
}

.actions-cell button {
  padding: 0.6rem 1.2rem;
  margin-left: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
}

.btn-feedback {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-feedback:hover:not(:disabled) {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-edit {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-edit:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-delete {
  background: linear-gradient(45deg, #f472b6, #a21caf);
  color: white;
}

.btn-delete:hover {
  background: linear-gradient(45deg, #a21caf, #f472b6);
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.18);
  transform: translateY(-2px);
}

.feedback-row {
  background: rgba(255, 255, 255, 0.98);
}

.feedback-details {
    padding: 1.5rem;
  position: relative;
}

.feedback-details h4 {
  color: #4c1d95;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.btn-close-feedback {
    position: absolute;
  top: 1rem;
  right: 1rem;
    background: none;
    border: none;
  font-size: 1.5rem;
  color: #7c3aed;
  cursor: pointer;
  padding: 0.5rem;
    line-height: 1;
  transition: color 0.3s ease;
}

.btn-close-feedback:hover {
  color: #4c1d95;
}

.loading-feedback {
    text-align: center;
  color: #5b21b6;
    padding: 1rem;
}

.feedback-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.feedback-item {
  padding: 1.2rem;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
  transition: background-color 0.3s ease;
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-item:hover {
  background: rgba(124, 58, 237, 0.03);
}

.feedback-header {
    display: flex;
    align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.feedback-user {
  font-weight: 600;
  color: #4c1d95;
}

.feedback-rating {
  color: #7c3aed;
  font-size: 1.2rem;
}

.feedback-date {
  color: #5b21b6;
  font-size: 0.9rem;
  margin-left: auto;
}

.feedback-comment {
  color: #5b21b6;
    line-height: 1.5;
  margin: 0;
}

.feedback-comment-none {
  color: #8b5cf6;
  font-style: italic;
  margin: 0;
}

.no-feedback {
    text-align: center;
  color: #5b21b6;
  padding: 2rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .my-quizzes-container {
    padding: 1.5rem;
    margin: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  th, td {
    padding: 1rem;
  }

  .actions-cell {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .actions-cell button {
    width: 100%;
    margin: 0;
  }

  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
}

  .feedback-date {
    margin-left: 0;
  }
}
</style>
