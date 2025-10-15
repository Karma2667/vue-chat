<template>
  <div class="home">
    <h1>Добро пожаловать, {{ user?.email }} 👋</h1>
    <button @click="logout">Выйти</button>
  </div>
</template>

<script setup lang="ts">
const user = ref<any>(null)

onMounted(() => {
  const data = localStorage.getItem('user')
  if (data) user.value = JSON.parse(data)
})

function logout() {
  localStorage.removeItem('user')
  navigateTo('/auth')
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
</style>
