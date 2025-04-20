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
.my-quizzes-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
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

.quiz-management-list {
    overflow-x: auto; /* Add horizontal scroll for smaller screens */
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden; /* Ensures border-radius applies to table */
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  font-size: 0.9rem;
}

tr:last-child td {
    border-bottom: none;
}

tr:hover {
    background-color: #f1f1f1;
}

td code {
    background-color: #e9ecef;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
}

.actions-cell {
  white-space: nowrap; /* Prevent buttons from wrapping */
  text-align: right;
}

.actions-cell button {
  padding: 6px 12px;
  margin-left: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-edit {
  background-color: #ffb703;
  color: #333;
}
.btn-edit:hover {
  background-color: #fca311;
}

.btn-delete {
  background-color: #e63946;
  color: white;
}
.btn-delete:hover {
  background-color: #d62828;
}

.btn-feedback {
  background-color: #0dcaf0; /* Info color */
  color: #000;
  padding: 6px 10px; /* Slightly smaller padding */
}
.btn-feedback:hover {
  background-color: #31d2f2;
}
.btn-feedback:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}


/* Feedback Row and Details Styles */
.feedback-row td {
    padding: 0; /* Remove padding from the td */
    border-bottom: 1px solid #ccc; /* Add a separator */
    border-top: 1px solid #ccc; /* Add a separator */
}

.feedback-details {
    background-color: #f0f8ff; /* Light blue background */
    padding: 1.5rem;
    position: relative; /* For positioning the close button */
}

.feedback-details h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
}

.btn-close-feedback {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 1.8rem;
    line-height: 1;
    cursor: pointer;
    color: #888;
}
.btn-close-feedback:hover {
    color: #333;
}


.loading-feedback {
    text-align: center;
    padding: 1rem;
    color: #555;
}

.feedback-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px; /* Limit height and make scrollable */
    overflow-y: auto;
}

.feedback-item {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
}
.feedback-item:last-child {
    margin-bottom: 0;
}

.feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #555;
    flex-wrap: wrap; /* Allow wrapping on small screens */
    gap: 10px;
}

.feedback-user {
    font-weight: bold;
    color: #333;
}

.feedback-rating {
    color: #ffc107; /* Star color */
    font-size: 1.1rem;
}

.feedback-comment {
    margin-top: 0.5rem;
    margin-bottom: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: #212529;
}
.feedback-comment-none {
    margin-top: 0.5rem;
    margin-bottom: 0;
    font-size: 1rem;
    color: #6c757d;
}

.no-feedback {
    text-align: center;
    padding: 1rem;
    color: #777;
    font-style: italic;
}

</style>
