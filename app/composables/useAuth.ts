import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

interface AuthResponse {
  success?: boolean
  message?: string
  access_token?: string
  refresh_token?: string
  user?: any
}

interface AuthError {
  response?: {
    data?: {
      message?: string
    }
  }
  message: string
}

export class AuthService {
  private api: AxiosInstance
  private token: string | null = null
  private refreshToken: string | null = null
  private user: any = null

  constructor(baseURL: string = 'https://stan-messenger.ru/api/v1') {
    this.api = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' }
    })

    // Инициализация токенов из localStorage
    this.loadTokens()

    // Интерсептор для обработки ошибок 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            await this.refresh()
            return this.api(originalRequest)
          } catch (refreshError) {
            await this.logout()
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private saveTokens(access: string, refresh: string): void {
    this.token = access
    this.refreshToken = refresh
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
    }
    this.api.defaults.headers.common['Authorization'] = `Bearer ${access}`
  }

  private loadTokens(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
      this.refreshToken = localStorage.getItem('refresh_token')
      if (this.token) {
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      }
    }
  }

  async register(email: string, username: string, password: string, password_confirmation: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', {
        auth: { email, username, password, password_confirmation }
      })
      console.log('Register response:', response.data)
      return response.data
    } catch (e: any) {
      const error: AuthError = e
      console.error('Register error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка регистрации')
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
        auth: { email, password }
      })
      console.log('Login response:', response.data)
      const { access_token, refresh_token, user } = response.data
      if (access_token && refresh_token) {
        this.saveTokens(access_token, refresh_token)
        this.user = user
      }
      return response.data
    } catch (e: any) {
      const error: AuthError = e
      console.error('Login error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка авторизации')
    }
  }

  async refresh(): Promise<void> {
    if (!this.refreshToken) throw new Error('Нет refresh токена')
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/refresh', {
        refresh_token: this.refreshToken
      })
      console.log('Refresh response:', response.data)
      const { access_token, refresh_token } = response.data
      if (access_token) {
        this.saveTokens(access_token, refresh_token || this.refreshToken)
      }
    } catch (e: any) {
      const error: AuthError = e
      console.error('Refresh error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка обновления токена')
    }
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.api.delete('/auth/logout', { params: { refresh_token: this.refreshToken } })
        console.log('Logout successful')
      } catch (e: any) {
        console.error('Logout error:', e.response?.data || e.message)
      }
    }
    this.token = null
    this.refreshToken = null
    this.user = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    delete this.api.defaults.headers.common['Authorization']
  }

  async confirmEmail(token: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.get('/auth/confirm', { params: { token } })
      console.log('Confirm email response:', response.data)
      return response.data
    } catch (e: any) {
      const error: AuthError = e
      console.error('Confirm email error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка подтверждения email')
    }
  }

  async sendConfirmation(email: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/send_confirmation', { email })
      console.log('Send confirmation response:', response.data)
      return response.data
    } catch (e: any) {
      const error: AuthError = e
      console.error('Send confirmation error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка отправки письма подтверждения')
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/request_password_reset', { auth: { email } })
      console.log('Request password reset response:', response.data)
      return response.data
    } catch (e: any) {
      const error: AuthError = e
      console.error('Request password reset error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка запроса сброса пароля')
    }
  }

  async resetPassword(token: string, password: string, password_confirmation: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/reset_password', {
        auth: { token, password, password_confirmation }
      })
      console.log('Reset password response:', response.data)
      return response.data
    } catch (e: any) {
      const error: AuthError = e
      console.error('Reset password error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Ошибка сброса пароля')
    }
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getUser(): any {
    return this.user
  }

  getToken(): string | null {
    return this.token
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }
}

export const authService = new AuthService()