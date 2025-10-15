<template>
  <div class="container">
    <form @submit.prevent="handleSubmit">
      <input type="email" v-model="form.email" placeholder="Email" required class="input" />
      <button type="submit" class="button">Отправить</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const form = ref({ email: '' })

function handleSubmit() {
  console.log('Форма отправлена:', form.value.email)
}
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(to right, #3b82f6, #06b6d4);
}

.input {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  pointer-events: auto !important;
}

.input:focus {
  border-color: #3b82f6;
}

.button {
  background-color: #2563eb;
  color: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-weight: 600;
  width: 100%;
  border: none;
  cursor: pointer;
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  pointer-events: auto !important;
}

.button:hover {
  background-color: #1d4ed8;
}
</style>