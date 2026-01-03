import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/AuthService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { tailwindClasses } from '../utils/tailwindClasses';
import logo from '../assets/VD_LOGO.png';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes en secondes
  const [canResend, setCanResend] = useState(false);

  const userId = location.state?.userId;
  const channel = location.state?.channel || 'email';
  const expiresAt = location.state?.expiresAt;
  const identifier = location.state?.identifier;
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [resendCount, setResendCount] = useState(0);
  const MAX_RESEND_ATTEMPTS = 3;

  useEffect(() => {
    if (!userId || !identifier) {
      navigate('/forgot-password');
      return;
    }

    // Timer pour l'expiration
    if (expiresAt) {
      const expirationTime = new Date(expiresAt).getTime();
      const initialRemaining = Math.max(
        0,
        Math.floor((expirationTime - Date.now()) / 1000)
      );
    
      setTimeLeft(initialRemaining);
    
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    
      return () => clearInterval(interval);
    }
  }, [userId, expiresAt, identifier, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
    setOtpError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setLoading(true);

    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Le code doit contenir 6 chiffres');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.verifyOtp(userId, otpCode);
      
      if (result.success) {
        // showSuccess('Code vérifié avec succès');
        // Rediriger vers la page de réinitialisation avec le token
        navigate('/reset-password', {
          state: {
            resetToken: result.data.reset_token,
            userId: result.data.user_id,
          }
        });
      }
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errorMessage = errorResponse?.response?.data?.message || 'Code invalide ou expiré';
      const errors = errorResponse?.response?.data?.errors;
      
      if (errors && errors.otp_code) {
        setOtpError(errors.otp_code[0]);
      } else {
        setOtpError(errorMessage);
        // showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!identifier) return;

    // Vérifier la limite de renvois
    if (resendCount >= MAX_RESEND_ATTEMPTS) {
      setSnackbarMessage(`Vous avez atteint la limite de renvois (${MAX_RESEND_ATTEMPTS} tentatives). Veuillez réessayer plus tard.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setResending(true);
    setOtpError('');
    setError('');
    setSuccess('');

    try {
      const result = await authService.resendOtp(identifier);
      
      if (result.success) {
        // Mettre à jour le state avec les nouvelles données
        const newExpiresAt = result.data.expires_at;
        
        // Mettre à jour le timer
        const expirationTime = new Date(newExpiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
        setTimeLeft(remaining);
        setCanResend(false);
        
        // Réinitialiser le formulaire
        setOtpCode('');
        
        // Afficher le message de succès
        setSnackbarMessage('Code de vérification renvoyé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Incrémenter le compteur de renvois
        setResendCount(prev => prev + 1);
        
        // Mettre à jour le timer
        // const updateTimer = () => {
        //   const now = Date.now();
        //   const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
        //   setTimeLeft(remaining);
        //   if (remaining === 0) {
        //     setCanResend(true);
        //   }
        // };
        
        // const interval = setInterval(updateTimer, 1000);
        // setTimeout(() => clearInterval(interval), remaining * 1000);
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setCanResend(true);      
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      
        return () => clearInterval(interval);
      }
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errorMessage = errorResponse?.response?.data?.message || 'Erreur lors du renvoi du code';
      const errors = errorResponse?.response?.data?.errors;
      
      let finalMessage = errorMessage;
      if (errors && errors.identifier) {
        finalMessage = errors.identifier[0];
      }
      
      setSnackbarMessage(finalMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setResending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (!userId || !identifier) {
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
          <p className="text-gray-600">Vérification du code</p>
        </div>

        <div className={tailwindClasses.card}>
          <div className="mb-4 text-center">
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
                {error}
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Un code de vérification a été envoyé par <strong>{channel === 'email' ? 'email' : channel === 'sms' ? 'SMS' : 'WhatsApp'}</strong>
            </p>
            {timeLeft > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Code valide pendant : <strong>{formatTime(timeLeft)}</strong>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Code de vérification (6 chiffres)"
              type="text"
              value={otpCode}
              onChange={handleOtpChange}
              required
              placeholder="000000"
              maxLength={6}
              error={otpError}
              className="text-center text-2xl tracking-widest"
            />

            <Button type="submit" loading={loading} variant="primary" className="w-full" disabled={otpCode.length !== 6}>
              Vérifier le code
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || timeLeft > 0  || resending || resendCount >= MAX_RESEND_ATTEMPTS}
              className="text-sm text-primary-red hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Envoi...' : resendCount >= MAX_RESEND_ATTEMPTS ? 'Limite de renvois atteinte' : 'Renvoyer le code'}
            </button>
            {/* {!canResend && timeLeft > 0 && (
              <p className="text-xs text-gray-500">
                Code valide pendant : {formatTime(timeLeft)}
              </p>
            )} */}
            {resendCount > 0 && resendCount < MAX_RESEND_ATTEMPTS && (
              <p className="text-xs text-gray-500">
                Renvois restants : {MAX_RESEND_ATTEMPTS - resendCount}
              </p>
            )}
            
            <div>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-gray-600 hover:underline cursor-pointer"
              >
                Retour
              </button>
            </div>
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

