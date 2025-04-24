<template>
  <div class="view-container">
    <div class="content-wrapper">
      <div v-if="isLoading" class="status-message">Loading Quiz...</div>
      <div v-if="error" class="status-message error">{{ error }}</div>

      <div v-if="!isLoading && quiz && !isSubmitted">
        <h1>{{ quiz.title }}</h1>
        <div v-if="timeLeft !== null" class="timer-display">
          Time Left: {{ formattedTimeLeft }}
        </div>
        <p class="progress">Question {{ currentQuestionIndex + 1 }} of {{ quiz.questions.length }}</p>

        <div v-if="currentQuestion" class="question-card">
          <h2>{{ currentQuestion.text }}</h2>
          <ul class="options-list">
            <li
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              @click="selectAnswer(currentQuestion._id, index)"
              :class="['option-item', getOptionClass(currentQuestion._id, index)]"
            >
              {{ option }}
            </li>
          </ul>
        </div>

        <div class="navigation-buttons">
          <button @click="prevQuestion" :disabled="currentQuestionIndex === 0" class="btn secondary">Previous</button>
          <button v-if="currentQuestionIndex < quiz.questions.length - 1" @click="nextQuestion" class="btn primary">Next</button>
          <button v-else @click="handleSubmit" :disabled="isSubmitting" class="btn success">
            {{ isSubmitting ? 'Submitting...' : 'Submit Quiz' }}
          </button>
        </div>
        <div v-if="submitError" class="status-message error submit-error">{{ submitError }}</div>
      </div>

      <div v-if="isSubmitted" class="results-container">
        <h2>Quiz Completed!</h2>
        <p class="final-score">Your Score: {{ score }} / {{ quiz.questions.length }}</p>

        <div v-for="(question, index) in quiz.questions" :key="question._id" class="question-result-card">
          <h3>Question {{ index + 1 }}: {{ question.text }}</h3>
          <ul class="options-list">
            <li
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              :class="['option-item', getOptionClass(question._id, optIndex)]"
            >
              {{ option }}
              <span v-if="getOptionClass(question._id, optIndex) === 'correct'"> (Correct)</span>
              <span v-if="getOptionClass(question._id, optIndex) === 'incorrect'"> (Your Answer)</span>
            </li>
          </ul>
        </div>

        <div class="results-actions">
          <router-link :to="`/quizzes/${quizId}`" class="btn secondary">View Leaderboard</router-link>
          <router-link to="/quizzes" class="btn primary">Back to Quizzes</router-link>
          <router-link to="/my-attempts" class="btn info">View My Attempts</router-link>
        </div>

        <FeedbackForm v-if="attemptId" :attempt-id="attemptId" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/utils/axios';
import FeedbackForm from '@/components/FeedbackForm.vue';

const route = useRoute();
const quizId = route.params.id;

const quiz = ref(null);
const currentQuestionIndex = ref(0);
const userAnswers = ref({});
const score = ref(0);
const isSubmitted = ref(false);
const isLoading = ref(true);
const error = ref(null);
const submitError = ref(null);
const isSubmitting = ref(false);
const timeLeft = ref(null);
let timerInterval;
const attemptId = ref(null);

const fetchQuiz = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get(`/api/quizzes/${quizId}`);
    quiz.value = data;
    quiz.value.questions.forEach(q => userAnswers.value[q._id] = null);
    if (quiz.value.timeLimit) startTimer(quiz.value.timeLimit * 60);
  } catch (err) {
    error.value = err.response?.status === 404 ? 'Quiz not found.' : 'Could not load the quiz.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchQuiz);

const currentQuestion = computed(() => quiz.value?.questions[currentQuestionIndex.value]);
const formattedTimeLeft = computed(() => {
  if (timeLeft.value == null) return '';
  const m = String(Math.floor(timeLeft.value/60)).padStart(2,'0');
  const s = String(timeLeft.value%60).padStart(2,'0');
  return `${m}:${s}`;
});

const selectAnswer = (id, idx) => { if (!isSubmitted.value) userAnswers.value[id] = idx; };
const nextQuestion = () => currentQuestionIndex.value++;
const prevQuestion = () => currentQuestionIndex.value--;

const startTimer = secs => {
  timeLeft.value = secs;
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--;
    else { clearInterval(timerInterval); if (!isSubmitted.value) handleSubmit(true); }
  }, 1000);
};

onUnmounted(() => { clearInterval(timerInterval); });

const handleSubmit = async (auto=false) => {
  if (!auto && Object.values(userAnswers.value).some(a => a===null)) {
    submitError.value = 'Answer all questions before submitting.'; return;
  }
  isSubmitting.value = true;
  clearInterval(timerInterval);
  const payload = Object.entries(userAnswers.value).map(([qid, sel]) => ({ questionId: qid, selectedOption: sel }));
  try {
    const { data } = await api.post(`/api/attempts/${quizId}`, { answers: payload });
    score.value = data.score;
    attemptId.value = data.attemptId;
    isSubmitted.value = true;
  } catch (err) {
    submitError.value = err.response?.data?.message || 'Failed to submit.';
  } finally { isSubmitting.value = false; }
};

const getOptionClass = (qid, idx) => {
  if (!isSubmitted.value) return { selected: userAnswers.value[qid]===idx };
  const q = quiz.value.questions.find(q=>q._id===qid);
  if (idx===q.correctOptionIndex) return 'correct';
  if (userAnswers.value[qid]===idx) return 'incorrect';
  return '';
};
</script>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: 2rem;
  background: transparent;
}
.content-wrapper {
  max-width: 700px;
  margin: 0 auto;
  background: rgba(255,255,255,0.85);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  color: var(--bg-end);
  font-family: var(--font-pixel);
  margin-bottom: 1rem;
}
h2, h3 {
  color: var(--text);
  font-family: var(--font-pixel);
}

.status-message {
  text-align: center;
  padding: 1rem;
  margin-bottom: 1rem;
  color: var(--text);
  font-family: var(--font-pixel);
}
.status-message.error { color: #c62828; }

.timer-display {
  text-align: center;
  font-family: var(--font-pixel);
  margin-bottom: 1rem;
  color: var(--bg-end);
}

.progress {
  text-align: center;
  color: var(--text);
  margin-bottom: 1.5rem;
}

.question-card, .question-result-card {
  background: rgba(255,255,255,0.8);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  border: 1px solid #ddd;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.option-item {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  font-family: var(--font-pixel);
}
.option-item:hover { background: var(--bg-mid); }
.option-item.selected { background: var(--bg-end); color: #fff; }
.option-item.correct { background: #d1e7dd; border-color: #a3cfbb; color: #0a3622; cursor: default; }
.option-item.incorrect { background: #f8d7da; border-color: #f1aeb5; color: #58151c; cursor: default; }

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  font-family: var(--font-pixel);
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.btn.primary { background: var(--bg-end); color: #fff; }
.btn.primary:hover:not(:disabled) { background: var(--bg-mid); }
.btn.secondary { background: var(--bg-mid); color: var(--text); }
.btn.secondary:hover:not(:disabled) { background: var(--bg-start); }
.btn.success { background: #198754; color: #fff; }
.btn.success:hover:not(:disabled) { opacity: 0.9; }
.btn.info { background: #0dcaf0; color: #000; }
.btn.info:hover:not(:disabled) { opacity: 0.9; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.final-score { text-align: center; font-family: var(--font-pixel); margin: 1rem 0; color: var(--text); }

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

</style>