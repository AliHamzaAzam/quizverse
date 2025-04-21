<script setup>
import { ref, onMounted, computed } from 'vue'; // Import computed
import api from '@/utils/axios'; // Use the configured axios instance
import { useAuthStore } from '@/stores/auth'; // Import auth store

const quizzes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const auth = useAuthStore(); // Get auth store instance
const searchTerm = ref(''); // Add state for search term
const displayedQuizzes = ref([]); // Ref to hold quizzes actually displayed
const actionError = ref(null); // Ref for bookmark action errors

const fetchQuizzes = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/quizzes');
    quizzes.value = data;
    performSearch(); // Initialize displayed quizzes
  } catch (err) {
    error.value = 'Failed to load quizzes.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

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
  if (!searchTerm.value) {
    displayedQuizzes.value = quizzes.value; // Show all if search is empty
    return;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  // Ensure quiz.code exists before trying to access its properties
  displayedQuizzes.value = quizzes.value.filter(quiz =>
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


onMounted(fetchQuizzes);
</script>

<template>
  <div class="quiz-list-container">
    <h1>Available Quizzes</h1>

    <!-- Search and Add Quiz Section -->
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
         <button @click="performSearch" class="btn-search">Search</button> <!-- Add search button -->
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
.quiz-list-container {
  max-width: 900px; /* Wider container */
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
}

.controls-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 1rem; /* Add gap between items */
}

.search-container {
    flex-grow: 1; /* Allow search bar to take available space */
    min-width: 250px; /* Minimum width for the search bar */
    display: flex; /* Use flexbox to align input and button */
    gap: 0.5rem; /* Add space between input and button */
}

.search-input {
    width: 100%; /* Make input take full width of its container */
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; /* Include padding and border in element's total width */
    flex-grow: 1; /* Allow input to grow */
}

.btn-search {
    padding: 0.75rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
    white-space: nowrap;
}

.btn-search:hover {
    background-color: #0056b3;
}


.add-quiz-section {
    margin-bottom: 2rem;
    text-align: right;
}

.btn-add-quiz {
    padding: 0.75rem 1.5rem;
    background-color: #2a9d8f;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 1rem;
    transition: background-color 0.2s;
    border: none;
    cursor: pointer;
    white-space: nowrap; /* Prevent button text from wrapping */
}

.btn-add-quiz:hover {
    background-color: #268c7f;
}

.loading, .error-message, .no-quizzes {
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
  padding: 1rem; /* Ensure padding */
  margin-bottom: 1rem; /* Add margin */
  text-align: center;
}

.no-quizzes {
    color: #555;
}
.no-quizzes a {
    color: #4361ee;
    text-decoration: underline;
}

.no-quizzes button.btn-clear-search {
    background: none;
    border: none;
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
}


.quiz-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
}

.quiz-item {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.quiz-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.quiz-item h2 {
  margin-top: 0;
  margin-bottom: 0.5rem; /* Adjust margin */
  color: #333;
  font-size: 1.3rem; /* Slightly larger title */
}

.quiz-code {
    font-size: 0.95rem;
    color: #555;
    margin-bottom: 0.75rem; /* Add margin below code */
    background-color: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block; /* Make background fit content */
}

.quiz-code strong {
    color: #007bff; /* Highlight the code */
    font-family: monospace; /* Use monospace font for code */
}

.quiz-item p {
  color: #555;
  flex-grow: 1; /* Make description take available space */
  margin-bottom: 1rem;
  line-height: 1.5;
}

.created-by {
    font-size: 0.9rem;
    color: #777;
    margin-bottom: 1rem;
}

.quiz-actions {
  margin-top: auto; /* Push actions to the bottom */
  display: flex;
  flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
  gap: 0.75rem; /* Increased gap */
  align-items: center; /* Align buttons vertically */
}

.quiz-actions a {
  padding: 0.6rem 1.2rem; /* Adjusted padding */
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500; /* Slightly bolder text */
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  border: none;
}

.btn-take {
  background-color: #4361ee;
  color: white;
}
.btn-take:hover {
  background-color: #3a56d4;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-details {
    background-color: #e9ecef;
    color: #333;
    border: 1px solid #ced4da;
}
.btn-details:hover {
    background-color: #dee2e6;
}

.btn-edit {
    background-color: #ffb703;
    color: #333;
}
.btn-edit:hover {
    background-color: #fca311;
}

.btn-bookmark {
    padding: 0.6rem 1rem; /* Slightly smaller padding */
    border-radius: 4px;
    text-decoration: none;
    text-align: center;
    font-size: 0.85rem; /* Smaller font size */
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    border: 1px solid #6c757d; /* Default border */
    background-color: #fff;
    color: #6c757d;
    display: inline-flex; /* Align icon and text */
    align-items: center;
    gap: 0.4rem; /* Space between icon and text */
}

.btn-bookmark:hover {
    background-color: #f8f9fa;
    border-color: #5a6268;
    color: #5a6268;
}

.btn-bookmark.bookmarked {
    background-color: #ffc107; /* Yellow when bookmarked */
    border-color: #ffc107;
    color: #333;
}

.btn-bookmark.bookmarked:hover {
    background-color: #e0a800;
    border-color: #e0a800;
}

/* Add Font Awesome if not already included globally */
/* @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'); */

</style>
