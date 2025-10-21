import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  is_current_user?: boolean;
  avatar_url?: string;
  online?: boolean;
  status?: string;
  last_seen_at?: string;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AuthResponse {
  success?: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  user?: User;
}

interface AuthError {
  message: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export class AuthService {
  private api: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  constructor(baseURL: string = 'https://stan-messenger.ru/api/v1') {
    console.log('Base URL:', baseURL);
    this.api = axios.create({
      baseURL,
      headers: {},
    });

    if (typeof window !== 'undefined') {
      this.loadTokens();
    }

    this.api.interceptors.request.use((config: CustomAxiosRequestConfig) => {
      if (this.token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<AuthError>) => {
        const originalRequest = error.config as CustomAxiosRequestConfig | undefined;
        if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refresh();
            return this.api(originalRequest);
          } catch (refreshError) {
            await this.logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private saveTokens(access: string, refresh: string, user?: User): void {
    this.token = access;
    this.refreshToken = refresh;
    this.user = user || null;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      console.log('Токены сохранены:', { access_token: access, refresh_token: refresh, user });
    }
    this.api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  }

  private loadTokens(): void {
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    const userData = localStorage.getItem('user');
    this.user = userData ? JSON.parse(userData) : null;
    console.log('Токены загружены:', { access_token: this.token, refresh_token: this.refreshToken, user: this.user });
    if (this.token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  public async makeRequest<T>(url: string, method: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    const response: AxiosResponse<T> = await this.api.request<T>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  }

  async register(email: string, username: string, password: string, passwordConfirmation: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', {
        auth: { email, username, password, password_confirmation: passwordConfirmation },
      });
      console.log('Register response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Register error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка регистрации');
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
        auth: { email, password },
      });
      console.log('Login response:', response.data);
      const { access_token, refresh_token, user } = response.data;
      if (access_token && refresh_token) {
        this.saveTokens(access_token, refresh_token, user);
      }
      return response.data;
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Login error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка авторизации');
    }
  }

  async refresh(): Promise<void> {
    if (!this.refreshToken) throw new Error('Нет refresh токена');
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/refresh', {
        refresh_token: this.refreshToken,
      });
      console.log('Refresh response:', response.data);
      const { access_token, refresh_token, user } = response.data;
      if (access_token) {
        this.saveTokens(access_token, refresh_token || this.refreshToken!, user);
      }
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Refresh error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка обновления токена');
    }
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        console.log('Отправка запроса на logout с refresh_token:', this.refreshToken);
        await this.api.delete('/auth/logout', { params: { refresh_token: this.refreshToken } });
        console.log('Logout successful');
      } catch (error) {
        console.error('Logout error:', (error as AxiosError<AuthError>).response?.data || error);
      }
    } else {
      console.log('Нет refresh_token для logout');
    }
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      console.log('Токены и пользователь удалены из localStorage');
    }
    delete this.api.defaults.headers.common['Authorization'];
  }

  async confirmEmail(token: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.get('/auth/confirm', { params: { token } });
      console.log('Confirm email response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Confirm email error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка подтверждения email');
    }
  }

  async sendConfirmation(email: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/send_confirmation', { email });
      console.log('Send confirmation response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Send confirmation error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка отправки письма подтверждения');
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/request_password_reset', {
        auth: { email },
      });
      console.log('Request password reset response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Request password reset error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка запроса сброса пароля');
    }
  }

  async resetPassword(token: string, password: string, passwordConfirmation: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/reset_password', {
        auth: { token, password, password_confirmation: passwordConfirmation },
      });
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<AuthError>;
      console.error('Reset password error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Ошибка сброса пароля');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}

export const authService = new AuthService();