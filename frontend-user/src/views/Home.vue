<template>
  <div class="view-container">
    <h1>Welcome to QuizVerse!</h1>
    <p>
      Please
      <router-link to="/auth" class="action-link">
        Login / Sign Up
      </router-link>
      to get started.
    </p>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;       /* fills the screen */
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--bg-end); /* pale purple accent */
}

p {
  font-size: 1rem;
}

.action-link {
  color: var(--bg-end);
  text-decoration: underline;
  transition: color 0.2s ease;
}

.action-link:hover {
  color: var(--bg-mid); /* slightly lighter on hover */
}
</style>
