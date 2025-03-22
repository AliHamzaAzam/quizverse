<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const error = computed(() => authStore.error);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  authStore.clearError();
};

const handleSubmit = async () => {
  if (isLogin.value) {
    await authStore.login({ email: email.value, password: password.value });
  } else {
    await authStore.signup({ email: email.value, password: password.value });
  }
};

const handleGooglePopup = () => {
  window.open(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`,
      'Google Login',
      'width=500,height=600'
  );
};

onMounted(() => {
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'auth-success') {
      if (event.data.user) {
        await authStore.setUser(event.data.user);
      } else {
        await authStore.fetchCurrentUser();
      }

      // Then redirect to dashboard
      router.push('/dashboard');
    }
  });
});
</script>

<template>
  <div class="auth-form-container">
    <h2>{{ isLogin ? 'Login' : 'Sign Up' }}</h2>
    <form @submit.prevent="handleSubmit" class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" v-model="email" required />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" v-model="password" required />
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
.auth-form-container {
  max-width: 400px;
  margin: 4rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

button {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}

.btn-primary:hover {
  background-color: #3a56d4;
}

.btn-secondary {
  background-color: transparent;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid #ddd;
  background-color: #fff;
  cursor: pointer;
  padding: 0.7rem;
}

.btn-google:hover {
  background-color: #f5f5f5;
}

.error-message {
  padding: 0.75rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
