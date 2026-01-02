import { authService, type LoginCredentials, type RegisterData } from '../services/AuthService';

class AuthController {
  async login(credentials: LoginCredentials) {
    try {
      const response = await authService.login(credentials);
      return { success: true, data: response };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur de connexion' };
    }
  }

  async register(data: RegisterData) {
    try {
      const response = await authService.register(data);
      return { success: true, data: response };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur d\'inscription' };
    }
  }

  async logout() {
    try {
      await authService.logout();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur de déconnexion' };
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, data: response };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur' };
    }
  }

  async resetPassword(token: string, email: string, password: string, password_confirmation: string) {
    try {
      const response = await authService.resetPassword(token, email, password, password_confirmation);
      return { success: true, data: response };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur' };
    }
  }

  getCurrentUser() {
    return authService.getCurrentUser();
  }

  isAuthenticated() {
    return authService.isAuthenticated();
  }
}

export const authController = new AuthController();

