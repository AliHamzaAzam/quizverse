<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';

const route = useRoute();
const router = useRouter();
const quizId = route.params.id; // For editing
const isEditMode = computed(() => !!quizId);

const quizData = reactive({
  title: '',
  description: '',
  questions: [],
  timeLimit: null, // Add timeLimit field
});

const isLoading = ref(false);
const error = ref(null);
const successMessage = ref('');

// Fetch quiz data if in edit mode
onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/api/quizzes/${quizId}`);
      quizData.title = data.title;
      quizData.description = data.description;
      // Ensure questions have a unique key for v-for if needed (using index is okay here)
      quizData.questions = data.questions.map(q => ({ ...q }));
      quizData.timeLimit = data.timeLimit || null; // Load existing timeLimit
    } catch (err) {
      console.error('Failed to fetch quiz for editing:', err);
      error.value = 'Could not load quiz data for editing.';
    } finally {
      isLoading.value = false;
    }
  } else {
      // Start with one empty question for new quizzes
      addQuestion();
  }
});

const addQuestion = () => {
  quizData.questions.push({
    text: '',
    options: ['', '', '', ''], // Default to 4 options
    correctOptionIndex: null,
  });
};

const removeQuestion = (index) => {
  if (quizData.questions.length > 1) { // Keep at least one question
    quizData.questions.splice(index, 1);
  }
};

const addOption = (questionIndex) => {
    if (quizData.questions[questionIndex].options.length < 6) { // Limit options
        quizData.questions[questionIndex].options.push('');
    }
};

const removeOption = (questionIndex, optionIndex) => {
    const question = quizData.questions[questionIndex];
    if (question.options.length > 2) { // Keep at least two options
        question.options.splice(optionIndex, 1);
        // Reset correct index if the removed option was the correct one
        if (question.correctOptionIndex === optionIndex) {
            question.correctOptionIndex = null;
        } else if (question.correctOptionIndex > optionIndex) {
            // Adjust correct index if it comes after the removed option
            question.correctOptionIndex--;
        }
    }
};

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  successMessage.value = '';

  // Basic Validation
  if (!quizData.title.trim()) {
      error.value = 'Quiz title is required.';
      isLoading.value = false;
      return;
  }
  if (quizData.questions.length === 0) {
      error.value = 'Quiz must have at least one question.';
      isLoading.value = false;
      return;
  }
  for (const [qIndex, q] of quizData.questions.entries()) {
      if (!q.text.trim()) {
          error.value = `Question ${qIndex + 1} text is required.`;
          isLoading.value = false;
          return;
      }
      if (q.options.some(opt => !opt.trim())) {
          error.value = `All options for Question ${qIndex + 1} must be filled.`;
          isLoading.value = false;
          return;
      }
      if (q.correctOptionIndex === null || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
          error.value = `A correct option must be selected for Question ${qIndex + 1}.`;
          isLoading.value = false;
          return;
      }
  }

  try {
    let response;
    // Map frontend data structure to backend model structure
    const payload = {
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions.map(q => ({
            text: q.text,
            options: q.options,
            correctOption: q.correctOptionIndex // Rename field here
        })),
        // Correctly access timeLimit from reactive object
        timeLimit: quizData.timeLimit ? parseInt(quizData.timeLimit, 10) : null 
    };

    if (isEditMode.value) {
      // Use PATCH instead of PUT to match the backend route
      response = await api.patch(`/api/quizzes/${quizId}`, payload);
      successMessage.value = 'Quiz updated successfully!';
    } else {
      response = await api.post('/api/quizzes', payload);
      successMessage.value = 'Quiz created successfully!';
    }

    // Redirect after a short delay
    setTimeout(() => {
        // Redirect to the quiz detail page (for both create and edit)
        router.push({ name: 'QuizDetail', params: { id: response.data._id || quizId } });
    }, 1500);

  } catch (err) {
    console.error('Failed to save quiz:', err);
    // Provide more specific error if available from backend
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} quiz.`;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="quiz-form-container">
    <h1>{{ isEditMode ? 'Edit Quiz' : 'Create New Quiz' }}</h1>

    <form @submit.prevent="handleSubmit" class="quiz-form">
      <div class="form-group">
        <label for="title">Quiz Title</label>
        <input type="text" id="title" v-model="quizData.title" required />
      </div>

      <div class="form-group">
        <label for="description">Description (Optional)</label>
        <textarea id="description" v-model="quizData.description"></textarea>
      </div>

      <div class="form-group">
        <label for="timeLimit">Time Limit (minutes, 0 for no limit)</label>
        <input type="number" id="timeLimit" v-model.number="quizData.timeLimit" min="0">
      </div>

      <h2>Questions</h2>
      <div v-for="(question, qIndex) in quizData.questions" :key="qIndex" class="question-editor">
        <div class="question-header">
            <h3>Question {{ qIndex + 1 }}</h3>
            <button type="button" @click="removeQuestion(qIndex)" class="btn-remove-question" :disabled="quizData.questions.length <= 1">Remove Question</button>
        </div>

        <div class="form-group">
          <label :for="`q-text-${qIndex}`">Question Text</label>
          <input type="text" :id="`q-text-${qIndex}`" v-model="question.text" required />
        </div>

        <h4>Options</h4>
        <div v-for="(option, oIndex) in question.options" :key="oIndex" class="option-editor">
          <input type="text" :id="`q-${qIndex}-opt-${oIndex}`" v-model="question.options[oIndex]" required placeholder="Option text" />
          <label :for="`q-${qIndex}-correct-${oIndex}`" class="correct-option-label">
            <input
              type="radio"
              :id="`q-${qIndex}-correct-${oIndex}`"
              :name="`q-${qIndex}-correct`"
              :value="oIndex"
              v-model="question.correctOptionIndex"
              required
            />
            Correct
          </label>
          <button type="button" @click="removeOption(qIndex, oIndex)" class="btn-remove-option" :disabled="question.options.length <= 2">Remove Option</button>
        </div>
         <button type="button" @click="addOption(qIndex)" class="btn-add-option" :disabled="question.options.length >= 6">Add Option</button>
      </div>

      <button type="button" @click="addQuestion" class="btn-add-question">Add Another Question</button>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Quiz' : 'Create Quiz') }}
        </button>
        <router-link :to="isEditMode ? { name: 'QuizDetail', params: { id: quizId } } : { name: 'QuizList' }" class="btn btn-secondary">Cancel</router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.quiz-form-container {
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
  margin: 2rem 0 1.5rem;
  text-align: center;
}

h3 {
  color: #5b21b6;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

h4 {
  color: #6b21a8;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 1.5rem 0 1rem;
}

.quiz-form {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4c1d95;
  font-weight: 600;
  font-size: 1.1rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
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

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-group textarea {
  min-height: 100px;
    resize: vertical;
}

.question-editor {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  margin-bottom: 1.5rem;
}

.option-editor {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  background: rgba(124, 58, 237, 0.05);
  padding: 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.option-editor:hover {
  background: rgba(124, 58, 237, 0.08);
}

.option-editor input[type="text"] {
  flex: 1;
  margin: 0;
}

.correct-option-label {
    display: flex;
    align-items: center;
  gap: 0.5rem;
  color: #4c1d95;
  font-weight: 500;
    cursor: pointer;
}

.correct-option-label input[type="radio"] {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: #7c3aed;
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

.btn-remove-question,
.btn-remove-option {
  background: rgba(236, 72, 153, 0.1);
  color: #a21caf;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remove-question:hover,
.btn-remove-option:hover {
  background: rgba(236, 72, 153, 0.2);
  transform: translateY(-2px);
}

.btn-remove-question:disabled,
.btn-remove-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-add {
  background: rgba(124, 58, 237, 0.1);
  color: #4c1d95;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-add:hover {
  background: rgba(124, 58, 237, 0.2);
  transform: translateY(-2px);
}

.error-message {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
}

.success-message {
  color: #4c1d95;
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid #ede9fe;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 1.5rem;
  font-size: 1.1rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

@media (max-width: 768px) {
  .quiz-form-container {
    margin: 1.5rem;
    padding: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .option-editor {
    flex-direction: column;
    align-items: stretch;
  }

  .option-editor input[type="text"] {
    width: 100%;
  }

  .btn {
    width: 100%;
    text-align: center;
}
}
</style>