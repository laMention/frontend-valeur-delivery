import { useState, useEffect, useRef } from 'react';
import { userService } from '../../services/UserService';
import { roleService } from '../../services/RoleService';
import type { User } from '../../models/User';
import SearchableSelect from './SearchableSelect';
import Button from './Button';
import CreateUserModal from '../modals/CreateUserModal';

interface UserSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  roleFilter?: 'partner' | 'courier';
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function UserSelect({
  label,
  value,
  onChange,
  roleFilter,
  placeholder = 'Sélectionner un utilisateur...',
  required = false,
  className = '',
  disabled = false,
}: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 100 };
      
      if (roleFilter) {
        // Charger les utilisateurs avec le rôle spécifié (exclut automatiquement admin/super_admin)
        const result = await roleService.getUsersByRole(roleFilter, params);
        if (result.data) {
          setUsers(result.data);
        }
      } else {
        // Charger tous les utilisateurs
        const result = await userService.getAll(params);
        if (result.data) {
          setUsers(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser: User) => {
    // Ajouter le nouvel utilisateur à la liste
    setUsers(prev => [newUser, ...prev]);
    // Sélectionner automatiquement le nouvel utilisateur
    onChange(newUser.uuid);
    setShowCreateModal(false);
  };

  const options = [
    { value: '', label: placeholder },
    ...users.map(user => ({
      value: user.uuid,
      label: `${user.name} (${user.email})`,
      email: user.email,
    }))
  ];

  return (
    <div className={className}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <SearchableSelect
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder="Rechercher par nom ou email..."
            disabled={disabled || loading}
          />
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreateModal(true)}
            className="mb-0"
          >
            + Créer
          </Button>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
          defaultRole={roleFilter}
        />
      )}
    </div>
  );
}

