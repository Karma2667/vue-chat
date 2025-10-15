export default defineNuxtRouteMiddleware((to) => {
  console.log('Middleware сработал:', to.path)
  const isAuthenticated = authService.isAuthenticated()
  if (!isAuthenticated && to.path !== '/auth' && to.path !== '/test' && to.path !== '/reset-password') {
    return navigateTo('/auth')
  }
})