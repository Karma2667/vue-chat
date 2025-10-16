<template>
  <div v-if="!isAuthenticated" class="container">
    <div class="card">
      <h1>{{ isLogin ? 'Вход' : 'Регистрация' }}</h1>

      <form @submit.prevent="handleSubmit" autocomplete="off">
        <input type="text" name="fakeuser" style="display: none" />
        <input type="password" name="fakepass" style="display: none" />

        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          required
          class="input"
        />
        <input
          v-if="!isLogin"
          v-model="form.username"
          type="text"
          placeholder="Имя пользователя"
          required
          class="input"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Пароль"
          required
          class="input"
        />
        <input
          v-if="!isLogin"
          v-model="form.password_confirmation"
          type="password"
          placeholder="Подтверждение пароля"
          required
          class="input"
        />

        <button type="submit" :disabled="loading" class="button">
          {{ loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться' }}
        </button>
      </form>

      <div v-if="isLogin" class="links">
        <p>
          <span @click="showResetPassword = true" class="link"> Забыли пароль? </span>
        </p>
        <p>
          <span @click="showSendConfirmation = true" class="link"> Подтвердить email </span>
        </p>
      </div>

      <p class="toggle">
        {{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
        <span @click="toggleMode" class="link">
          {{ isLogin ? 'Создать' : 'Войти' }}
        </span>
      </p>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="showResetPassword" class="form-section">
        <h2>Сброс пароля</h2>
        <form @submit.prevent="handleResetPasswordRequest">
          <input
            v-model="resetForm.email"
            type="email"
            placeholder="Email"
            required
            class="input"
          />
          <button type="submit" :disabled="loading" class="button">
            {{ loading ? 'Отправка...' : 'Отправить письмо' }}
          </button>
        </form>
      </div>

      <div v-if="showSendConfirmation" class="form-section">
        <h2>Подтверждение email</h2>
        <form @submit.prevent="handleSendConfirmation">
          <input
            v-model="confirmationForm.email"
            type="email"
            placeholder="Email"
            required
            class="input"
          />
          <button type="submit" :disabled="loading" class="button">
            {{ loading ? 'Отправка...' : 'Отправить письмо' }}
          </button>
        </form>
      </div>
    </div>
  </div>
  <div v-else class="container">
    <p>Перенаправление на главную...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { authService } = useAuth()
const isLogin = ref(true)
const loading = ref(false)
const error = ref('')
const showResetPassword = ref(false)
const showSendConfirmation = ref(false)

const isAuthenticated = computed(() => authService.isAuthenticated())

const form = ref({
  email: '',
  username: '',
  password: '',
  password_confirmation: ''
})

const resetForm = ref({ email: '' })
const confirmationForm = ref({ email: '' })

onMounted(async () => {
  console.log('onMounted сработал')
  if (isAuthenticated.value) {
    console.log('Пользователь уже авторизован, перенаправление на главную')
    router.push('/')
    return
  }

  const token = route.query.token
  if (token && typeof token === 'string') {
    try {
      await authService.confirmEmail(token)
      error.value = 'Email успешно подтвержден'
      setTimeout(() => router.push('/auth'), 2000)
    } catch (e: any) {
      console.error('Ошибка в confirmEmail:', e.message)
      error.value = e.message || 'Ошибка подтверждения email'
    }
  }
})

function toggleMode() {
  console.log('toggleMode сработал')
  isLogin.value = !isLogin.value
  error.value = ''
  showResetPassword.value = false
  showSendConfirmation.value = false
  form.value = { email: '', username: '', password: '', password_confirmation: '' }
}

async function handleSubmit() {
  console.log('handleSubmit сработал', form.value)
  error.value = ''
  if (!form.value.email || !form.value.password) {
    error.value = 'Заполните email и пароль'
    return
  }
  loading.value = true
  try {
    if (isLogin.value) {
      const response = await authService.login(form.value.email, form.value.password)
      console.log('Login response in auth.vue:', response)
      router.push('/')
    } else {
      if (!form.value.username || !form.value.password_confirmation) {
        error.value = 'Заполните все поля'
        return
      }
      await authService.register(
        form.value.email,
        form.value.username,
        form.value.password,
        form.value.password_confirmation
      )
      error.value = 'Регистрация успешна, подтвердите email'
      setTimeout(() => {
        isLogin.value = true
        form.value = { email: '', username: '', password: '', password_confirmation: '' }
      }, 2000)
    }
  } catch (e: any) {
    console.error('Ошибка в handleSubmit:', e.message)
    error.value = e.message || 'Ошибка авторизации'
  } finally {
    loading.value = false
  }
}

async function handleResetPasswordRequest() {
  console.log('handleResetPasswordRequest сработал', resetForm.value)
  error.value = ''
  loading.value = true
  try {
    await authService.requestPasswordReset(resetForm.value.email)
    error.value = 'Письмо для сброса пароля отправлено'
    showResetPassword.value = false
    resetForm.value.email = ''
  } catch (e: any) {
    console.error('Ошибка в handleResetPasswordRequest:', e.message)
    error.value = e.message.includes('400') ? 'Неверный email' : e.message || 'Ошибка при отправке письма'
  } finally {
    loading.value = false
  }
}

async function handleSendConfirmation() {
  console.log('handleSendConfirmation сработал', confirmationForm.value)
  error.value = ''
  loading.value = true
  try {
    await authService.sendConfirmation(confirmationForm.value.email)
    error.value = 'Письмо для подтверждения отправлено'
    showSendConfirmation.value = false
    confirmationForm.value.email = ''
  } catch (e: any) {
    console.error('Ошибка в handleSendConfirmation:', e.message)
    error.value = e.message || 'Ошибка при отправке письма'
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
  user-select: auto;
}

.card {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 28rem;
  user-select: auto;
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
  margin-top: 0.5rem;
  transition: background-color 0.2s;
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

.links {
  margin-top: 1rem;
}

.link {
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  pointer-events: auto !important;
}

.link:hover {
  text-decoration: underline;
}

.toggle {
  margin-top: 1rem;
  color: #4b5563;
}

.error {
  margin-top: 1rem;
  color: #ef4444;
  font-size: 0.875rem;
}

.form-section {
  margin-top: 1rem;
}
</style>