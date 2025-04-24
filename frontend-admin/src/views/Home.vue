<template>
  <div class="home-container">
    <div class="home-content">
      <h1 class="home-title">Welcome to <span class="highlight">QuizVerse</span>!</h1>
      <p class="home-description">Start managing quizzes, users, and more with ease.</p>
      <router-link class="cta-button" to="/auth">Login / Sign Up</router-link>
    </div>
    <div class="home-illustration">
      <img src="@/assets/quiz-image.svg" alt="Quiz illustration" />
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f8f9fa; /* Light background similar to other pages */
  padding: 2rem;
}

.home-content {
  text-align: center;
  max-width: 600px;
  margin-bottom: 2rem;
}

.home-title {
  font-size: 3rem;
  color: #343a40; /* Darker text for consistency */
  margin-bottom: 1rem;
  font-weight: 600;
}

.highlight {
  color: #e74c3c; /* Consistent highlight color */
}

.home-description {
  font-size: 1.25rem;
  color: #6c757d; /* Slightly lighter text */
  margin-bottom: 2rem;
}

.cta-button {
  display: inline-block;
  background-color: #007bff; /* Consistent blue button color */
  color: white;
  padding: 10px 20px;
  font-size: 1.125rem;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.cta-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
}

.home-illustration {
  max-width: 500px;
  width: 100%;
  margin-top: 2rem;
}

.home-illustration img {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
