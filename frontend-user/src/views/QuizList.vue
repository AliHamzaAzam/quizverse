<script setup>
import { ref, onMounted, computed, watch } from 'vue'; // Import computed and watch
import api from '@/utils/axios'; // Use the configured axios instance
import { useAuthStore } from '@/stores/auth'; // Import auth store

const quizzes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const auth = useAuthStore(); // Get auth store instance
const searchTerm = ref(''); // Add state for search term
const displayedQuizzes = ref([]); // Ref to hold quizzes actually displayed
const actionError = ref(null); // Ref for bookmark action errors

// --- Sorting State ---
const sortBy = ref('createdAt'); // Default sort: Newest first
const sortOrder = ref('desc'); // Default order: Descending

const fetchQuizzes = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/quizzes');
    quizzes.value = data;
    performSearch(); // Apply initial sort and filter
  } catch (err) {
    error.value = 'Failed to load quizzes.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// --- Computed property for sorting ---
const sortedQuizzes = computed(() => {
  const sorted = [...quizzes.value]; // Create a shallow copy to avoid mutating original
  sorted.sort((a, b) => {
    let valA = a[sortBy.value];
    let valB = b[sortBy.value];

    // Handle potential nested properties like createdBy.displayName if needed later
    // Handle date sorting for 'createdAt'
    if (sortBy.value === 'createdAt') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else if (typeof valA === 'string') {
      // Case-insensitive string comparison
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    let comparison = 0;
    if (valA > valB) {
      comparison = 1;
    } else if (valA < valB) {
      comparison = -1;
    }

    return sortOrder.value === 'desc' ? (comparison * -1) : comparison;
  });
  return sorted;
});

// Function to check if the current user created the quiz
const isCreator = (quiz) => {
    return auth.user && quiz.createdBy && auth.user._id === quiz.createdBy._id;
};

// Computed property to check if a quiz is bookmarked
const isBookmarked = (quizId) => {
    return auth.bookmarkedQuizIds.includes(quizId);
};

// Function to toggle bookmark status
const toggleBookmark = async (quizId) => {
    actionError.value = null; // Clear previous error
    try {
        if (isBookmarked(quizId)) {
            await auth.removeBookmark(quizId);
        } else {
            await auth.addBookmark(quizId);
        }
        // No need to manually update local state if auth store is reactive
    } catch (err) {
        console.error('Failed to toggle bookmark:', err);
        actionError.value = err.message || 'Could not update bookmark.';
        // Clear error after some time
        setTimeout(() => { actionError.value = null; }, 3000);
    }
};

// Function to filter quizzes based on search term and update displayedQuizzes
const performSearch = () => {
  // Now filter the sorted list
  const sourceList = sortedQuizzes.value;
  if (!searchTerm.value) {
    displayedQuizzes.value = sourceList; // Show all sorted if search is empty
    return;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  // Ensure quiz.code exists before trying to access its properties
  displayedQuizzes.value = sourceList.filter(quiz =>
    quiz.title.toLowerCase().includes(lowerSearchTerm) ||
    (quiz.code && quiz.code.toLowerCase().includes(lowerSearchTerm))
  );
};

// Trigger search on Enter key press in the input field
const handleSearchInputKeydown = (event) => {
  if (event.key === 'Enter') {
    performSearch();
  }
};

// --- Watch for changes in sort options ---
watch([sortBy, sortOrder], () => {
  performSearch(); // Re-apply sorting and filtering
});

onMounted(fetchQuizzes);
</script>

<template>
  <div class="quiz-list-container">
    <h1>Available Quizzes</h1>

    <!-- Search, Sort, and Add Quiz Section -->
    <div class="controls-section">
       <!-- Search Input and Button -->
       <div class="search-container">
         <input
           type="text"
           v-model="searchTerm"
           placeholder="Search by title or code..."
           class="search-input"
           @keydown="handleSearchInputKeydown"
         />
         <button @click="performSearch" class="btn-search">Search</button>
       </div>

       <!-- Sorting Controls -->
       <div class="sort-container">
         <label for="sort-by">Sort by:</label>
         <select id="sort-by" v-model="sortBy" class="sort-select">
           <option value="title">Title</option>
           <option value="createdAt">Date Created</option>
           <!-- Add more options later if needed, e.g., popularity -->
         </select>
         <select v-model="sortOrder" class="sort-select">
           <option value="asc">Ascending</option>
           <option value="desc">Descending</option>
         </select>
       </div>

       <!-- Add Quiz Button -->
       <router-link to="/quizzes/new" class="btn-add-quiz">Create New Quiz</router-link>
    </div>


    <div v-if="isLoading" class="loading">Loading quizzes...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <!-- Display bookmark action error -->
    <div v-if="actionError" class="error-message">{{ actionError }}</div>

    <!-- Use displayedQuizzes in the v-for loop -->
    <ul v-if="!isLoading && !error && displayedQuizzes.length > 0" class="quiz-list">
      <li v-for="quiz in displayedQuizzes" :key="quiz._id" class="quiz-item">
        <h2>{{ quiz.title }}</h2>
        <p class="quiz-code">Code: <strong>{{ quiz.code }}</strong></p> <!-- Display quiz code -->
        <p>{{ quiz.description }}</p>
        <p class="created-by">Created by: {{ quiz.createdBy?.displayName || 'Unknown' }}</p>
        <div class="quiz-actions">
          <router-link :to="`/quizzes/${quiz._id}/attempt`" class="btn-take">Take Quiz</router-link>
           <!-- Add link to view details/leaderboard -->
          <router-link :to="`/quizzes/${quiz._id}`" class="btn-details">View Details</router-link>
          <!-- Add Edit button only if user is the creator -->
          <router-link v-if="isCreator(quiz)" :to="`/quizzes/${quiz._id}/edit`" class="btn-edit">Edit</router-link>
          <!-- Bookmark Button -->
          <button @click="toggleBookmark(quiz._id)" :class="['btn-bookmark', { 'bookmarked': isBookmarked(quiz._id) }]">
            <i :class="isBookmarked(quiz._id) ? 'fas fa-bookmark' : 'far fa-bookmark'"></i> <!-- Font Awesome icons -->
            {{ isBookmarked(quiz._id) ? 'Bookmarked' : 'Bookmark' }}
          </button>
        </div>
      </li>
    </ul>
     <!-- Update message for no results -->
     <div v-if="!isLoading && !error && displayedQuizzes.length === 0 && searchTerm" class="no-quizzes">
        No quizzes found matching "{{ searchTerm }}". <button @click="searchTerm = ''; performSearch();" class="btn-clear-search">Clear Search</button>
    </div>
     <div v-else-if="!isLoading && !error && quizzes.length === 0" class="no-quizzes">
        No quizzes available yet. Why not <router-link to="/quizzes/new">create one</router-link>?
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.quiz-list-container {
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

.controls-section {
    display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.search-container {
  flex: 1;
  min-width: 300px;
  display: flex;
  gap: 1rem;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  font-size: 1.1rem;
  font-family: 'Outfit', sans-serif;
  color: #4c1d95;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.btn-search {
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
    cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-search:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.sort-container {
    display: flex;
    align-items: center;
  gap: 1rem;
  min-width: 300px;
}

.sort-container label {
  color: #4c1d95;
  font-weight: 600;
  font-size: 1.1rem;
}

.sort-select {
  padding: 0.8rem 1.2rem;
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  color: #4c1d95;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.btn-add-quiz {
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
    color: white;
    text-decoration: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.btn-add-quiz:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.quiz-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1.5rem;
}

.quiz-item {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  transition: all 0.3s ease;
}

.quiz-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
}

.quiz-item h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  color: #4c1d95;
  font-weight: 700;
}

.quiz-code {
  color: #5b21b6;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.quiz-code strong {
  background: rgba(124, 58, 237, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-family: 'Outfit', monospace;
}

.created-by {
  color: #6b21a8;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.quiz-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.quiz-actions a, .quiz-actions button {
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
}

.btn-take {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-take:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-details {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-details:hover {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-edit {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-edit:hover {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-bookmark {
  background: #ede9fe;
  color: #7c3aed;
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

.loading, .error-message, .no-quizzes {
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

.btn-clear-search {
  background: none;
  border: none;
  color: #7c3aed;
  text-decoration: underline;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  padding: 0;
  margin-left: 0.5rem;
}

.btn-clear-search:hover {
  color: #4c1d95;
}

@media (max-width: 768px) {
  .quiz-list-container {
    margin: 1.5rem;
    padding: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  .controls-section {
    flex-direction: column;
  }

  .search-container, .sort-container {
    width: 100%;
  }

  .btn-add-quiz {
    width: 100%;
    text-align: center;
  }

  .quiz-actions {
    flex-direction: column;
  }

  .quiz-actions a, .quiz-actions button {
    width: 100%;
    text-align: center;
  }
}
</style>
