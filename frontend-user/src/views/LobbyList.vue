<template>
  <div class="lobby-list-container">
    <h1>Quiz Lobbies</h1>

    <!-- Create Lobby Section -->
    <section class="lobby-action-section">
      <h2>Create a New Lobby</h2>
      <div v-if="createError" class="error-message">{{ createError }}</div>
      <form @submit.prevent="handleCreateLobby">
        <div class="form-group">
          <label for="quiz-select">Select Quiz:</label>
          <select id="quiz-select" v-model="selectedQuizId" required :disabled="isLoadingMyQuizzes">
            <option disabled value="">{{ isLoadingMyQuizzes ? 'Loading quizzes...' : 'Please select a quiz' }}</option>
            <option v-for="quiz in myQuizzes" :key="quiz._id" :value="quiz._id">
              {{ quiz.title }}
            </option>
          </select>
           <p v-if="!isLoadingMyQuizzes && myQuizzes.length === 0" class="info-message">
             You haven't created any quizzes yet. <router-link to="/quizzes/new">Create one now!</router-link>
           </p>
        </div>
        <div class="form-group">
          <label for="participant-limit">Participant Limit:</label>
          <input type="number" id="participant-limit" v-model.number="participantLimit" min="1" max="100" required />
        </div>
        <!-- TODO: Add options for auto-start time if needed -->
        <button type="submit" :disabled="!selectedQuizId || isLoadingCreate" class="btn btn-primary">
          {{ isLoadingCreate ? 'Creating...' : 'Create Lobby' }}
        </button>
      </form>
    </section>

    <!-- Join Lobby Section -->
    <section class="lobby-action-section">
      <h2>Join a Lobby</h2>
       <div v-if="joinError" class="error-message">{{ joinError }}</div>
       <!-- Update the submit handler -->
      <form @submit.prevent="() => handleJoinLobby()">
        <div class="form-group">
          <label for="join-code">Lobby ID or Invite Code:</label>
          <input type="text" id="join-code" v-model.trim="joinCode" required placeholder="Enter ID or Code"/>
        </div>
        <button type="submit" :disabled="!joinCode || isLoadingJoin" class="btn btn-secondary">
           {{ isLoadingJoin ? 'Joining...' : 'Join Lobby' }}
        </button>
      </form>
    </section>

     <!-- TODO: Implement List of Active Lobbies (Requires backend endpoint) -->
     <!--
     <section class="active-lobbies-section">
       <h2>Active Lobbies</h2>
       <div v-if="isLoadingLobbies">Loading lobbies...</div>
       <div v-else-if="fetchLobbiesError" class="error-message">{{ fetchLobbiesError }}</div>
       <ul v-else-if="activeLobbies.length > 0">
         <li v-for="lobby in activeLobbies" :key="lobby._id">
            {{ lobby.quiz?.title || 'Lobby ' + lobby._id }} - Host: {{ lobby.host?.displayName || 'Unknown' }}
            <button @click="handleJoinLobby(lobby._id)">Join</button>
         </li>
       </ul>
       <p v-else>No active lobbies found.</p>
     </section>
     -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/axios';
// import { useAuthStore } from '@/stores/auth'; // If needed for user ID, but axios interceptor handles auth

const router = useRouter();
// const auth = useAuthStore();

const myQuizzes = ref([]);
const selectedQuizId = ref('');
const participantLimit = ref(10); // Add ref for participant limit, default to 10
const joinCode = ref(''); // Can be Lobby ID or Invite Code

const isLoadingMyQuizzes = ref(false);
const isLoadingCreate = ref(false);
const isLoadingJoin = ref(false);
// const isLoadingLobbies = ref(false); // For future lobby list

const createError = ref(null);
const joinError = ref(null);
// const fetchLobbiesError = ref(null); // For future lobby list
// const activeLobbies = ref([]); // For future lobby list

// Fetch quizzes created by the logged-in user
const fetchMyQuizzes = async () => {
  isLoadingMyQuizzes.value = true;
  createError.value = null; // Clear previous errors
  try {
    const { data } = await api.get('/api/quizzes/my-quizzes');
    myQuizzes.value = data;
  } catch (err) {
    console.error('Failed to fetch user quizzes:', err);
    createError.value = 'Could not load your quizzes. Please try again later.';
  } finally {
    isLoadingMyQuizzes.value = false;
  }
};

// Handle lobby creation
const handleCreateLobby = async () => {
  if (!selectedQuizId.value || !participantLimit.value) return;
  isLoadingCreate.value = true;
  createError.value = null;
  try {
    // Include participantLimit in the request body
    const { data: newLobby } = await api.post('/api/lobby', {
        quizId: selectedQuizId.value,
        participantLimit: participantLimit.value
    });
    // Navigate to the newly created lobby view
    router.push({ name: 'LobbyView', params: { id: newLobby._id } });
  } catch (err) {
    console.error('Failed to create lobby:', err);
    createError.value = err.response?.data?.message || 'Failed to create lobby.';
  } finally {
    isLoadingCreate.value = false;
  }
};

// Handle joining a lobby (by ID or Invite Code)
const handleJoinLobby = async (lobbyIdOrCode = joinCode.value) => {
    if (!lobbyIdOrCode) return;
    isLoadingJoin.value = true;
    joinError.value = null;

    try {
        let lobbyData;
        // Basic check: MongoDB IDs are typically 24 hex chars. Invite codes are shorter (8 hex chars in backend).
        // This isn't foolproof but helps differentiate common cases.
        if (lobbyIdOrCode.length === 24 && /^[0-9a-fA-F]+$/.test(lobbyIdOrCode)) {
            // Assume it's a Lobby ID
            const { data } = await api.post(`/api/lobby/${lobbyIdOrCode}/join`);
            lobbyData = data;
        } else {
            // Assume it's an Invite Code
            const { data } = await api.post(`/api/lobby/invite/${lobbyIdOrCode}/join`);
            lobbyData = data;
        }
        // Navigate to the joined lobby view
        router.push({ name: 'LobbyView', params: { id: lobbyData._id } });

    } catch (err) {
        console.error('Failed to join lobby:', err);
        joinError.value = err.response?.data?.message || `Failed to join lobby with "${lobbyIdOrCode}". Check the ID/code and try again.`;
         if (err.response?.status === 404) {
             joinError.value = `Lobby or Invite Code "${lobbyIdOrCode}" not found or expired.`;
         } else if (err.response?.status === 409) {
             joinError.value = 'This lobby is full.';
         } else if (err.response?.status === 400) {
             // Could be 'Already joined' or 'Lobby not waiting'
             joinError.value = err.response?.data?.message || 'Cannot join this lobby at this time.';
         }
    } finally {
        isLoadingJoin.value = false;
    }
};


// Fetch necessary data when component mounts
onMounted(() => {
  fetchMyQuizzes();
  // TODO: Fetch active lobbies when backend endpoint is available
  // fetchActiveLobbies();
});

</script>

<style scoped>
.lobby-list-container {
  padding: 20px;
  max-width: 600px;
  margin: 20px auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1, h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

.lobby-action-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 6px;
  background-color: #fdfdfd;
}

.lobby-action-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.4em;
  color: #444;
  text-align: left;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

input[type="text"],
input[type="number"],
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Include padding and border in element's total width/height */
  font-size: 1rem;
}

select {
   cursor: pointer;
}

select:disabled {
    background-color: #eee;
    cursor: not-allowed;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s ease;
  display: inline-block; /* Ensure buttons align well */
  width: 100%; /* Make buttons take full width of their container */
  margin-top: 0.5rem; /* Add some space above the button */
}

.btn-primary {
  background-color: #4CAF50; /* Green */
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #007bff; /* Blue */
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #0056b3;
}


.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #dc3545; /* Red */
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.info-message {
    font-size: 0.9em;
    color: #666;
    margin-top: 0.5rem;
}

/* Styles for future lobby list */
.active-lobbies-section {
    margin-top: 2rem;
}
.active-lobbies-section ul {
    list-style: none;
    padding: 0;
}
.active-lobbies-section li {
    padding: 0.8rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.active-lobbies-section li:last-child {
    border-bottom: none;
}
.active-lobbies-section button {
    padding: 0.3rem 0.6rem;
    font-size: 0.9em;
    background-color: #6c757d; /* Grey */
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}
.active-lobbies-section button:hover {
    background-color: #5a6268;
}

</style>
