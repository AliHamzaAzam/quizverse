<template>
  <div class="users-container">
    <h1>Manage Users</h1>
    <div v-if="isLoading" class="loading">Loading users...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="!isLoading && !error && users.length > 0" class="users-table-container">
      <table class="users-table">
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
              <button @click="deleteUser(user._id)" class="btn-delete" :disabled="isDeleting === user._id">
                {{ isDeleting === user._id ? 'Deleting...' : 'Delete' }}
              </button>
              <!-- Add other actions like view details if needed -->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isLoading && !error && users.length === 0" class="no-users">
      No users found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios';

const users = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isUpdatingRole = ref(null); // Track which user's role is being updated
const isDeleting = ref(null); // Track which user is being deleted

const fetchUsers = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/admin/users');
    users.value = data;
  } catch (err) {
    console.error('Failed to load users:', err);
    error.value = err.response?.data?.message || 'Failed to load users.';
  } finally {
    isLoading.value = false;
  }
};

const updateUserRole = async (user) => {
  isUpdatingRole.value = user._id;
  error.value = null; // Clear previous errors
  try {
    await api.patch(`/api/admin/users/${user._id}/role`, { role: user.role });
    // Optionally show a success message
    console.log(`Updated role for ${user.email} to ${user.role}`);
  } catch (err) {
    console.error('Failed to update user role:', err);
    error.value = err.response?.data?.message || 'Failed to update user role.';
    // Revert the change in the UI if the API call failed
    await fetchUsers(); // Refetch to get the original state
  } finally {
    isUpdatingRole.value = null;
  }
};

const deleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  isDeleting.value = userId;
  error.value = null;
  try {
    await api.delete(`/api/admin/users/${userId}`);
    // Remove user from the local list
    users.value = users.value.filter(u => u._id !== userId);
    console.log(`Deleted user ${userId}`);
  } catch (err) {
    console.error('Failed to delete user:', err);
    error.value = err.response?.data?.message || 'Failed to delete user.';
  } finally {
    isDeleting.value = null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(fetchUsers);
</script>

<style scoped>
.users-container {
  padding: 2rem;
}

h1 {
  margin-bottom: 1.5rem;
}

.loading, .error-message, .no-users {
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.no-users {
  color: #6c757d;
}

.users-table-container {
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.users-table th,
.users-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.users-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.users-table tbody tr:hover {
  background-color: #f1f3f5;
}

.users-table select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.users-table button {
  padding: 0.3rem 0.7rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}

.btn-delete:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.users-table select:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
}

</style>