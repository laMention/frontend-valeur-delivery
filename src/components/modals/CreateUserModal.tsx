import { useState } from 'react';
import { userService } from '../../services/UserService';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import { roleService } from '../../services/RoleService';
import type { Role } from '../../models/Permission';
import type { User } from '../../models/User';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
  defaultRole?: 'partner' | 'courier';
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
  defaultRole,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role_id: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      const result = await roleService.getAll({ per_page: 100 });
      if (result.data) {
        // Filtrer pour ne garder que le rôle approprié si defaultRole est fourni
        let filteredRoles = result.data;
        if (defaultRole) {
          filteredRoles = result.data.filter(r => r.name === defaultRole);
          if (filteredRoles.length > 0) {
            setFormData(prev => ({ ...prev, role_id: filteredRoles[0].uuid }));
          }
        }
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      };

      if (formData.role_id) {
        data.role_ids = [formData.role_id];
      }

      const result = await userService.create(data);
      if (result.data) {
        onUserCreated(result.data);
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          password_confirmation: '',
          role_id: '',
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Créer un nouvel utilisateur
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                label="Rôle"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                options={[
                  { value: '', label: 'Aucun rôle' },
                  ...roles.map(role => ({
                    value: role.uuid,
                    label: role.display_name || role.name,
                  }))
                ]}
              />

              <Input
                label="Mot de passe *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              <Input
                label="Confirmation du mot de passe *"
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="submit" loading={loading} variant="primary" className="flex-1">
                Créer
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

