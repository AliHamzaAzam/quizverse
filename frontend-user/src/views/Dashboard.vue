<template>
  <div class="view-container">
    <h1>Welcome to your Dashboard 🎉</h1>
    <p>You are now logged in!</p>
  </div>
</template>

<script>
export default {
  name: 'Dashboard'
}
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
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
  color: var(--text);
}
</style>
