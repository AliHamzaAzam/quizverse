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
        }))
    };

    if (isEditMode.value) {
      response = await api.put(`/api/quizzes/${quizId}`, payload);
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
    error.value = err.response?.data?.message || 'Failed to save the quiz.';
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
.quiz-form-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

h1, h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}
h2 {
    margin-top: 2.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
}

.quiz-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: #444;
}

input[type="text"],
textarea {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

textarea {
    min-height: 80px;
    resize: vertical;
}

.question-editor {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-bottom: 1rem;
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px dashed #ddd;
}
.question-header h3 {
    margin: 0;
    font-size: 1.2rem;
}

.btn-remove-question {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}
.btn-remove-question:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.option-editor {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.option-editor input[type="text"] {
    flex-grow: 1;
}

.correct-option-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    white-space: nowrap;
}

.btn-remove-option {
    background: none;
    border: 1px solid #dc3545;
    color: #dc3545;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
}
.btn-remove-option:disabled {
    border-color: #ccc;
    color: #ccc;
    cursor: not-allowed;
}

.btn-add-option,
.btn-add-question {
    background-color: #e9ecef;
    color: #333;
    border: 1px solid #ced4da;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    transition: background-color 0.2s;
}
.btn-add-option:hover:not(:disabled),
.btn-add-question:hover:not(:disabled) {
    background-color: #dee2e6;
}
.btn-add-option:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-add-question {
    margin-top: 1.5rem;
    align-self: center;
    background-color: #2a9d8f;
    color: white;
    border: none;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
}
.btn-add-question:hover {
    background-color: #268c7f;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
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

.error-message, .success-message {
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 1rem;
  text-align: center;
}

.error-message {
  color: #c62828;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

</style>