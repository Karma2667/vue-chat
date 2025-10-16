import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  console.log('Middleware сработал:', to.path)
  const { authService } = useAuth()

  if (authService.isAuthenticated()) {
    // Если пользователь авторизован и пытается зайти на /auth или /reset-password, перенаправляем на /
    if (to.path === '/auth' || to.path === '/reset-password') {
      return navigateTo('/')
    }
  } else {
    // Если пользователь не авторизован и пытается зайти на защищённый маршрут, перенаправляем на /auth
    if (to.path !== '/auth' && to.path !== '/test' && to.path !== '/reset-password') {
      return navigateTo('/auth')
    }
  }
})