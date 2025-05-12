<template>
  <div class="dashboard-container">
    <div class="dashboard-card">
      <h1>Welcome to your <span class="gradient-text">Dashboard</span> 🎉</h1>
      <p class="subtitle">You are now logged in! Explore your quizzes, lobbies, and more.</p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.dashboard-container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  font-family: 'Outfit', sans-serif;
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.10);
  padding: 3rem 2.5rem;
  text-align: center;
  border: 1px solid rgba(124, 58, 237, 0.10);
  max-width: 500px;
  width: 100%;
}

h1 {
  font-size: 2.5rem;
  color: #4c1d95;
  font-weight: 800;
  margin-bottom: 1.2rem;
}

.gradient-text {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.subtitle {
  color: #5b21b6;
  font-size: 1.15rem;
  margin-bottom: 0;
  font-weight: 500;
}

@media (max-width: 600px) {
  .dashboard-card {
    padding: 2rem 1rem;
  }
  h1 {
    font-size: 2rem;
  }
}
</style>