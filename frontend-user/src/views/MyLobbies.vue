<template>
  <div class="my-lobbies-container">
    <h1>My Hosted Lobbies</h1>
    <div v-if="isLoading" class="loading-message">Loading your lobbies...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <ul v-else-if="lobbies.length > 0" class="lobby-list">
      <li v-for="lobby in lobbies" :key="lobby._id" class="lobby-item">
        <div class="lobby-info">
          <span class="quiz-title">Quiz: {{ lobby.quiz?.title || 'N/A' }}</span>
          <span class="lobby-status">Status: {{ lobby.status }}</span>
          <span class="lobby-id">ID: {{ lobby._id }}</span>
        </div>
        <div class="lobby-actions">
          <router-link :to="{ name: 'LobbyView', params: { id: lobby._id } }" class="btn btn-view">
            View Lobby
          </router-link>
          <button class="btn btn-delete" @click="deleteLobby(lobby._id)">Delete</button>
        </div>
      </li>
    </ul>
    <p v-else class="no-lobbies-message">You haven't hosted any lobbies yet.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios';

const lobbies = ref([]);
const isLoading = ref(false);
const error = ref(null);

const fetchMyLobbies = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/lobby/my-lobbies');
    lobbies.value = data;
  } catch (err) {
    console.error('Failed to fetch hosted lobbies:', err);
    error.value = err.response?.data?.message || 'Could not load your lobbies.';
  } finally {
    isLoading.value = false;
  }
};

const deleteLobby = async (lobbyId) => {
  if (!confirm('Are you sure you want to delete this lobby? This action cannot be undone.')) return;
  try {
    await api.delete(`/api/lobby/${lobbyId}`);
    lobbies.value = lobbies.value.filter(lobby => lobby._id !== lobbyId);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete lobby.');
  }
};

onMounted(fetchMyLobbies);
</script>

<style scoped>
.my-lobbies-container {
  padding: 20px;
  max-width: 800px;
  margin: 20px auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

.loading-message,
.no-lobbies-message {
  text-align: center;
  color: #666;
  margin-top: 2rem;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.lobby-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.lobby-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  gap: 1rem;
}

.lobby-item:last-child {
  border-bottom: none;
}

.lobby-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.quiz-title {
  font-weight: bold;
}

.lobby-status,
.lobby-id {
  font-size: 0.9em;
  color: #555;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  text-align: center;
  white-space: nowrap;
}

.btn-view {
  background-color: #007bff;
  color: white;
  transition: background-color 0.2s ease;
}

.btn-view:hover {
  background-color: #0056b3;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
  margin-left: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-delete:hover {
  background-color: #b52a37;
}

.lobby-actions {
  display: flex;
  gap: 0.5rem;
}
</style>