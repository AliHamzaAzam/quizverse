<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';

const route = useRoute();
const router = useRouter();
const quizId = route.params.id;

const quiz = ref(null);
const currentQuestionIndex = ref(0);
const userAnswers = ref({}); // Store answers as { questionId: selectedOptionIndex }
const score = ref(0);
const isSubmitted = ref(false);
const isLoading = ref(true);
const error = ref(null);
const submitError = ref(null);
const isSubmitting = ref(false);
const timeLeft = ref(null); // Time left in seconds
const timerInterval = ref(null); // To store interval ID

const fetchQuiz = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get(`/api/quizzes/${quizId}`);
    quiz.value = data;
    // Initialize answers object
    quiz.value.questions.forEach(q => {
      userAnswers.value[q._id] = null; // Initialize with null
    });
    // Start timer if timeLimit is set
    if (quiz.value.timeLimit && quiz.value.timeLimit > 0) {
      startTimer(quiz.value.timeLimit * 60); // Convert minutes to seconds
    }
  } catch (err) {
    console.error('Failed to fetch quiz:', err);
    error.value = 'Could not load the quiz. Please try again later.';
    if (err.response?.status === 404) {
        error.value = 'Quiz not found.';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchQuiz);

const currentQuestion = computed(() => {
  return quiz.value?.questions[currentQuestionIndex.value];
});

const selectAnswer = (questionId, optionIndex) => {
  if (!isSubmitted.value) {
    userAnswers.value[questionId] = optionIndex;
  }
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < quiz.value.questions.length - 1) {
    currentQuestionIndex.value++;
  }
};

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

const startTimer = (durationInSeconds) => {
  timeLeft.value = durationInSeconds;
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
      // Auto-submit when time runs out
      if (!isSubmitted.value) {
          console.log('Time ran out, auto-submitting...');
          handleSubmit(true); // Pass flag to indicate auto-submission
      }
    }
  }, 1000);
};

// Format time left as MM:SS
const formattedTimeLeft = computed(() => {
  if (timeLeft.value === null) return '';
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// Clear timer on component unmount
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

const handleSubmit = async (isAutoSubmit = false) => {
  // Check if all questions have been answered, unless it's an auto-submit
  if (!isAutoSubmit) {
      const unansweredQuestions = Object.values(userAnswers.value).some(answer => answer === null);
      if (unansweredQuestions) {
          submitError.value = 'Please answer all questions before submitting.';
          return; // Stop manual submission
      }
  } else {
      // For auto-submit, maybe mark unanswered questions or handle differently if needed
      console.log('Auto-submitting with potentially unanswered questions.');
  }

  isSubmitting.value = true;
  submitError.value = null;
  // Stop the timer
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }

  // Prepare submission data
  const answersPayload = Object.entries(userAnswers.value).map(([questionId, selectedOptionIndex]) => ({
      questionId,
      selectedOption: selectedOptionIndex // Changed key name here
  }));

  try {
    const { data } = await api.post(`/api/attempts/${quizId}`, { answers: answersPayload });
    score.value = data.score;
    isSubmitted.value = true;
    // Optionally navigate to results or My Attempts page
    // router.push({ name: 'MyAttempts' });
  } catch (err) {
    console.error('Failed to submit attempt:', err);
    submitError.value = err.response?.data?.message || 'Failed to submit your answers. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const getOptionClass = (questionId, optionIndex) => {
    if (!isSubmitted.value) {
        return { selected: userAnswers.value[questionId] === optionIndex };
    }
    // After submission
    const question = quiz.value.questions.find(q => q._id === questionId);
    const isCorrect = optionIndex === question.correctOptionIndex;
    const isSelected = userAnswers.value[questionId] === optionIndex;

    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return '';
};

</script>

<template>
  <div class="quiz-attempt-container">
    <div v-if="isLoading" class="loading">Loading Quiz...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!isLoading && quiz && !isSubmitted">
      <h1>{{ quiz.title }}</h1>
      <!-- Display Timer -->
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
        <button @click="prevQuestion" :disabled="currentQuestionIndex === 0" class="btn btn-secondary">Previous</button>
        <button v-if="currentQuestionIndex < quiz.questions.length - 1" @click="nextQuestion" class="btn btn-primary">Next</button>
        <button v-else @click="handleSubmit" :disabled="isSubmitting" class="btn btn-success">
          {{ isSubmitting ? 'Submitting...' : 'Submit Quiz' }}
        </button>
      </div>
       <div v-if="submitError" class="error-message submit-error">{{ submitError }}</div>
    </div>

    <div v-if="isSubmitted" class="results-container">
      <h2>Quiz Completed!</h2>
      <p class="final-score">Your Score: {{ score }} / {{ quiz.questions.length }}</p>

       <!-- Display questions and answers with feedback -->
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
        <router-link :to="`/quizzes/${quizId}`" class="btn btn-secondary">View Leaderboard</router-link>
        <router-link to="/quizzes" class="btn btn-primary">Back to Quizzes</router-link>
        <router-link to="/my-attempts" class="btn btn-info">View My Attempts</router-link>
      </div>
    </div>

  </div>
</template>

<style scoped>
.quiz-attempt-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

h1 {
  text-align: center;
  margin-bottom: 0.5rem;
}

.progress {
    text-align: center;
    color: #777;
    margin-bottom: 2rem;
    font-size: 1.1rem;
}

.question-card {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  border: 1px solid #eee;
}

.question-card h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
    color: #333;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.option-item {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.option-item:hover {
  background-color: #e9ecef;
}

.option-item.selected {
  background-color: #cfe2ff;
  border-color: #9ec5fe;
  font-weight: bold;
}

/* Styles after submission */
.option-item.correct {
    background-color: #d1e7dd;
    border-color: #a3cfbb;
    color: #0a3622;
    font-weight: bold;
    cursor: default;
}
.option-item.incorrect {
    background-color: #f8d7da;
    border-color: #f1aeb5;
    color: #58151c;
    font-weight: bold;
    cursor: default;
}
.option-item.correct:hover,
.option-item.incorrect:hover {
    /* Prevent hover effect after submission */
    background-color: inherit;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.7rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, opacity 0.2s;
  border: none;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background-color: #3a56d4;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-success {
    background-color: #198754;
    color: white;
}
.btn-success:hover:not(:disabled) {
    background-color: #157347;
}

.btn-info {
    background-color: #0dcaf0;
    color: #000;
}
.btn-info:hover:not(:disabled) {
    background-color: #31d2f2;
}

.results-container {
    text-align: center;
}

.final-score {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 1.5rem 0;
    color: #333;
}

.question-result-card {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
    border: 1px solid #eee;
    text-align: left;
}
.question-result-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.results-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
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
}
.submit-error {
    margin-top: 1rem;
}

.timer-display {
  text-align: center;
  font-size: 1.4rem;
  font-weight: bold;
  color: #dc3545; /* Bootstrap danger color */
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 4px;
}

</style>
