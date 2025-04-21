<template>
  <div class="not-found-container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <router-link to="/dashboard">Go to Dashboard</router-link>
  </div>
</template>

<style scoped>
.not-found-container {
  text-align: center;
  padding: 4rem;
}
h1 {
  color: #e74c3c;
}
</style>