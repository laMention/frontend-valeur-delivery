import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authController } from '../controllers/AuthController';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import { tailwindClasses } from '../utils/tailwindClasses';
import { detectIdentifierType, validateIdentifier } from '../utils/validators';
import logo from '../assets/VD_LOGO.png';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    setIdentifierError('');

    // Validation en temps réel (seulement si l'utilisateur a commencé à taper)
    if (value.trim() && !validateIdentifier(value)) {
      const type = detectIdentifierType(value);
      if (type === null) {
        setIdentifierError('Veuillez entrer un email valide ou un numéro de téléphone');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIdentifierError('');
    setLoading(true);

    // Validation frontend
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

    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      setLoading(false);
      return;
    }

    try {
      const result = await authController.login({ identifier, password });
      
      if (result.success) {
        // Connexion réussie : navigation sans rechargement
        navigate('/');
      } else {
        // Erreur de connexion : afficher le message sans recharger
        setError(result.error || 'Erreur de connexion');
        setLoading(false);
      }
    } catch (error: unknown) {
      // Gestion d'erreur supplémentaire au cas où l'exception n'est pas capturée par le contrôleur
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Erreur de connexion';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 flex items-center justify-center flex-col">
        {logo ? 
          <img src={logo} alt="Logo" className="w-50 h-50" /> : 
          <h1 className={tailwindClasses.pageTitle}>Valeur Delivery</h1>
        }
          
          <p className="text-gray-600">Connexion à l'espace d'administration</p>

        </div>

        <div className={tailwindClasses.card}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <Input
              label="Email ou numéro de téléphone"
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              required
              autoComplete="username"
              placeholder="exemple@email.com ou +225 07 12 34 56 78"
              error={identifierError}
            />

            <PasswordInput
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} variant="primary" className="w-full">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

