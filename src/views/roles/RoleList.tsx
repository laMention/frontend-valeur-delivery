import { useEffect, useState } from 'react';
import { roleService } from '../../services/RoleService';
import { usePermissions } from '../../hooks/usePermissions';
import type { Role } from '../../models/Permission';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { useNavigate } from 'react-router-dom';

export default function RoleList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const result = await roleService.getAll();
      if (result.data) {
        setRoles(result.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        await roleService.delete(uuid);
        loadRoles();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Gestion des Rôles</h1>
        {canCreate('role') && (
          <Button onClick={() => navigate('/roles/new')}>
            + Nouveau rôle
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>Nom</th>
                  <th className={tailwindClasses.tableHeaderCell}>Nom d'affichage</th>
                  <th className={tailwindClasses.tableHeaderCell}>Type</th>
                  <th className={tailwindClasses.tableHeaderCell}>Permissions</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {roles.map((role) => (
                  <tr key={role.uuid}>
                    <td className={tailwindClasses.tableCell}>
                      <span className="font-medium">{role.name}</span>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {role.display_name || role.name}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {role.is_super_admin ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold">
                          Super Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <span className="text-sm text-gray-600">
                        {role.permissions?.length || 0} permission(s)
                      </span>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex gap-2">
                        {canUpdate('role') && (
                          <Button
                            variant="primary"
                            onClick={() => navigate(`/roles/${role.uuid}`)}
                          >
                            Voir / Modifier
                          </Button>
                        )}
                        {canDelete('role') && !role.is_super_admin && (
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(role.uuid)}
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
    </div>
  );
}

