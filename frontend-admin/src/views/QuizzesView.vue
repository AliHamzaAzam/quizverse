<template>
  <div class="quiz-management">
    <h1>Manage Quizzes</h1>

    <div v-if="isLoading">Loading quizzes...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="quizzes.length === 0">No quizzes found.</div>
    <table v-else class="quiz-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="quiz in quizzes" :key="quiz._id">
          <td>{{ quiz.title }}</td>
          <td>{{ quiz.status }}</td>
          <td>{{ formatDate(quiz.createdAt) }}</td>
          <td>{{ quiz.status }}</td>
          <td>
            <button @click="toggleQuizVisibility(quiz)">
              {{ quiz.status === 'hidden' ? 'Unhide' : 'Hide' }}
            </button>
          </td>
          
          
          
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios'; // make sure this points to your axios config

const quizzes = ref([]);
const isLoading = ref(true);
const isProcessing = ref(null);
const error = ref(null);

const fetchQuizzes = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get('/api/admin/quizzes');
    quizzes.value = data;
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    error.value = err.response?.data?.message || 'Failed to load quizzes.';
  } finally {
    isLoading.value = false;
  }
};

const hideQuiz = async (quizId) => {
  isProcessing.value = quizId;
  try {
    await api.patch(`/api/admin/quizzes/${quizId}/hide`);
    await fetchQuizzes();
  } catch (err) {
    console.error('Error hiding quiz:', err);
    error.value = err.response?.data?.message || 'Failed to hide quiz.';
  } finally {
    isProcessing.value = null;
  }
};

const unhideQuiz = async (quizId) => {
  isProcessing.value = quizId;
  try {
    await api.patch(`/api/admin/quizzes/${quizId}/unhide`);
    await fetchQuizzes();
  } catch (err) {
    console.error('Error unhiding quiz:', err);
    error.value = err.response?.data?.message || 'Failed to unhide quiz.';
  } finally {
    isProcessing.value = null;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const toggleQuizVisibility = async (quiz) => {
  try {
    const endpoint = quiz.status === 'hidden'
      ? `/api/admin/quizzes/${quiz._id}/unhide`
      : `/api/admin/quizzes/${quiz._id}/hide`;
    await api.patch(endpoint);
    await fetchQuizzes(); // Refresh list
  } catch (err) {
    error.value = 'Failed to toggle quiz visibility.';
    console.error(err);
  }
};


onMounted(fetchQuizzes);
</script>

<style scoped>
.quiz-management {
  padding: 2rem;
}
.quiz-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.quiz-table th,
.quiz-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #ccc;
}
.quiz-table th {
  background: #f4f4f4;
}
button {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-message {
  color: red;
  margin-top: 1rem;
}
</style>
