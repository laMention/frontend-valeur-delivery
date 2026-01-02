import { useState, useEffect } from 'react';
import { authController } from '../controllers/AuthController';
import { authService } from '../services/AuthService';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const authenticated = authController.isAuthenticated();
      
      if (authenticated) {
        try {
          // Charger l'utilisateur depuis l'API pour avoir les rôles à jour
          const response = await authService.getMe();
          if (response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            // Mettre à jour le localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Fallback sur localStorage si l'API échoue
            const currentUser = authController.getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(!!currentUser);
          }
        } catch (error) {
          // Fallback sur localStorage si l'API échoue
          const currentUser = authController.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    const result = await authController.login({ identifier, password });
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    const result = await authController.logout();
    if (result.success) {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
    return result;
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };
};

