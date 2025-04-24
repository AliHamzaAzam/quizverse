<template>
  <div class="view-container">
    <div class="content-wrapper">
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
          <input type="number" id="timeLimit" v-model.number="quizData.timeLimit" min="0" />
        </div>

        <h2>Questions</h2>
        <div v-for="(question, qIndex) in quizData.questions" :key="qIndex" class="question-editor">
          <div class="question-header">
            <h3>Question {{ qIndex + 1 }}</h3>
            <button type="button" @click="removeQuestion(qIndex)" class="btn-remove" :disabled="quizData.questions.length <= 1">
              Remove
            </button>
          </div>
          <div class="form-group">
            <label :for="`q-text-${qIndex}`">Question Text</label>
            <input type="text" :id="`q-text-${qIndex}`" v-model="question.text" required />
          </div>
          <h4>Options</h4>
          <div v-for="(opt, oIndex) in question.options" :key="oIndex" class="option-editor">
            <input
              type="text"
              :id="`q-${qIndex}-opt-${oIndex}`"
              v-model="question.options[oIndex]"
              placeholder="Option text"
              required
            />
            <label :for="`q-${qIndex}-correct-${oIndex}`" class="correct-label">
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
            <button type="button" @click="removeOption(qIndex, oIndex)" class="btn-remove" :disabled="question.options.length <= 2">
              Remove
            </button>
          </div>
          <button type="button" @click="addOption(qIndex)" class="btn-add" :disabled="question.options.length >= 6">
            Add Option
          </button>
        </div>

        <button type="button" @click="addQuestion" class="btn-add-question">Add Question</button>

        <div v-if="error" class="status-message error">{{ error }}</div>
        <div v-if="successMessage" class="status-message success">{{ successMessage }}</div>

        <div class="form-actions">
          <button type="submit" class="btn primary" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Quiz' : 'Create Quiz') }}
          </button>
          <router-link :to="isEditMode ? { name: 'QuizDetail', params: { id: quizId } } : { name: 'QuizList' }" class="btn secondary">
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';

const route = useRoute();
const router = useRouter();
const quizId = route.params.id;
const isEditMode = computed(() => !!quizId);

const quizData = reactive({
  title: '',
  description: '',
  questions: [],
  timeLimit: null,
});

const isLoading = ref(false);
const error = ref(null);
const successMessage = ref('');

onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/api/quizzes/${quizId}`);
      Object.assign(quizData, {
        title: data.title,
        description: data.description,
        questions: data.questions.map(q => ({ text: q.text, options: [...q.options], correctOptionIndex: q.correctOption })),
        timeLimit: data.timeLimit || null,
      });
    } catch (err) {
      error.value = 'Could not load quiz data.';
    } finally {
      isLoading.value = false;
    }
  } else {
    addQuestion();
  }
});

const addQuestion = () => quizData.questions.push({ text: '', options: ['', '', '', ''], correctOptionIndex: null });
const removeQuestion = idx => quizData.questions.length > 1 && quizData.questions.splice(idx, 1);
const addOption = qi => quizData.questions[qi].options.length < 6 && quizData.questions[qi].options.push('');
const removeOption = (qi, oi) => {
  const q = quizData.questions[qi];
  if (q.options.length > 2) {
    q.options.splice(oi, 1);
    if (q.correctOptionIndex === oi) q.correctOptionIndex = null;
    else if (q.correctOptionIndex > oi) q.correctOptionIndex--;
  }
};

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = '';
  successMessage.value = '';

  // validation omitted for brevity
  const payload = {
    title: quizData.title,
    description: quizData.description,
    questions: quizData.questions.map(q => ({ text: q.text, options: q.options, correctOption: q.correctOptionIndex })),
    timeLimit: quizData.timeLimit ? parseInt(quizData.timeLimit, 10) : null,
  };

  try {
    const res = isEditMode.value
      ? await api.patch(`/api/quizzes/${quizId}`, payload)
      : await api.post('/api/quizzes', payload);
    successMessage.value = isEditMode.value ? 'Quiz updated!' : 'Quiz created!';
    setTimeout(() => router.push({ name: 'QuizDetail', params: { id: res.data._id || quizId } }), 1500);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save quiz.';
  } finally {
    isLoading.value = false;
  }
};
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

h1, h2, h3, h4 {
  text-align: center;
  font-family: var(--font-pixel);
  color: var(--bg-end);
}

.quiz-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group label {
  font-family: var(--font-pixel);
  color: var(--text);
}

input[type="text"], input[type="number"], textarea {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
}
input:focus, textarea:focus {
  outline: none;
  border-color: var(--bg-end);
}

.question-editor {
  background: rgba(255,255,255,0.9);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #ddd;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.btn-remove {
  background: none;
  border: 1px solid #e63946;
  color: #e63946;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
}
.btn-remove:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-editor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.correct-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-pixel);
}

.btn-add, .btn-add-question {
  align-self: flex-start;
  background: var(--bg-mid);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
  cursor: pointer;
  transition: background 0.2s;
}
.btn-add-question {
  background: var(--bg-end);
  color: #fff;
  align-self: center;
}
.btn-add:hover:not(:disabled) { background: var(--bg-end); color: #fff; }

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn {
  padding: 0.7rem 1.5rem;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
  border: none;
  cursor: pointer;
}
.btn.primary { background: var(--bg-end); color: #fff; }
.btn.secondary { background: var(--bg-mid); color: var(--text); }

.status-message {
  text-align: center;
  padding: 0.8rem;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
}
.status-message.error { background: #ffebee; color: #c62828; }
.status-message.success { background: #e8f5e9; color: #2e7d32; }
</style>