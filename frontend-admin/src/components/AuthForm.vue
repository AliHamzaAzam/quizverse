<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const error = computed(() => authStore.error);

const avatarFile = ref(null);
const avatarPreview = ref('');

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  if (isLogin.value) {
    clearAvatarPreview();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
  }
};

const clearAvatarPreview = () => {
  avatarFile.value = null;
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value);
    avatarPreview.value = '';
  }
};

const handleSubmit = async () => {
  if (isLogin.value) {
    await authStore.login({ email: email.value, password: password.value });
  } else {
    const formData = new FormData();
    formData.append('email', email.value);
    formData.append('password', password.value);
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value);
    }

    await authStore.signup(formData);
  }
};

const handleGooglePopup = () => {
  window.addEventListener('message', (event) => {
    if (event.data === 'google-auth-success') {
      authStore.checkAuth().then(() => {
        if (authStore.user) {
          router.push('/dashboard');
        }
      });
    }
  });
};
</script>

<template>
  <div class="auth-form-container">
    <h2>{{ isLogin ? 'Login' : 'Sign Up' }}</h2>
    <form @submit.prevent="handleSubmit" class="auth-form" enctype="multipart/form-data">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" v-model="email" required />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" v-model="password" required />
      </div>

      <!-- Avatar upload field, only shown in signup mode -->
      <div v-if="!isLogin" class="form-group avatar-upload">
        <label>Profile Picture</label>
        <div class="avatar-input-container">
          <div v-if="avatarPreview" class="avatar-preview">
            <img :src="avatarPreview" alt="Avatar preview" />
            <button type="button" @click="clearAvatarPreview" class="clear-avatar">×</button>
          </div>
          <label v-else class="upload-label">
            <input
                type="file"
                accept="image/*"
                @change="handleFileChange"
                class="file-input"
            />
            <span>Choose file</span>
          </label>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">{{ isLogin ? 'Login' : 'Sign Up' }}</button>
        <button type="button" @click="toggleMode" class="btn-secondary">
          Switch to {{ isLogin ? 'Sign Up' : 'Login' }}
        </button>
        <button @click="handleGooglePopup" class="btn-google">
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" />
          Continue with Google
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>

.avatar-upload {
  margin-bottom: 1rem;
}

.avatar-input-container {
  display: flex;
  align-items: center;
}

.avatar-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-avatar {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-label {
  display: inline-block;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
}

.upload-label:hover {
  background-color: #e0e0e0;
}

.file-input {
  display: none;
}
</style>