<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// Form state - initialize with user data or defaults
const formData = ref({
  firstName: '',
  lastName: '',
  displayName: '',
  age: '',
  accentColor: '#ffffff',
  avatarFile: null,
});
const avatarPreview = ref('');
const updateStatus = ref('');
const updateError = ref('');
const isUpdating = ref(false);

const populateForm = () => {
  if (user.value) {
    formData.value.firstName = user.value.firstName || '';
    formData.value.lastName = user.value.lastName || '';
    formData.value.displayName = user.value.displayName || '';
    formData.value.age = user.value.age || '';
    formData.value.accentColor = user.value.accentColor || '#ffffff';
    avatarPreview.value = user.value.avatar || '';
    formData.value.avatarFile = null;
  }
};

onMounted(populateForm);

watch(user, (newUser) => {
  if (newUser) populateForm();
}, { immediate: true });

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    formData.value.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => avatarPreview.value = ev.target.result;
    reader.readAsDataURL(file);
  } else {
    formData.value.avatarFile = null;
    avatarPreview.value = user.value?.avatar || '';
  }
};

const handleProfileUpdate = async () => {
  isUpdating.value = true;
  updateStatus.value = '';
  updateError.value = '';

  const dataToUpdate = new FormData();
  if (formData.value.firstName) dataToUpdate.append('firstName', formData.value.firstName);
  if (formData.value.lastName) dataToUpdate.append('lastName', formData.value.lastName);
  if (formData.value.displayName) dataToUpdate.append('displayName', formData.value.displayName);
  if (formData.value.age) dataToUpdate.append('age', formData.value.age);
  if (formData.value.accentColor) dataToUpdate.append('accentColor', formData.value.accentColor);
  if (formData.value.avatarFile instanceof File) dataToUpdate.append('avatar', formData.value.avatarFile);

  try {
    await authStore.updateProfile(dataToUpdate);
    updateStatus.value = 'Profile updated successfully!';
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  } catch (err) {
    updateError.value = err.message || 'Failed to update profile.';
  } finally {
    isUpdating.value = false;
    setTimeout(() => { updateStatus.value = ''; updateError.value = ''; }, 5000);
  }
};
</script>

<template>
  <div class="view-container">
    <div class="content-wrapper">
      <h1>Your Profile</h1>
      <div v-if="user" class="profile-info">
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Role:</strong> {{ user.role }}</p>
      </div>
      <form @submit.prevent="handleProfileUpdate" class="profile-form">
        <h2>Edit Profile</h2>

        <div class="form-group avatar-section">
          <label>Profile Picture</label>
          <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar Preview" class="avatar-preview" />
          <input type="file" @change="handleFileChange" accept="image/*" />
        </div>

        <div class="form-group">
          <label for="firstName">First Name</label>
          <input id="firstName" type="text" v-model="formData.firstName" />
        </div>
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input id="lastName" type="text" v-model="formData.lastName" />
        </div>
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input id="displayName" type="text" v-model="formData.displayName" />
        </div>
        <div class="form-group">
          <label for="age">Age</label>
          <input id="age" type="number" v-model="formData.age" />
        </div>
        <div class="form-group">
          <label for="accentColor">Accent Color</label>
          <div class="color-picker-group">
            <input id="accentColor" type="color" v-model="formData.accentColor" />
            <div class="color-preview" :style="{ backgroundColor: formData.accentColor }"></div>
          </div>
        </div>

        <div v-if="updateStatus" class="status-message success">{{ updateStatus }}</div>
        <div v-if="updateError" class="status-message error">{{ updateError }}</div>

        <button type="submit" class="btn-primary" :disabled="isUpdating">
          {{ isUpdating ? 'Updating...' : 'Update Profile' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  min-height: 100vh;
  padding: 2rem;
  background: transparent;
}

.content-wrapper {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.8);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h1, h2 {
  text-align: center;
  color: var(--bg-end);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.profile-info p {
  margin: 0.5rem 0;
  color: var(--text);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: var(--text);
  font-family: var(--font-pixel);
}

.avatar-section {
  align-items: flex-start;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.5rem;
  border: 2px solid #ccc;
}

input[type="text"],
input[type="number"],
input[type="color"] {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: var(--bg-end);
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-preview {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  border-radius: 0.3rem;
}

.status-message {
  text-align: center;
  padding: 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.btn-primary {
  padding: 0.8rem;
  border: 1px solid var(--bg-end);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--bg-end);
  font-family: var(--font-pixel);
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--bg-end);
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>