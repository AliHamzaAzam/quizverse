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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.my-lobbies-container {
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

.loading-message,
.no-lobbies-message {
  text-align: center;
  padding: 1.5rem;
  font-size: 1.1rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  color: #5b21b6;
  font-weight: 500;
}

.error-message {
  color: #a21caf;
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid #f3e8ff;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-weight: 500;
  text-align: center;
}

.lobby-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lobby-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.lobby-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
}

.lobby-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-title {
  font-weight: 700;
  font-size: 1.2rem;
  color: #4c1d95;
}

.lobby-status,
.lobby-id {
  font-size: 1rem;
  color: #5b21b6;
  font-weight: 500;
}

.lobby-status {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: rgba(124, 58, 237, 0.06);
  border-radius: 6px;
  margin-top: 0.3rem;
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
}

.btn-view {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  text-decoration: none;
}

.btn-view:hover {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-delete {
  background: linear-gradient(45deg, #f472b6, #a21caf);
  color: white;
  margin-left: 0.5rem;
}

.btn-delete:hover {
  background: linear-gradient(45deg, #a21caf, #f472b6);
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.18);
  transform: translateY(-2px);
}

.lobby-actions {
  display: flex;
  gap: 0.8rem;
}

@media (max-width: 768px) {
  .my-lobbies-container {
    padding: 1.5rem;
    margin: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  .lobby-item {
    flex-direction: column;
    gap: 1rem;
    padding: 1.2rem;
  }

  .lobby-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn {
    width: 100%;
    margin: 0.3rem 0;
  }
}
</style>