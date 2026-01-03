import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/AuthService';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import { tailwindClasses } from '../utils/tailwindClasses';
import logo from '../assets/VD_LOGO.png';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const resetToken = location.state?.resetToken;
  const userId = location.state?.userId;

  useEffect(() => {
    if (!resetToken || !userId) {
      navigate('/forgot-password');
    }
  }, [resetToken, userId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setLoading(true);

    // Validation côté client
    if (!password) {
      setPasswordError('Le nouveau mot de passe est requis');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setPasswordError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.resetPassword(resetToken, password, passwordConfirmation);
      
      if (result.success) {
        setSnackbarMessage('Mot de passe réinitialisé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errorMessage = errorResponse?.response?.data?.message || 'Erreur lors de la réinitialisation';
      const errors = errorResponse?.response?.data?.errors;
      
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0] || errorMessage;
        setPasswordError(firstError);
        setSnackbarMessage(firstError);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } else {
        setPasswordError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (!resetToken || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 flex items-center justify-center flex-col">
          {logo ? 
            <img src={logo} alt="Logo" className="w-50 h-50" /> : 
            <h1 className={tailwindClasses.pageTitle}>Valeur Delivery</h1>
          }
          <p className="text-gray-600">Nouveau mot de passe</p>
        </div>

        <div className={tailwindClasses.card}>
          <form onSubmit={handleSubmit}>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
                {passwordError}
              </div>
            )}

            <PasswordInput
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              required
              disabled={loading}
              minLength={8}
            />

            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value);
                setPasswordError('');
              }}
              required
              disabled={loading}
            />

            <div className="mt-2 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Le mot de passe doit contenir au moins 8 caractères.
              </p>
            </div>

            <Button type="submit" loading={loading} variant="primary" className="w-full" disabled={loading}>
              Réinitialiser le mot de passe
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

