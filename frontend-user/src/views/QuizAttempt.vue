<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';
import FeedbackForm from '@/components/FeedbackForm.vue'; // Import the new component

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
const attemptId = ref(null); // Add a ref to store the attempt ID after submission

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
    attemptId.value = data.attemptId; // Store the attempt ID from the response
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

      <!-- Add Feedback Form -->
      <FeedbackForm v-if="attemptId" :attempt-id="attemptId" />

    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.quiz-attempt-container {
  max-width: 800px;
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

.progress {
    text-align: center;
  color: #5b21b6;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  font-weight: 500;
}

.question-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.question-card h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  font-size: 1.4rem;
  color: #4c1d95;
  font-weight: 600;
  line-height: 1.4;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-item {
  padding: 1.2rem;
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  color: #5b21b6;
}

.option-item:hover {
  background: rgba(124, 58, 237, 0.05);
  border-color: #7c3aed;
  transform: translateY(-2px);
}

.option-item.selected {
  background: rgba(124, 58, 237, 0.1);
  border-color: #7c3aed;
  font-weight: 600;
  color: #4c1d95;
}

.option-item.correct {
  background: rgba(124, 58, 237, 0.1);
  border-color: #7c3aed;
  color: #4c1d95;
  font-weight: 600;
    cursor: default;
}

.option-item.incorrect {
  background: rgba(236, 72, 153, 0.1);
  border-color: #a21caf;
  color: #a21caf;
  font-weight: 600;
    cursor: default;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  text-decoration: none;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-secondary {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-secondary:hover:not(:disabled) {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-success {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
    color: white;
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-info {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-info:hover:not(:disabled) {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.results-container {
    text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.final-score {
  font-size: 2rem;
  font-weight: 700;
    margin: 1.5rem 0;
  color: #4c1d95;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.question-result-card {
  background: rgba(255, 255, 255, 0.95);
    padding: 1.5rem;
  border-radius: 12px;
    margin-bottom: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
    text-align: left;
}

.question-result-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  color: #4c1d95;
  font-weight: 600;
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

.submit-error {
    margin-top: 1rem;
}

.timer-display {
  text-align: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: #4c1d95;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(124, 58, 237, 0.1);
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  font-family: 'Outfit', monospace;
}

@media (max-width: 768px) {
  .quiz-attempt-container {
    margin: 1.5rem;
    padding: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  .question-card {
    padding: 1.5rem;
  }

  .question-card h2 {
    font-size: 1.2rem;
  }

  .option-item {
    padding: 1rem;
    font-size: 1rem;
  }

  .navigation-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .results-actions {
    flex-direction: column;
  }

  .results-actions .btn {
    width: 100%;
  }
}
</style>
