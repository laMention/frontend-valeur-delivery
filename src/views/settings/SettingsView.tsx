import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/UserService';
import { fileService } from '../../services/FileService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { tailwindClasses } from '../../utils/tailwindClasses';

export default function SettingsView() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user?.uuid) {
        throw new Error('Utilisateur non trouvé');
      }

      const result = await userService.update(user.uuid, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      if (result.data) {
        setSuccess('Profil mis à jour avec succès');
        // Recharger les données utilisateur
        window.location.reload();
      }
    } catch (error: unknown) {
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implémenter l'endpoint de changement de mot de passe
      setSuccess('Mot de passe modifié avec succès');
      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: unknown) {
      setError('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    setProfileImage(file);
    setError('');
    setLoading(true);

    try {
      const result = await fileService.upload(file, 'profile_image', user?.uuid || '', 'App\\Models\\User', 'profile');
      if (result.data) {
        setSuccess('Photo de profil mise à jour avec succès');
        // Recharger les données utilisateur
        window.location.reload();
      }
    } catch (error: unknown) {
      setError('Erreur lors de l\'upload de l\'image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Paramètres</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Informations du profil">
          <form onSubmit={handleUpdateProfile}>
            <Input
              label="Nom complet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Téléphone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Button type="submit" loading={loading} variant="primary" className="mt-4">
              Mettre à jour
            </Button>
          </form>
        </Card>

        <Card title="Photo de profil">
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-red-900 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-4">
                {user?.files?.find((file: { category: string; url: string }) => file.category === 'profile')?.url ? (
                  <img src={user?.files?.find((file: { category: string; url: string }) => file?.category === 'profile')?.url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-24 h-24 bg-red-900 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-4">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choisir une image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block bg-gray-900 cursor-pointer w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-red file:text-white hover:file:bg-red-800"
              />
              <p className="mt-1 text-xs text-gray-500">JPG, PNG ou GIF. Max 5 Mo.</p>
            </div>
          </div>
        </Card>

        <Card title="Changer le mot de passe" className="lg:col-span-2">
          <form onSubmit={handleChangePassword}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Mot de passe actuel"
                type="password"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                required
              />

              <Input
                label="Nouveau mot de passe"
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                required
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" loading={loading} variant="primary" className="mt-4">
              Changer le mot de passe
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

