<template>
  <div class="view-container">
    <div class="content-wrapper">
      <h1>Available Quizzes</h1>

      <div class="controls-section">
        <div class="search-container">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Search by title or code..."
            class="search-input"
            @keydown="handleSearchInputKeydown"
          />
          <button @click="performSearch" class="btn primary btn-search">Search</button>
        </div>
        <div class="sort-container">
          <label for="sort-by">Sort by:</label>
          <select id="sort-by" v-model="sortBy" class="sort-select">
            <option value="title">Title</option>
            <option value="createdAt">Date Created</option>
          </select>
          <select v-model="sortOrder" class="sort-select">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <router-link to="/quizzes/new" class="btn primary btn-add-quiz">Create New Quiz</router-link>
      </div>

      <div v-if="isLoading" class="status-message">Loading quizzes...</div>
      <div v-if="error" class="status-message error">{{ error }}</div>
      <div v-if="actionError" class="status-message error">{{ actionError }}</div>

      <ul v-if="!isLoading && !error && displayedQuizzes.length > 0" class="quiz-list">
        <li v-for="quiz in displayedQuizzes" :key="quiz._id" class="quiz-item">
          <h2>{{ quiz.title }}</h2>
          <p class="quiz-code">Code: <strong>{{ quiz.code }}</strong></p>
          <p class="description">{{ quiz.description }}</p>
          <p class="created-by">Created by: {{ quiz.createdBy?.displayName || 'Unknown' }}</p>
          <div class="quiz-actions">
            <router-link :to="`/quizzes/${quiz._id}/attempt`" class="btn primary">Take Quiz</router-link>
            <router-link :to="`/quizzes/${quiz._id}`" class="btn secondary">View Details</router-link>
            <router-link v-if="isCreator(quiz)" :to="`/quizzes/${quiz._id}/edit`" class="btn secondary">Edit</router-link>
            <button
              @click="toggleBookmark(quiz._id)"
              :class="['btn bookmark-btn', { bookmarked: isBookmarked(quiz._id) }]"
            >
              <i :class="isBookmarked(quiz._id) ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
              {{ isBookmarked(quiz._id) ? 'Bookmarked' : 'Bookmark' }}
            </button>
          </div>
        </li>
      </ul>

      <div v-if="!isLoading && !error && displayedQuizzes.length === 0 && searchTerm" class="status-message">
        No quizzes found matching "{{ searchTerm }}".
        <button @click="searchTerm=''; performSearch()" class="btn secondary link-btn">Clear Search</button>
      </div>
      <div v-else-if="!isLoading && !error && quizzes.length === 0" class="status-message">
        No quizzes available yet. <router-link to="/quizzes/new" class="link-btn">Create one now!</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import api from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';

const quizzes = ref([]);
const displayedQuizzes = ref([]);
const searchTerm = ref('');
const isLoading = ref(true);
const error = ref(null);
const actionError = ref(null);
const sortBy = ref('createdAt');
const sortOrder = ref('desc');

const auth = useAuthStore();

const fetchQuizzes = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/quizzes');
    quizzes.value = data;
    performSearch();
  } catch {
    error.value = 'Failed to load quizzes.';
  } finally {
    isLoading.value = false;
  }
};

const sortedQuizzes = computed(() => {
  return [...quizzes.value].sort((a, b) => {
    let valA = sortBy.value === 'createdAt' ? new Date(a[sortBy.value]) : a[sortBy.value].toString().toLowerCase();
    let valB = sortBy.value === 'createdAt' ? new Date(b[sortBy.value]) : b[sortBy.value].toString().toLowerCase();
    let cmp = valA > valB ? 1 : valA < valB ? -1 : 0;
    return sortOrder.value === 'desc' ? -cmp : cmp;
  });
});

const isCreator = (q) => auth.user && q.createdBy?._id === auth.user._id;
const isBookmarked = (id) => auth.bookmarkedQuizIds.includes(id);

const toggleBookmark = async (id) => {
  actionError.value = null;
  try {
    if (isBookmarked(id)) await auth.removeBookmark(id);
    else await auth.addBookmark(id);
  } catch {
    actionError.value = 'Could not update bookmark.';
    setTimeout(() => (actionError.value = null), 3000);
  }
};

const performSearch = () => {
  const list = sortedQuizzes.value;
  if (!searchTerm.value) return (displayedQuizzes.value = list);
  const term = searchTerm.value.toLowerCase();
  displayedQuizzes.value = list.filter(q =>
    q.title.toLowerCase().includes(term) ||
    q.code?.toLowerCase().includes(term)
  );
};

const handleSearchInputKeydown = (e) => { if (e.key === 'Enter') performSearch(); };
watch([sortBy, sortOrder], performSearch);

onMounted(fetchQuizzes);
</script>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: 2rem;
  background: transparent;
}
.content-wrapper {
  max-width: 900px;
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
  margin-bottom: 1.5rem;
}

.status-message, .loading, .error-message {
  text-align: center;
  padding: 1rem;
  font-family: var(--font-pixel);
}
.error-message { color: #c62828; }

.controls-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-container {
  flex: 1;
  display: flex;
  gap: 0.5rem;
}
.search-input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid var(--bg-mid);
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
}
.search-input:focus {
  outline: none;
  border-color: var(--bg-end);
}
.btn-search {
  padding: 0.6rem 1rem;
}

.sort-container {
  display: flex;
  gap: 0.5rem;
  font-family: var(--font-pixel);
}
.sort-select {
  padding: 0.5rem;
  border: 1px solid var(--bg-mid);
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
}

.btn-add-quiz {
  padding: 0.6rem 1.2rem;
}

.quiz-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.quiz-item {
  background: rgba(255,255,255,0.9);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.quiz-item h2 {
  margin: 0;
  color: var(--bg-end);
  font-family: var(--font-pixel);
  margin-bottom: 0.5rem;
}
.quiz-code {
  background: var(--bg-mid);
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
  margin-bottom: 0.75rem;
}

.description {
  flex: 1;
  color: var(--text);
  margin-bottom: 1rem;
  font-family: var(--font-pixel);
}

.created-by {
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: 1rem;
  font-family: var(--font-pixel);
}

.quiz-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
}

.btn {
  padding: 0.5rem 1rem;
  font-family: var(--font-pixel);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  border: none;
}
.btn.primary { background: var(--bg-end); color: #fff; }
.btn.primary:hover { background: var(--bg-mid); }
.btn.secondary { background: var(--bg-mid); color: var(--text); }
.btn.secondary:hover { background: var(--bg-start); }

.bookmark-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1px solid var(--bg-mid);
  color: var(--text);
}
.bookmark-btn:hover { background: var(--bg-mid); }
.bookmark-btn.bookmarked { background: var(--bg-end); color: #fff; }

.link-btn {
  background: none;
  color: var(--bg-end);
  text-decoration: underline;
  padding: 0.5rem;
}

</style>
