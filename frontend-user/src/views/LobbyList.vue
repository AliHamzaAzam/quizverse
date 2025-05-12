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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.lobby-list-container {
  padding: 2.5rem;
  max-width: 800px;
  margin: 2.5rem auto;
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
  text-align: center;
  color: #7c3aed;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.lobby-action-section {
  margin-bottom: 2.5rem;
  padding: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.lobby-action-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #5b21b6;
  font-weight: 500;
  font-size: 1.1rem;
}

input, select {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #4c1d95;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  transition: all 0.3s ease;
}

input:focus, select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

input::placeholder {
  color: #a78bfa;
}

.error-message {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.info-message {
  color: #5b21b6;
  background: rgba(124, 58, 237, 0.06);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  font-size: 0.95rem;
}

.info-message a {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.info-message a:hover {
  color: #4c1d95;
  text-decoration: underline;
}

.btn {
  width: 100%;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
}

.btn:disabled {
  opacity: 0.7;
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

@media (max-width: 768px) {
  .lobby-list-container {
    padding: 1.5rem;
    margin: 1.5rem;
  }

  h1 {
    font-size: 2rem;
}

  h2 {
    font-size: 1.5rem;
}

  .lobby-action-section {
    padding: 1.5rem;
}

  .btn {
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
  }
}
</style>
