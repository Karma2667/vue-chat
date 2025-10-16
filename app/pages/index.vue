<template>
  <client-only>
    <div class="home">
      <h1>Добро пожаловать, {{ user?.email ?? 'Гость' }} 👋</h1>
      <button @click="handleLogout" :disabled="loading">Выйти</button>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const { authService, user } = useAuth()
const loading = ref(false)

async function handleLogout() {
  loading.value = true
  try {
    console.log('Вызов logout')
    await authService.logout()
    console.log('Перенаправление на /auth')
    router.push('/auth')
  } catch (error) {
    console.error('Ошибка при выходе:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
  font-family: 'Inter', sans-serif;
}

button {
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  background: #0078ff;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background: #005fcc;
}

button:disabled {
  background: #004aad;
  cursor: not-allowed;
}
</style>