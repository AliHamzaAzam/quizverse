<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const quiz = ref(null);
const leaderboard = ref([]);
const isLoading = ref(true);
const error = ref(null);
const quizId = route.params.id;
const actionError = ref(null); // Ref for bookmark action errors

const fetchQuizDetails = async () => {
  try {
    const { data } = await api.get(`/api/quizzes/${quizId}`);
    quiz.value = data;
  } catch (err) {
    console.error('Failed to fetch quiz details:', err);
    error.value = 'Could not load quiz details.';
    // Optionally redirect if quiz not found or error occurs
    // if (err.response?.status === 404) router.push({ name: 'QuizList' });
  }
};

const fetchLeaderboard = async () => {
  try {
    const { data } = await api.get(`/api/leaderboard/${quizId}`);
    leaderboard.value = data;
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
    // Don't set the main error, leaderboard might just be empty
  }
};

const isCreator = computed(() => {
    return auth.user && quiz.value && quiz.value.createdBy && auth.user._id === quiz.value.createdBy._id;
});

// Computed property to check if the current quiz is bookmarked
const isBookmarked = computed(() => {
    return auth.bookmarkedQuizIds.includes(quizId);
});

// Function to toggle bookmark status
const toggleBookmark = async () => {
    actionError.value = null; // Clear previous error
    try {
        if (isBookmarked.value) {
            await auth.removeBookmark(quizId);
        } else {
            await auth.addBookmark(quizId);
        }
    } catch (err) {
        console.error('Failed to toggle bookmark:', err);
        actionError.value = err.message || 'Could not update bookmark.';
        // Clear error after some time
        setTimeout(() => { actionError.value = null; }, 3000);
    }
};

const showReportModal = ref(false);
const reportReason = ref('');
const reportError = ref(null);
const reportSuccess = ref(false);

const openReportModal = () => {
  reportReason.value = '';
  reportError.value = null;
  reportSuccess.value = false;
  showReportModal.value = true;
};

const closeReportModal = () => {
  showReportModal.value = false;
};

const submitReport = async () => {
  if (!reportReason.value.trim()) {
    reportError.value = 'Please provide a reason for reporting.';
    return;
  }
  reportError.value = null;
  reportSuccess.value = false;

  try {
    await api.post('/api/reports', {
      quizId: quizId,
      reason: reportReason.value
    });
    reportSuccess.value = true;
    // Optionally close modal after a delay or keep it open with success message
    setTimeout(() => {
        closeReportModal();
    }, 2000); // Close after 2 seconds
  } catch (err) {
    console.error('Failed to submit report:', err);
    reportError.value = err.response?.data?.message || 'Failed to submit report. You might have already reported this quiz.';
  }
};

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  // Ensure auth state (including bookmarks) is potentially loaded before rendering
  // Although checkAuth in router guard might handle this, adding it here can be a fallback
  // await auth.checkAuth(); // Uncomment if needed, but might be redundant
  await Promise.all([fetchQuizDetails(), fetchLeaderboard()]);
  isLoading.value = false;
});

// Function to format date (optional)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

</script>

<template>
  <div class="quiz-detail-container">
    <div v-if="isLoading" class="loading">Loading quiz details...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <!-- Display bookmark action error -->
    <div v-if="actionError" class="error-message">{{ actionError }}</div>

    <div v-if="!isLoading && quiz" class="quiz-content">
      <h1>{{ quiz.title }}</h1>
      <!-- Bookmark Button -->
      <div class="bookmark-action">
          <button @click="toggleBookmark" :class="['btn-bookmark', { 'bookmarked': isBookmarked }]">
            <i :class="isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
            {{ isBookmarked ? 'Bookmarked' : 'Bookmark this Quiz' }}
          </button>
      </div>
      <p class="description">{{ quiz.description }}</p>
      <p class="created-by">Created by: {{ quiz.createdBy?.displayName || 'Unknown' }}</p>
      <p class="quiz-code-display">Code: <code>{{ quiz.code }}</code></p> <!-- Display quiz code -->

      <div class="actions">
        <router-link :to="`/quizzes/${quiz._id}/attempt`" class="btn btn-primary">Take Quiz</router-link>
        <router-link v-if="isCreator" :to="`/quizzes/${quiz._id}/edit`" class="btn btn-secondary">Edit Quiz</router-link>
        <button @click="openReportModal" class="btn btn-danger">Report Quiz</button> <!-- Report Button -->
        <router-link :to="`/quizzes`" class="btn btn-link">Back to Quizzes</router-link>
      </div>

      <div class="leaderboard-section">
        <h2>Leaderboard</h2>
        <div v-if="leaderboard.length > 0">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, index) in leaderboard" :key="entry._id">
                <td>{{ index + 1 }}</td>
                <td>{{ entry.user?.displayName || 'Anonymous' }}</td>
                <td>{{ entry.score }} / {{ quiz.questions.length }}</td>
                <td>{{ formatDate(entry.completedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-leaderboard">
          No attempts recorded yet for this quiz.
        </div>
      </div>
    </div>
     <div v-if="!isLoading && !quiz && !error">
        <p>Quiz not found.</p>
         <router-link :to="`/quizzes`" class="btn btn-link">Back to Quizzes</router-link>
    </div>

    <!-- Report Modal -->
    <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
      <div class="modal-content">
        <h2>Report Quiz: {{ quiz?.title }}</h2>
        <form @submit.prevent="submitReport">
          <div class="form-group">
            <label for="reportReason">Reason for reporting:</label>
            <textarea
              id="reportReason"
              v-model="reportReason"
              rows="4"
              required
              placeholder="Please describe why this quiz is inappropriate (e.g., offensive content, incorrect information, spam)."
            ></textarea>
          </div>
          <div v-if="reportError" class="error-message modal-error">{{ reportError }}</div>
          <div v-if="reportSuccess" class="success-message modal-success">Report submitted successfully. Thank you.</div>
          <div class="modal-actions">
            <button type="button" @click="closeReportModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-danger" :disabled="reportSuccess">Submit Report</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
.quiz-detail-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

h1 {
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
}

.description {
  color: #555;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.1rem;
}

.created-by {
  text-align: center;
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.7rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  border: none;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}
.btn-primary:hover {
  background-color: #3a56d4;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-secondary {
  background-color: #ffb703;
  color: #333;
}
.btn-secondary:hover {
  background-color: #fca311;
}

.btn-link {
    background: none;
    border: none;
    color: #4361ee;
    text-decoration: underline;
    padding: 0.5rem;
}
.btn-link:hover {
    color: #3a56d4;
}

.btn-danger {
  background-color: #e63946;
  color: white;
}
.btn-danger:hover {
  background-color: #d62828;
}

.leaderboard-section {
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 2rem;
}

.leaderboard-section h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #444;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.leaderboard-table th, .leaderboard-table td {
  padding: 0.8rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.leaderboard-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.leaderboard-table tbody tr:hover {
  background-color: #f1f3f5;
}

.no-leaderboard {
  text-align: center;
  color: #777;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.loading, .error-message {
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
  text-align: center;
}

.quiz-code-display {
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #555;
}

.quiz-code-display code {
    background-color: #e9ecef;
    padding: 0.2em 0.5em;
    border-radius: 4px;
    font-family: monospace;
    color: #007bff;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  resize: vertical;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-error,
.modal-success {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 4px;
    text-align: center;
}

.modal-error {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
}

.modal-success {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
}

.bookmark-action {
    text-align: center;
    margin-bottom: 1.5rem; /* Space below bookmark button */
}

.btn-bookmark {
    padding: 0.7rem 1.5rem;
    border-radius: 20px; /* Pill shape */
    text-decoration: none;
    text-align: center;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
    border: 1px solid #6c757d;
    background-color: #fff;
    color: #6c757d;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-bookmark:hover {
    background-color: #f8f9fa;
    border-color: #5a6268;
    color: #5a6268;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.btn-bookmark.bookmarked {
    background-color: #ffc107;
    border-color: #ffc107;
    color: #333;
}

.btn-bookmark.bookmarked:hover {
    background-color: #e0a800;
    border-color: #e0a800;
}

/* Add Font Awesome if not already included globally */
/* @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'); */
</style>
