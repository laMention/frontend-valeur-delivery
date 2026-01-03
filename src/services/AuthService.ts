import { apiClient } from './apiClient';

export interface LoginCredentials {
  identifier: string; // Email ou numéro de téléphone
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    uuid: string;
    name: string;
    email: string;
    phone?: string;
    roles: Array<{
      uuid: string;
      name: string;
      display_name: string;
    }>;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async forgotPassword(identifier: string, channel: 'email' | 'sms' | 'whatsapp' = 'email'): Promise<{ success: boolean; message: string; data: { user_id: string; channel: string; expires_at: string } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { user_id: string; channel: string; expires_at: string } }>('/auth/forgot-password', {
      identifier,
      channel,
    });
    return response.data;
  }

  async verifyOtp(userId: string, otpCode: string): Promise<{ success: boolean; message: string; data: { reset_token: string; user_id: string } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { reset_token: string; user_id: string } }>('/auth/verify-otp', {
      user_id: userId,
      otp_code: otpCode,
    });
    return response.data;
  }

  async resendOtp(identifier: string): Promise<{ success: boolean; message: string; data: { user_id: string; channel: string; expires_at: string } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { user_id: string; channel: string; expires_at: string } }>('/auth/resend-otp', {
      identifier: identifier,
    });
    return response.data;
  }

  async resetPassword(resetToken: string, password: string, passwordConfirmation: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', {
      reset_token: resetToken,
      password,
      password_confirmation: passwordConfirmation,
    });
    return response.data;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  async getMe(): Promise<{ data: { uuid: string; name: string; email: string; phone?: string; roles: Array<{ uuid: string; name: string; display_name: string }> } }> {
    const response = await apiClient.get<{ data: { uuid: string; name: string; email: string; phone?: string; roles: Array<{ uuid: string; name: string; display_name: string }> } }>('/auth/me');
    if (response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }
}

export const authService = new AuthService();

