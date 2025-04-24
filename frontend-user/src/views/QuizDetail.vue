<template>
  <div class="view-container">
    <div class="content-wrapper">
      <div v-if="isLoading" class="status-message">Loading quiz details...</div>
      <div v-if="error" class="status-message error">{{ error }}</div>
      <div v-if="actionError" class="status-message error">{{ actionError }}</div>

      <div v-if="!isLoading && quiz" class="quiz-content">
        <h1>{{ quiz.title }}</h1>
        <div class="bookmark-action">
          <button @click="toggleBookmark" :class="['btn-bookmark', { bookmarked: isBookmarked }]">
            <i :class="isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
            {{ isBookmarked ? 'Bookmarked' : 'Bookmark this Quiz' }}
          </button>
        </div>

        <p class="description">{{ quiz.description }}</p>
        <p class="created-by">Created by: {{ quiz.createdBy?.displayName || 'Unknown' }}</p>
        <p class="quiz-code-display">Code: <code>{{ quiz.code }}</code></p>

        <div class="actions">
          <router-link :to="`/quizzes/${quiz._id}/attempt`" class="btn primary">Take Quiz</router-link>
          <router-link v-if="isCreator" :to="`/quizzes/${quiz._id}/edit`" class="btn secondary">Edit Quiz</router-link>
          <button @click="openReportModal" class="btn danger">Report Quiz</button>
          <router-link to="/quizzes" class="btn link">Back to Quizzes</router-link>
        </div>

        <div class="leaderboard-section">
          <h2>Leaderboard</h2>
          <table v-if="leaderboard.length" class="leaderboard-table">
            <thead>
              <tr><th>Rank</th><th>User</th><th>Score</th><th>Date</th></tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in leaderboard" :key="entry._id">
                <td>{{ idx + 1 }}</td>
                <td>{{ entry.user?.displayName || 'Anonymous' }}</td>
                <td>{{ entry.score }} / {{ quiz.questions.length }}</td>
                <td>{{ formatDate(entry.completedAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="status-message">No attempts recorded yet for this quiz.</div>
        </div>
      </div>

      <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
        <div class="modal-content">
          <h2>Report Quiz: {{ quiz?.title }}</h2>
          <form @submit.prevent="submitReport">
            <div class="form-group">
              <label for="reportReason">Reason for reporting:</label>
              <textarea id="reportReason" v-model="reportReason" rows="4" placeholder="Describe why this quiz is inappropriate..."></textarea>
            </div>
            <div v-if="reportError" class="status-message error">{{ reportError }}</div>
            <div v-if="reportSuccess" class="status-message success">Report submitted successfully!</div>
            <div class="modal-actions">
              <button type="button" @click="closeReportModal" class="btn secondary">Cancel</button>
              <button type="submit" class="btn danger" :disabled="reportSuccess">Submit Report</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();
const quizId = route.params.id;

const quiz = ref(null);
const leaderboard = ref([]);
const isLoading = ref(true);
const error = ref(null);
const actionError = ref(null);
const showReportModal = ref(false);
const reportReason = ref('');
const reportError = ref(null);
const reportSuccess = ref(false);

const fetchDetails = async () => {
  isLoading.value = true;
  try {
    const quizRes = await api.get(`/api/quizzes/${quizId}`);
    quiz.value = quizRes.data;
    const lbRes = await api.get(`/api/leaderboard/${quizId}`);
    leaderboard.value = lbRes.data;
  } catch (err) {
    error.value = 'Could not load quiz details.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchDetails);

const isCreator = computed(() => auth.user?._id === quiz.value?.createdBy?._id);
const isBookmarked = computed(() => auth.bookmarkedQuizIds.includes(quizId));

const toggleBookmark = async () => {
  try {
    if (isBookmarked.value) await auth.removeBookmark(quizId);
    else await auth.addBookmark(quizId);
  } catch (err) {
    actionError.value = 'Could not update bookmark.';
    setTimeout(() => (actionError.value = null), 3000);
  }
};

const openReportModal = () => { showReportModal.value = true; reportError.value = null; reportSuccess.value = false; };
const closeReportModal = () => (showReportModal.value = false);

const submitReport = async () => {
  if (!reportReason.value.trim()) { reportError.value = 'Please provide a reason.'; return; }
  try {
    await api.post('/api/reports', { quizId, reason: reportReason.value });
    reportSuccess.value = true;
    setTimeout(closeReportModal, 2000);
  } catch (err) {
    reportError.value = 'Failed to submit report.';
  }
};

const formatDate = dateStr => new Date(dateStr).toLocaleDateString();
</script>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: 2rem;
  background: transparent;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255,255,255,0.85);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

h1, h2 {
  text-align: center;
  font-family: var(--font-pixel);
  color: var(--bg-end);
}

.status-message {
  text-align: center;
  padding: 1rem;
  margin-bottom: 1rem;
  font-family: var(--font-pixel);
}
.status-message.error { color: #c62828; }
.status-message.success { color: #2e7d32; }

.bookmark-action { text-align: center; margin: 1rem 0; }
.btn-bookmark {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--bg-mid);
  border-radius: 1rem;
  background: transparent;
  color: var(--bg-end);
  cursor: pointer;
  font-family: var(--font-pixel);
  transition: background 0.2s;
}
.btn-bookmark.bookmarked {
  background: var(--bg-end);
  color: #fff;
}

.description, .created-by, .quiz-code-display {
  text-align: center;
  font-family: var(--font-pixel);
  color: var(--text);
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}
.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
  cursor: pointer;
}
.btn.primary { background: var(--bg-end); color: #fff; }
.btn.secondary { background: var(--bg-mid); color: var(--text); }
.btn.danger { background: #e63946; color: #fff; }
.btn.link { background: none; color: var(--bg-end); text-decoration: underline; }

.leaderboard-section { margin-top: 2rem; }
.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255,255,255,0.9);
  font-family: var(--font-pixel);
}
.leaderboard-table th, .leaderboard-table td {
  padding: 0.8rem;
  border-bottom: 1px solid #ddd;
}
.leaderboard-table th { background: var(--bg-mid); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.form-group textarea { width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 0.5rem; }
</style>
