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
  avatarFile: null, // For file input
});
const avatarPreview = ref('');
const updateStatus = ref('');
const updateError = ref('');
const isUpdating = ref(false);

// Function to populate form data from user state
const populateForm = () => {
  if (user.value) {
    formData.value.firstName = user.value.firstName || '';
    formData.value.lastName = user.value.lastName || '';
    formData.value.displayName = user.value.displayName || '';
    formData.value.age = user.value.age || '';
    formData.value.accentColor = user.value.accentColor || '#ffffff';
    avatarPreview.value = user.value.avatar || ''; // Display current avatar URL
    formData.value.avatarFile = null; // Reset file input state
  }
};

// Populate form when component mounts
onMounted(populateForm);

// Watch for changes in user data (e.g., after initial load or update)
watch(user, (newUser) => {
  if (newUser) {
    populateForm();
  }
}, { immediate: true }); // Use immediate to run on initial mount too

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.avatarFile = file;
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    formData.value.avatarFile = null;
    avatarPreview.value = user.value?.avatar || ''; // Revert to original if cleared
  }
};

const handleProfileUpdate = async () => {
  isUpdating.value = true;
  updateStatus.value = '';
  updateError.value = '';

  const dataToUpdate = new FormData();
  // Append only fields that have values
  if (formData.value.firstName) dataToUpdate.append('firstName', formData.value.firstName);
  if (formData.value.lastName) dataToUpdate.append('lastName', formData.value.lastName);
  if (formData.value.displayName) dataToUpdate.append('displayName', formData.value.displayName);
  if (formData.value.age) dataToUpdate.append('age', formData.value.age);
  if (formData.value.accentColor) dataToUpdate.append('accentColor', formData.value.accentColor);

  // Only append avatar if a new file has been selected
  if (formData.value.avatarFile instanceof File) {
    dataToUpdate.append('avatar', formData.value.avatarFile);
  }

  try {
    await authStore.updateProfile(dataToUpdate);
    updateStatus.value = 'Profile updated successfully!';
    // Form is repopulated by the watcher on `user`
    // Clear the file input visually if needed (browser security might prevent this)
    const fileInput = document.querySelector('input[type="file"]');
    if(fileInput) fileInput.value = '';

  } catch (err) {
    updateError.value = err.message || 'Failed to update profile.';
    updateStatus.value = '';
  } finally {
    isUpdating.value = false;
    // Clear messages after a few seconds
    setTimeout(() => {
        updateStatus.value = '';
        updateError.value = '';
    }, 5000);
  }
};
</script>

<template>
  <div class="profile-container">
    <h1>Your Profile</h1>
    <div v-if="user" class="profile-details">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Role:</strong> {{ user.role }}</p>

      <form @submit.prevent="handleProfileUpdate" class="profile-form">
        <h2>Edit Profile</h2>

        <div class="form-group avatar-section">
          <label>Profile Picture</label>
          <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar Preview" class="avatar-preview">
          <input type="file" @change="handleFileChange" accept="image/*" />
        </div>

        <div class="form-group">
          <label for="firstName">First Name</label>
          <input type="text" id="firstName" v-model="formData.firstName" />
        </div>
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input type="text" id="lastName" v-model="formData.lastName" />
        </div>
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input type="text" id="displayName" v-model="formData.displayName" />
        </div>
        <div class="form-group">
          <label for="age">Age</label>
          <input type="number" id="age" v-model="formData.age" />
        </div>
        <div class="form-group">
          <label for="accentColor">Accent Color</label>
           <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="color" id="accentColor" v-model="formData.accentColor" />
             <div :style="{ width: '30px', height: '30px', backgroundColor: formData.accentColor, border: '1px solid #ccc', borderRadius: '4px' }"></div>
          </div>
        </div>

        <div v-if="updateStatus" class="status-message success">{{ updateStatus }}</div>
        <div v-if="updateError" class="status-message error">{{ updateError }}</div>

        <button type="submit" class="btn-primary" :disabled="isUpdating">
          {{ isUpdating ? 'Updating...' : 'Update Profile' }}
        </button>
      </form>
    </div>
    <div v-else>
      Loading profile...
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
}

.profile-details p {
  margin-bottom: 0.5rem;
  color: #555;
}

.profile-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem; /* Increased gap */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
    font-weight: bold;
    color: #444;
}

.avatar-section {
  align-items: flex-start;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.5rem;
  border: 2px solid #ddd; /* Slightly thicker border */
}

input[type="text"],
input[type="number"],
input[type="file"],
input[type="color"] {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
input[type="number"]:focus,
input[type="color"]:focus {
    border-color: #4361ee;
    outline: none;
}

input[type="file"] {
    padding: 0.5rem; /* Adjust padding for file input */
}

.btn-primary {
  padding: 0.8rem 1.5rem; /* Slightly larger button */
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  background-color: #4361ee;
  color: white;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.btn-primary:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3a56d4;
}

.status-message {
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
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
</style>
