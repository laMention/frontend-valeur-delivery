import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Verifier le mode de production ou de développement dans le fichier .env
const MODE = import.meta.env.VITE_APP_MODE;

let API_BASE_URL = '';
if (MODE === 'production') {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PRODUCTION;
} else if (MODE === 'preproduction') {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PREPRODUCTION;
} else {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor pour ajouter le token JWT
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                                error.config?.url?.includes('/auth/register');
          
          // Ne pas rediriger si c'est une tentative de connexion/inscription
          // Laissez le composant Login gérer l'erreur
          if (!isAuthRequest) {
            // Token expiré ou invalide pour les autres requêtes
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            // Ne rediriger que si on n'est pas déjà sur la page de login
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;

