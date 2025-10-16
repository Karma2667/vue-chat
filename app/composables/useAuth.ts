import { computed } from 'vue'
import { authService } from '~/utils/auth'

export const useAuth = () => {
  const user = computed(() => authService.getUser())
  const isAuthenticated = computed(() => authService.isAuthenticated())

  return { authService, user, isAuthenticated }
}