<template>
  <div class="view-container login-container">
    <div class="login-card">
      <h1>Admin Login</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            required
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login as Admin' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const authStore = useAuthStore();

const handleLogin = async () => {
  isLoading.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 2rem;
}

.login-card {
  background: rgba(255,255,255,0.9);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  font-family: var(--font-pixel);
}

.login-card h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--bg-end);
}

.login-form .form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.login-form label {
  margin-bottom: 0.5rem;
  color: var(--text);
}

.login-form input {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
  outline: none;
  transition: border-color 0.2s;
}

.login-form input:focus {
  border-color: var(--bg-end);
}

.btn-primary {
  width: 100%;
  padding: 0.8rem;
  background: var(--bg-end);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-family: var(--font-pixel);
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  background: var(--bg-mid);
}
</style>
