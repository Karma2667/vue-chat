<template>
  <div class="container">
    <div class="card">
      <h1>Сброс пароля</h1>
      <form @submit.prevent="handleResetPassword" autocomplete="off">
        <input
          v-model="form.password"
          type="password"
          placeholder="Новый пароль"
          required
          class="input"
        />
        <input
          v-model="form.password_confirmation"
          type="password"
          placeholder="Подтверждение пароля"
          required
          class="input"
        />
        <button type="submit" :disabled="loading" class="button">
          {{ loading ? 'Сохранение...' : 'Сбросить пароль' }}
        </button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">Пароль успешно изменен</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../utils/auth'

const router = useRouter()
const route = useRoute()

const form = ref({
  password: '',
  password_confirmation: ''
})
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleResetPassword() {
  console.log('handleResetPassword сработал')
  error.value = ''
  loading.value = true
  const token = route.query.token
  if (!token || typeof token !== 'string') {
    error.value = 'Токен не предоставлен'
    loading.value = false
    return
  }
  try {
    await authService.resetPassword(token, form.value.password, form.value.password_confirmation)
    success.value = true
    form.value = { password: '', password_confirmation: '' }
    setTimeout(() => router.push('/auth'), 2000)
  } catch (e: any) {
    console.error('Ошибка в handleResetPassword:', e.message)
    error.value = e.message || 'Ошибка при сбросе пароля'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(to right, #3b82f6, #06b6d4);
  font-family: sans-serif;
}

.card {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 28rem;
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

.button:disabled {
  background-color: #1e40af;
  cursor: not-allowed;
}

.error {
  margin-top: 1rem;
  color: #ef4444;
  font-size: 0.875rem;
}

.success {
  margin-top: 1rem;
  color: #22c55e;
  font-size: 0.875rem;
}
</style>