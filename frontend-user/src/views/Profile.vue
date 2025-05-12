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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.profile-container {
  max-width: 600px;
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

h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #4c1d95;
    margin-bottom: 1.5rem;
}

.profile-details p {
  margin-bottom: 1rem;
  color: #5b21b6;
  font-size: 1.1rem;
  line-height: 1.6;
}

.profile-details strong {
  color: #4c1d95;
  font-weight: 600;
}

.profile-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.form-group label {
  font-weight: 600;
  color: #4c1d95;
  font-size: 1.1rem;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  padding: 0.8rem 1rem;
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-group input[type="file"] {
  padding: 0.8rem;
  border: 2px dashed rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-group input[type="file"]:hover {
  border-color: #7c3aed;
  background: rgba(124, 58, 237, 0.05);
}

.avatar-section {
  align-items: flex-start;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #7c3aed;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.avatar-preview:hover {
  transform: scale(1.05);
}

input[type="color"] {
  width: 50px;
  height: 50px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: 2px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
}

.status-message {
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1rem;
}

.status-message.success {
  background: rgba(124, 58, 237, 0.1);
  color: #4c1d95;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.status-message.error {
  background: rgba(236, 72, 153, 0.1);
  color: #a21caf;
  border: 1px solid rgba(236, 72, 153, 0.2);
}

.btn-primary {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(45deg, #7c3aed, #8b5cf6);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-container {
    margin: 1.5rem;
    padding: 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .profile-form {
    padding: 1.5rem;
}

  .form-group input[type="text"],
  .form-group input[type="number"] {
    padding: 0.7rem;
}

  .avatar-preview {
    width: 100px;
    height: 100px;
  }
}
</style>
