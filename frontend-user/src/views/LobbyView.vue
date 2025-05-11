<template>
  <div class="lobby-view-container">
    <h1>Lobby: {{ lobbyData?.quiz?.title || lobbyId }}</h1>
    <div v-if="isLoading">Loading lobby...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="lobbyData">
      <div class="lobby-details">
        <p><strong>Status:</strong> <span :class="`status-${lobbyData.status}`">{{ lobbyData.status }}</span></p>
        <p><strong>Host:</strong> {{ lobbyData.host?.displayName || 'Unknown' }}</p>
        <p><strong>Quiz:</strong> {{ lobbyData.quiz?.title || 'Loading...' }}</p>
        <p v-if="lobbyData.quiz?.timeLimit"><strong>Time Limit:</strong> {{ lobbyData.quiz.timeLimit }} minutes</p>
      </div>

      <h3>Participants ({{ lobbyData.participants?.length || 0 }} / {{ lobbyData.participantLimit }}):</h3>
      <ul v-if="lobbyData.participants?.length > 0" class="participant-list">
        <li v-for="participant in lobbyData.participants" :key="participant._id" class="participant-item">
          <img v-if="participant.avatar" :src="participant.avatar" alt="Avatar" class="participant-avatar">
          <span class="participant-name">{{ participant.displayName || 'Unnamed User' }}</span>
          <span v-if="participant._id === lobbyData.host?._id" class="host-tag">(Host)</span>
        </li>
      </ul>
      <p v-else>No participants yet.</p>

      <!-- Host Actions (Waiting State) -->
      <div v-if="isHost && lobbyData.status === 'waiting'" class="host-actions">
         <button @click="handleStartLobby" :disabled="isLoadingStart || lobbyData.participants?.length < 1" class="btn btn-start">
           {{ isLoadingStart ? 'Starting...' : 'Start Lobby' }}
         </button>
         <button @click="handleGenerateInvite" :disabled="isLoadingInvite" class="btn btn-invite">
            {{ isLoadingInvite ? 'Generating...' : 'Generate Invite Code' }}
         </button>
         <div v-if="inviteCode" class="invite-code-display">
            Invite Code: <strong>{{ inviteCode }}</strong> (Expires: {{ formatExpiry(inviteExpiry) }})
         </div>
         <div v-if="inviteError" class="error-message">{{ inviteError }}</div>
      </div>

       <!-- General Actions (Waiting State) -->
      <div v-if="lobbyData.status === 'waiting' && !isHost" class="participant-actions">
          <p>Waiting for the host to start the quiz...</p>
      </div>
      <div v-if="lobbyData.status === 'waiting'" class="leave-action">
           <button @click="handleLeaveLobby" :disabled="isLoadingLeave" class="btn btn-leave">
             {{ isLoadingLeave ? 'Leaving...' : 'Leave Lobby' }}
           </button>
           <div v-if="leaveError" class="error-message">{{ leaveError }}</div>
      </div>

      <!-- Started State -->
      <div v-if="lobbyData.status === 'started'" class="started-section">
        <p>The quiz has started!</p>
        <!-- Link to the actual quiz attempt page -->
        <router-link :to="{ name: 'QuizAttempt', params: { id: lobbyData.quiz._id } }" class="btn btn-take-quiz">
          Go to Quiz
        </router-link>
        <!-- Optionally show live scores/progress here later -->
      </div>

      <!-- Ended State -->
      <div v-if="lobbyData.status === 'ended'" class="ended-section">
        <h2>Quiz Ended</h2>
        <div v-if="isLoadingStats">Loading results...</div>
        <div v-else-if="statsError" class="error-message">{{ statsError }}</div>
        <div v-else-if="attemptsData.length > 0">
          <h3>Leaderboard</h3>
          <ol class="leaderboard-list">
            <li v-for="attempt in attemptsData" :key="attempt._id">
              <img v-if="attempt.user?.avatar" :src="attempt.user.avatar" alt="Avatar" class="participant-avatar">
              {{ attempt.user?.displayName || 'Unknown' }} - Score: {{ attempt.score }}
            </li>
          </ol>
        </div>
        <p v-else>No attempts were recorded for this lobby.</p>
         <router-link :to="{ name: 'LobbyList' }" class="btn btn-back">Back to Lobbies</router-link>
      </div>

    </div>
     <p v-else-if="!isLoading">Lobby data not available or lobby ended unexpectedly.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';
import { getSocket, connectSocket, disconnectSocket } from '@/utils/socket'; // Import socket utils

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const socket = getSocket(); // Get socket instance

const lobbyData = ref(null);
const attemptsData = ref([]);
const isLoading = ref(false);
const isLoadingStart = ref(false);
const isLoadingInvite = ref(false);
const isLoadingLeave = ref(false);
const isLoadingStats = ref(false);
const error = ref(null);
const startError = ref(null);
const inviteError = ref(null);
const leaveError = ref(null);
const statsError = ref(null);

const inviteCode = ref(null);
const inviteExpiry = ref(null);

const lobbyId = computed(() => props.id);
// Ensure lobbyData and host are checked before accessing _id
const isHost = computed(() => lobbyData.value?.host?._id === auth.user?._id);

// --- Socket Event Handlers ---
const handleLobbyUpdate = (updatedLobbyData) => {
  console.log('Socket event: lobby_updated', updatedLobbyData);
  if (updatedLobbyData._id === lobbyId.value) {
    lobbyData.value = updatedLobbyData;
    // Clear specific errors if the state potentially resolves them
    error.value = null;
    startError.value = null;
    inviteError.value = null;
    leaveError.value = null;
  }
};

const handleLobbyStarted = (startedLobbyData) => {
  console.log('Socket event: lobby_started', startedLobbyData);
  if (startedLobbyData._id === lobbyId.value) {
    lobbyData.value = startedLobbyData; // Update data
    error.value = null; // Clear general errors
    // No need to navigate here, UI changes based on status
  }
};

const handleLobbyEnded = (data) => {
  console.log('Socket event: lobby_ended', data);
  if (data.lobbyId === lobbyId.value) {
    // Update status locally first for immediate feedback
    if (lobbyData.value) {
        lobbyData.value.status = 'ended';
    }
    error.value = `Lobby ended: ${data.reason || 'Unknown reason'}`;
    // Fetch final stats
    fetchLobbyStats();
  }
};

// --- API Calls & Actions ---
const fetchLobbyDetails = async () => {
  isLoading.value = true;
  error.value = null;
  lobbyData.value = null;
  attemptsData.value = [];
  try {
    // Use the stats endpoint initially as it returns populated data
    const { data } = await api.get(`/api/lobby/${lobbyId.value}/stats`);
    lobbyData.value = data.lobby;
    attemptsData.value = data.attempts; // Store attempts if already ended/started

    // Connect and join socket room after fetching initial data
    connectSocket();
    socket.emit('join_lobby', lobbyId.value);

    // Set up listeners after joining
    socket.on('lobby_updated', handleLobbyUpdate);
    socket.on('lobby_started', handleLobbyStarted);
    socket.on('lobby_ended', handleLobbyEnded);

  } catch (err) {
    console.error('Failed to fetch lobby details:', err);
    error.value = err.response?.data?.message || 'Could not load lobby details.';
     if (err.response?.status === 404) {
        error.value = 'Lobby not found.';
        lobbyData.value = null; // Ensure lobbyData is null on 404
     }
  } finally {
    isLoading.value = false;
  }
};

const handleStartLobby = async () => {
  isLoadingStart.value = true;
  startError.value = null;
  error.value = null;
  try {
    // API call will trigger socket event, no need to update lobbyData directly here
    await api.post(`/api/lobby/${lobbyId.value}/start`);
    // Socket listener 'handleLobbyStarted' or 'handleLobbyUpdate' will update the state
  } catch (err) {
    console.error('Failed to start lobby:', err);
    startError.value = err.response?.data?.message || 'Could not start the lobby.';
    error.value = startError.value;
  } finally {
    isLoadingStart.value = false;
  }
};

const handleGenerateInvite = async () => {
    isLoadingInvite.value = true;
    inviteError.value = null;
    error.value = null;
    inviteCode.value = null;
    inviteExpiry.value = null;
    try {
        const { data } = await api.post(`/api/lobby/${lobbyId.value}/invite`);
        inviteCode.value = data.code;
        inviteExpiry.value = data.expiresAt;
    } catch (err) {
        console.error('Failed to generate invite code:', err);
        inviteError.value = err.response?.data?.message || 'Could not generate invite code.';
        error.value = inviteError.value;
    } finally {
        isLoadingInvite.value = false;
    }
};

const handleLeaveLobby = async () => {
    isLoadingLeave.value = true;
    leaveError.value = null;
    error.value = null;
    try {
        socket.emit('leave_lobby', lobbyId.value); // Inform server socket is leaving room
        await api.post(`/api/lobby/${lobbyId.value}/leave`);
        // Navigate away after successful leave
        router.push({ name: 'LobbyList' });
    } catch (err) {
        console.error('Failed to leave lobby:', err);
        leaveError.value = err.response?.data?.message || 'Could not leave the lobby.';
        error.value = leaveError.value;
        // Re-join socket room if API call failed?
        socket.emit('join_lobby', lobbyId.value);
    } finally {
        isLoadingLeave.value = false;
    }
};

// Fetch final stats when lobby ends
const fetchLobbyStats = async () => {
    isLoadingStats.value = true;
    statsError.value = null;
    try {
        const { data } = await api.get(`/api/lobby/${lobbyId.value}/stats`);
        // Update lobby data just in case, though status should be ended
        lobbyData.value = data.lobby;
        attemptsData.value = data.attempts;
    } catch (err) {
        console.error('Failed to fetch final lobby stats:', err);
        statsError.value = err.response?.data?.message || 'Could not load final results.';
    } finally {
        isLoadingStats.value = false;
    }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchLobbyDetails();
});

onUnmounted(() => {
  if (socket) {
    // Remove specific listeners for this component instance
    socket.off('lobby_updated', handleLobbyUpdate);
    socket.off('lobby_started', handleLobbyStarted);
    socket.off('lobby_ended', handleLobbyEnded);

    // Leave the room when component is unmounted
    if (lobbyId.value) {
        socket.emit('leave_lobby', lobbyId.value);
    }
    // Consider disconnecting socket if user navigates away entirely from lobby features
    // disconnectSocket(); // Or manage connection globally in App.vue or store
  }
});

// --- Utility Functions ---
const formatExpiry = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleTimeString();
    } catch (e) {
        return 'Invalid Date';
    }
};

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.lobby-view-container {
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

h2, h3 {
  color: #7c3aed;
  margin: 1.5rem 0;
  font-weight: 700;
}

h2 {
  font-size: 2rem;
}

h3 {
  font-size: 1.5rem;
}

.lobby-details {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.lobby-details p {
  margin: 0.8rem 0;
  color: #5b21b6;
  font-size: 1.1rem;
}

.lobby-details strong {
  color: #7c3aed;
  font-weight: 600;
}

.status-waiting {
  color: #8b5cf6;
  font-weight: 600;
}

.status-started {
  color: #7c3aed;
  font-weight: 600;
}

.status-ended {
  color: #4c1d95;
  font-weight: 600;
}

.participant-list {
    list-style: none;
    padding: 0;
  margin: 1rem 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.participant-item {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 12px;
    display: flex;
    align-items: center;
  gap: 1rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.participant-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.12);
}

.participant-avatar {
  width: 40px;
  height: 40px;
    border-radius: 50%;
    object-fit: cover;
  border: 2px solid #7c3aed;
}

.participant-name {
  color: #5b21b6;
  font-weight: 500;
}

.host-tag {
  color: #7c3aed;
  font-weight: 600;
  margin-left: 0.5rem;
}

.host-actions, .participant-actions, .leave-action {
  margin: 2rem 0;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.invite-code-display {
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(124, 58, 237, 0.06);
  border-radius: 8px;
  color: #5b21b6;
  font-size: 1.1rem;
}

.invite-code-display strong {
  color: #7c3aed;
  font-weight: 600;
}

.error-message {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-weight: 500;
}

.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
  margin: 0.5rem;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-start {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-start:hover:not(:disabled) {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-invite {
  background: #ede9fe;
  color: #7c3aed;
}

.btn-invite:hover:not(:disabled) {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.btn-leave {
  background: linear-gradient(45deg, #f472b6, #a21caf);
  color: white;
}

.btn-leave:hover:not(:disabled) {
  background: linear-gradient(45deg, #a21caf, #f472b6);
  transform: translateY(-2px);
}

.btn-take-quiz {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  text-decoration: none;
  display: inline-block;
}

.btn-take-quiz:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-back {
  background: #ede9fe;
  color: #7c3aed;
  text-decoration: none;
  display: inline-block;
}

.btn-back:hover {
  background: #c4b5fd;
  color: #4c1d95;
  transform: translateY(-2px);
}

.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

.leaderboard-list li {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  margin: 0.8rem 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  transition: transform 0.3s ease;
}

.leaderboard-list li:hover {
  transform: translateX(5px);
}

@media (max-width: 768px) {
  .lobby-view-container {
    padding: 1.5rem;
    margin: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.8rem;
  }

  h3 {
    font-size: 1.3rem;
  }

  .lobby-details, .host-actions, .participant-actions, .leave-action {
    padding: 1.5rem;
  }

  .participant-list {
    grid-template-columns: 1fr;
  }

  .btn {
    width: 100%;
    margin: 0.5rem 0;
}
}
</style>
