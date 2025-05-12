<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1>Welcome to <span class="gradient-text">QuizVerse</span></h1>
        <p class="subtitle">Your ultimate platform for interactive learning and quiz creation</p>
        <div class="cta-section">
          <router-link to="/auth" class="cta-button">
            Get Started
            <span class="button-icon">→</span>
          </router-link>
        </div>
      </div>
      
      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">✏️</div>
          <h3>Create Quizzes</h3>
          <p>Design and share your own quizzes with the community</p>
          <div class="feature-hover-effect"></div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎮</div>
          <h3>Join Lobbies</h3>
          <p>Compete with others in real-time quiz sessions</p>
          <div class="feature-hover-effect"></div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Track Progress</h3>
          <p>Monitor your performance and improve your skills</p>
          <div class="feature-hover-effect"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.home-container {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
}

.home-container::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, transparent 50%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hero-section {
  max-width: 1200px;
  width: 100%;
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.1);
}

.hero-content {
  margin-bottom: 4rem;
}

h1 {
  font-size: 4rem;
  color: #4c1d95;
  margin-bottom: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.subtitle {
  font-size: 1.5rem;
  color: #5b21b6;
  margin-bottom: 3rem;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
  margin-top: 2rem;
}

.feature-card {
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.1);
  backdrop-filter: blur(5px);
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 30px rgba(124, 58, 237, 0.15);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  color: #7c3aed;
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.feature-card p {
  color: #5b21b6;
  line-height: 1.7;
  font-size: 1.1rem;
}

.feature-hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(124, 58, 237, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.feature-card:hover .feature-hover-effect {
  transform: translateX(100%);
}

.cta-section {
  margin-top: 3rem;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 3rem;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.2rem;
  transition: all 0.4s ease;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
}

.cta-button:hover::before {
  left: 100%;
}

.button-icon {
  transition: transform 0.3s ease;
}

.cta-button:hover .button-icon {
  transform: translateX(5px);
}

@media (max-width: 768px) {
  .hero-section {
    padding: 3rem 1.5rem;
  }

  h1 {
    font-size: 2.8rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .features {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .feature-card {
    padding: 2rem;
  }

  .cta-button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
}
</style>