<script setup>
import { ref } from 'vue';
import api from '@/utils/axios'; // Assuming your API utility is here

const props = defineProps({
  attemptId: {
    type: String,
    required: true
  }
});

const rating = ref(0); // 0 means no rating given yet
const comment = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const feedbackSubmitted = ref(false); // Track if feedback was submitted

// Function to set rating
const setRating = (value) => {
  rating.value = value;
};

// Handle form submission
const submitFeedback = async () => {
  if (rating.value === 0 && !comment.value.trim()) {
    errorMessage.value = 'Please provide a rating or a comment.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const payload = {
      attemptId: props.attemptId,
      // Only include rating/comment if they have values
      ...(rating.value > 0 && { rating: rating.value }),
      ...(comment.value.trim() && { comment: comment.value.trim() })
    };

    await api.post('/api/feedback', payload);
    successMessage.value = 'Thank you for your feedback!';
    feedbackSubmitted.value = true; // Hide form after successful submission
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
    console.error('Feedback submission error:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div v-if="!feedbackSubmitted" class="feedback-form-container">
    <h3>Leave Feedback</h3>
    <form @submit.prevent="submitFeedback">
      <!-- Rating Stars -->
      <div class="rating-group">
        <label>Rating:</label>
        <div class="stars">
          <span
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ filled: star <= rating }"
            @click="setRating(star)"
          >
            ★
          </span>
        </div>
      </div>

      <!-- Comment Textarea -->
      <div class="form-group">
        <label for="comment">Comment (Optional):</label>
        <textarea
          id="comment"
          v-model="comment"
          rows="4"
          placeholder="Tell us what you thought..."
        ></textarea>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <!-- Submit Button -->
      <button type="submit" :disabled="isLoading" class="btn-submit">
        {{ isLoading ? 'Submitting...' : 'Submit Feedback' }}
      </button>
    </form>
  </div>
  <div v-else class="success-message">
    {{ successMessage }}
  </div>
</template>

<style scoped>
.feedback-form-container {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rating-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: inline-block; /* Changed from flex */
  font-size: 1.8rem; /* Make stars bigger */
  cursor: pointer;
}

.star {
  color: #ccc; /* Default empty star color */
  transition: color 0.2s;
  margin-right: 2px; /* Small space between stars */
}

.star:hover,
.star.filled {
  color: #ffc107; /* Gold color for filled/hovered stars */
}


.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical; /* Allow vertical resize */
}

.btn-submit {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #28a745; /* Green color */
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover {
  background-color: #218838;
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message, .success-message {
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.success-message {
  background-color: #e8f5e9; /* Light green background */
  color: #2e7d32; /* Darker green text */
  margin-top: 2rem; /* Add margin like the form container */
  padding: 1.5rem;
  border: 1px solid #c8e6c9; /* Light green border */
  border-radius: 8px;
}
</style>
