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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.quiz-detail-container {
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

h2 {
  color: #4c1d95;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.quiz-content {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.description {
  font-size: 1.2rem;
  color: #5b21b6;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.created-by {
  color: #6b21a8;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.quiz-code-display {
  background: rgba(124, 58, 237, 0.1);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  color: #4c1d95;
}

.quiz-code-display code {
  font-family: 'Outfit', monospace;
  font-weight: 600;
  background: rgba(124, 58, 237, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-secondary {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-secondary:hover {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-danger {
  background: rgba(236, 72, 153, 0.1);
  color: #a21caf;
}

.btn-danger:hover {
  background: rgba(236, 72, 153, 0.2);
  transform: translateY(-2px);
}

.btn-link {
    background: none;
  color: #7c3aed;
    text-decoration: underline;
  padding: 0;
}

.btn-link:hover {
  color: #4c1d95;
}

.bookmark-action {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn-bookmark {
  padding: 1rem 2rem;
  background: #ede9fe;
  color: #7c3aed;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-bookmark:hover {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-bookmark.bookmarked {
  background: rgba(124, 58, 237, 0.1);
  color: #4c1d95;
}

.leaderboard-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  margin-top: 2.5rem;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}

.leaderboard-table th {
  background: rgba(124, 58, 237, 0.05);
  color: #4c1d95;
  font-weight: 600;
  font-size: 1.1rem;
}

.leaderboard-table tr:hover {
  background: rgba(124, 58, 237, 0.02);
}

.no-leaderboard {
  text-align: center;
  padding: 2rem;
  color: #6b21a8;
  font-size: 1.1rem;
  background: rgba(124, 58, 237, 0.05);
  border-radius: 12px;
}

.loading, .error-message {
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.2);
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  color: #4c1d95;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4c1d95;
  font-weight: 600;
}

.form-group textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  color: #4c1d95;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.form-group textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-error {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.modal-success {
  color: #4c1d95;
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid #ede9fe;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .quiz-detail-container {
    margin: 1.5rem;
    padding: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    text-align: center;
  }

  .leaderboard-table {
    display: block;
    overflow-x: auto;
}

  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
