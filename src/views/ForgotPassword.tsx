import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { tailwindClasses } from '../utils/tailwindClasses';
import { detectIdentifierType, validateIdentifier } from '../utils/validators';
// import { useToastContext } from '../contexts/ToastContext';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import logo from '../assets/VD_LOGO.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [identifierError, setIdentifierError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'channel-selection'>('request');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    setIdentifierError('');

    if (value.trim() && !validateIdentifier(value)) {
      const type = detectIdentifierType(value);
      if (type === null) {
        setIdentifierError('Veuillez entrer un email valide ou un numéro de téléphone');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError('');
    setLoading(true);

    if (!identifier.trim()) {
      setIdentifierError('Veuillez entrer un email ou un numéro de téléphone');
      setLoading(false);
      return;
    }

    if (!validateIdentifier(identifier)) {
      setIdentifierError('Format invalide. Veuillez entrer un email valide ou un numéro de téléphone');
      setLoading(false);
      return;
    }

    // Si c'est un téléphone, demander le canal
    const identifierType = detectIdentifierType(identifier);
    if (identifierType === 'phone' && step === 'request') {
      setStep('channel-selection');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.forgotPassword(identifier, channel);
      
      if (result.success) {
        setSnackbarMessage('Code de vérification envoyé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Rediriger vers la page de vérification avec les données
        navigate('/verify-otp', {
          state: {
            userId: result.data.user_id,
            channel: result.data.channel,
            expiresAt: result.data.expires_at,
            identifier: identifier,
          }
        });
      }
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errorMessage = errorResponse?.response?.data?.message || 'Erreur lors de l\'envoi du code';
      const errors = errorResponse?.response?.data?.errors;
      
      if (errors && errors.identifier) {
        setIdentifierError(errors.identifier[0]);
      } else {
        setIdentifierError(errorMessage);
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

  return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 flex items-center justify-center flex-col">
            {logo ? 
              <img src={logo} alt="Logo" className="w-50 h-50" /> : 
              <h1 className={tailwindClasses.pageTitle}>Valeur Delivery</h1>
            }
            <p className="text-gray-600">Réinitialisation du mot de passe</p>
          </div>

          <div className={tailwindClasses.card}>
            <form onSubmit={handleSubmit}>
              {step === 'request' ? (
                <>
                  <Input
                    label="Email ou numéro de téléphone"
                    type="text"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    required
                    placeholder="exemple@email.com ou +225 07 12 34 56 78"
                    error={identifierError}
                  />

                  <Button type="submit" loading={loading} variant="primary" className="w-full">
                    Envoyer le code
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choisissez le canal de réception du code pour <strong>{identifier}</strong>
                    </p>
                    
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          name="channel"
                          value="sms"
                          checked={channel === 'sms'}
                          onChange={(e) => setChannel(e.target.value as 'sms')}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">SMS</div>
                          <div className="text-xs text-gray-500">Recevoir le code par SMS</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          name="channel"
                          value="whatsapp"
                          checked={channel === 'whatsapp'}
                          onChange={(e) => setChannel(e.target.value as 'whatsapp')}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">WhatsApp</div>
                          <div className="text-xs text-gray-500">Recevoir le code par WhatsApp</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep('request')}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button type="submit" loading={loading} variant="primary" className="flex-1">
                      Envoyer le code
                    </Button>
                  </div>
                </>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-primary-red hover:underline cursor-pointer"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
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

