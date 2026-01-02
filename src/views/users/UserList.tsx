import { useEffect, useState } from 'react';
import { userController } from '../../controllers/UserController';
import { usePermissions } from '../../hooks/usePermissions';
import type { User } from '../../models/User';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function UserList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete, isSuperAdmin } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    name: '',
    created_from: '',
    created_to: '',
    role: '',
    is_active: '',
  });
  
  // État pour la modal de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: User | null;
    action: 'activate' | 'suspend' | null;
    loading: boolean;
  }>({
    isOpen: false,
    user: null,
    action: null,
    loading: false,
  });

  useEffect(() => {
    loadUsers();
  }, [page, filters]);

  const loadUsers = async () => {
    setLoading(true);
    const params: any = { page, per_page: 20 };
    if (filters.name) params.name = filters.name;
    if (filters.created_from) params.created_from = filters.created_from;
    if (filters.created_to) params.created_to = filters.created_to;
    if (filters.role) params.role = filters.role;
    if (filters.is_active !== '') params.is_active = filters.is_active === 'true';

    const result = await userController.getAll(params);
    if (result.success) {
      setUsers(result.data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (uuid: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      const result = await userController.delete(uuid);
      if (result.success) {
        loadUsers();
      }
    }
  };

  const handleToggleStatus = (user: User) => {
    setConfirmModal({
      isOpen: true,
      user,
      action: user.is_active ? 'suspend' : 'activate',
      loading: false,
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal.user || !confirmModal.action) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));

    try {
      const result = confirmModal.action === 'suspend'
        ? await userController.suspend(confirmModal.user.uuid)
        : await userController.activate(confirmModal.user.uuid);

      if (result.success) {
        // Mettre à jour l'utilisateur dans la liste localement
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.uuid === confirmModal.user!.uuid
              ? { ...u, is_active: !u.is_active }
              : u
          )
        );
        setConfirmModal({ isOpen: false, user: null, action: null, loading: false });
      } else {
        alert(result.error || 'Erreur lors de l\'opération');
        setConfirmModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'opération');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCloseModal = () => {
    if (!confirmModal.loading) {
      setConfirmModal({ isOpen: false, user: null, action: null, loading: false });
    }
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      created_from: '',
      created_to: '',
      role: '',
      is_active: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Utilisateurs</h1>
        {canCreate('user') && (
          <Button onClick={() => navigate('/users/new')}>
            + Nouvel utilisateur
          </Button>
        )}
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Rechercher par nom"
            placeholder="Nom de l'utilisateur..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />

          <Input
            label="Date de création (début)"
            type="date"
            value={filters.created_from}
            onChange={(e) => setFilters({ ...filters, created_from: e.target.value })}
          />

          <Input
            label="Date de création (fin)"
            type="date"
            value={filters.created_to}
            onChange={(e) => setFilters({ ...filters, created_to: e.target.value })}
          />

          <Select
            label="Rôle"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            options={[
              { value: '', label: 'Tous les rôles' },
              { value: 'admin', label: 'Admin' },
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'partner', label: 'Partenaire' },
              { value: 'courier', label: 'Livreur' },
            ]}
          />

          <Select
            label="Statut"
            value={filters.is_active}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'true', label: 'Actif' },
              { value: 'false', label: 'Inactif' },
            ]}
          />
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>Nom</th>
                  <th className={tailwindClasses.tableHeaderCell}>Email</th>
                  <th className={tailwindClasses.tableHeaderCell}>Téléphone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Rôles</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Créé le</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {users.map((user) => (
                  <tr key={user.uuid}>
                    <td className={tailwindClasses.tableCell}>{user.name}</td>
                    <td className={tailwindClasses.tableCell}>{user.email}</td>
                    <td className={tailwindClasses.tableCell}>{user.phone || '-'}</td>
                    <td className={tailwindClasses.tableCell}>
                      {user.roles?.map((r) => r.display_name).join(', ') || '-'}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {user.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className={tailwindClasses.tableCell}>{formatDateTime(user.created_at)}</td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex gap-2">
                        {canUpdate('user') && (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/users/${user.uuid}`)}
                          >
                            Modifier
                          </Button>
                        )}
                        {isSuperAdmin() && (
                          <Button
                            variant={user.is_active ? 'danger' : 'primary'}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? 'Désactiver' : 'Activer'}
                          </Button>
                        )}
                        {canDelete('user') && (
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(user.uuid)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de confirmation pour activation/désactivation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmToggle}
        title={
          confirmModal.action === 'suspend'
            ? 'Désactiver le compte'
            : 'Activer le compte'
        }
        message={
          confirmModal.action === 'suspend'
            ? `Êtes-vous sûr de vouloir désactiver le compte de ${confirmModal.user?.name} ? L'utilisateur ne pourra plus accéder à la plateforme.`
            : `Êtes-vous sûr de vouloir activer le compte de ${confirmModal.user?.name} ? L'utilisateur pourra à nouveau accéder à la plateforme.`
        }
        confirmText={confirmModal.action === 'suspend' ? 'Désactiver' : 'Activer'}
        variant={confirmModal.action === 'suspend' ? 'danger' : 'primary'}
        loading={confirmModal.loading}
      />
    </div>
  );
}
