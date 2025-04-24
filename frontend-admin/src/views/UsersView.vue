<template>
  <div class="page-container">
    <h1 class="page-title">Manage Users</h1>

    <div v-if="isLoading" class="status-message">Loading users...</div>
    <div v-if="error" class="status-message error">{{ error }}</div>

    <div v-if="!isLoading && !error && users.length > 0" class="card">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Display Name</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td>{{ user.email }}</td>
            <td>{{ user.displayName || 'N/A' }}</td>
            <td>
              <select v-model="user.role" @change="updateUserRole(user)" :disabled="isUpdatingRole === user._id">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <button @click="deleteUser(user._id)" class="btn danger" :disabled="isDeleting === user._id">
                {{ isDeleting === user._id ? 'Deleting...' : 'Delete' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!isLoading && !error && users.length === 0" class="status-message">No users found.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios';

const users = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isUpdatingRole = ref(null);
const isDeleting = ref(null);

const fetchUsers = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/admin/users');
    users.value = data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load users.';
  } finally {
    isLoading.value = false;
  }
};

const updateUserRole = async (user) => {
  isUpdatingRole.value = user._id;
  error.value = null;
  try {
    await api.patch(`/api/admin/users/${user._id}/role`, { role: user.role });
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update user role.';
    await fetchUsers(); // Revert
  } finally {
    isUpdatingRole.value = null;
  }
};

const deleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  isDeleting.value = userId;
  error.value = null;
  try {
    await api.delete(`/api/admin/users/${userId}`);
    users.value = users.value.filter(u => u._id !== userId);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete user.';
  } finally {
    isDeleting.value = null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

onMounted(fetchUsers);
</script>

<style scoped>
.page-container {
  padding: 2rem;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
}

.status-message {
  text-align: center;
  margin: 1.5rem 0;
  padding: 0.75rem;
  border-radius: 6px;
  background-color: #f1f3f5;
  color: #495057;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.styled-table th,
.styled-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.styled-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.styled-table tr:hover {
  background-color: #f1f3f5;
}

select {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.btn {
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn.danger {
  background-color: #dc3545;
  color: white;
}

.btn.danger:hover {
  background-color: #c82333;
}

.btn:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
</style>
