import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userController } from '../../controllers/UserController';
import { roleService } from '../../services/RoleService';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { tailwindClasses } from '../../utils/tailwindClasses';
import type { Role } from '../../models/Permission';

export default function UserForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    is_active: true,
    role_ids: [] as string[],
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoles();
    if (uuid) {
      loadUser();
    }
  }, [uuid]);

  const loadRoles = async () => {
    try {
      const result = await roleService.getAll({ per_page: 100 });
      if (result.data) {
        setRoles(result.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadUser = async () => {
    const result = await userController.getById(uuid!);
    if (result.success) {
      setFormData({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || '',
        password: '',
        password_confirmation: '',
        is_active: result.data.is_active,
        role_ids: result.data.roles?.map(r => r.uuid) || [],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data: any = { ...formData };
    if (!data.password) {
      delete data.password;
      delete data.password_confirmation;
    }

    // Convertir role_ids en tableau si c'est une chaîne
    if (data.role_ids && typeof data.role_ids === 'string') {
      data.role_ids = [data.role_ids];
    }

    const result = uuid
      ? await userController.update(uuid, data)
      : await userController.create(data);

    if (result.success) {
      navigate('/users');
    } else {
      setError(result.error || 'Erreur');
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/users')}>
          Retour
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom complet *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Select
              label="Rôle(s)"
              value={formData.role_ids.length > 0 ? formData.role_ids[0] : ''}
              onChange={(e) => setFormData({ ...formData, role_ids: e.target.value ? [e.target.value] : [] })}
              options={[
                { value: '', label: 'Aucun rôle' },
                ...roles.map(role => ({
                  value: role.uuid,
                  label: role.display_name || role.name,
                }))
              ]}
            />

            <PasswordInput
              label={uuid ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!uuid}
            />

            <PasswordInput
              label="Confirmation du mot de passe"
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
              required={!uuid}
            />
          </div>

          {uuid && (
            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm font-medium text-gray-700">Utilisateur actif</span>
              </label>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <Button type="submit" loading={loading}>
              {uuid ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => navigate('/users')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
