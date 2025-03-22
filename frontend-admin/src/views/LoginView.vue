<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <h1 class="text-3xl font-bold text-center mb-6">Frontend Admin Login</h1>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="email" class="block text-gray-700 mb-2">Admin Email</label>
          <input
              v-model="email"
              type="email"
              id="email"
              required
              class="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div class="mb-6">
          <label for="password" class="block text-gray-700 mb-2">Password</label>
          <input
              v-model="password"
              type="password"
              id="password"
              required
              class="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <button
            type="submit"
            class="w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition duration-300"
        >
          Login as Admin
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
const authStore = useAuthStore();

const handleLogin = async () => {
  await authStore.login({ email: email.value, password: password.value });
};
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}
</style>