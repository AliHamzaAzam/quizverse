<template>
  <div class="not-found-container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <router-link to="/admin" class="back-link">← Back to Admin Dashboard</router-link>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  color: #fff;
  text-align: center;
  font-family: 'Pixelify Sans', sans-serif;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #e94560;
}

p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.back-link {
  padding: 0.75rem 1.5rem;
  background-color: #e94560;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.back-link:hover {
  background-color: #d63447;
}
</style>
