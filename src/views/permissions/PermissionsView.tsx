import { useState, useEffect } from 'react';
import { permissionService } from '../../services/PermissionService';
import { roleService } from '../../services/RoleService';
import { useNavigate } from 'react-router-dom';
import type { Role, Permission } from '../../models/Permission';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { tailwindClasses } from '../../utils/tailwindClasses';

export default function PermissionsView() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesResult, permissionsResult] = await Promise.all([
        roleService.getAll(),
        permissionService.getPermissions(),
      ]);

      if (rolesResult.data) {
        setRoles(rolesResult.data);
        if (rolesResult.data.length > 0 && !selectedRole) {
          setSelectedRole(rolesResult.data[0].uuid);
        }
      }
      if (permissionsResult.data) {
        setPermissions(permissionsResult.data);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (roleUuid: string, permissionUuid: string, hasPermission: boolean) => {
    const role = roles.find(r => r.uuid === roleUuid);
    
    // Ne pas permettre de modifier les permissions de super_admin
    if (role?.is_super_admin) {
      alert('Les permissions du rôle Super Admin ne peuvent pas être modifiées');
      return;
    }

    setSaving(true);
    try {
      if (hasPermission) {
        await permissionService.revokePermission(roleUuid, permissionUuid);
      } else {
        await permissionService.grantPermission(roleUuid, permissionUuid);
      }
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const currentRole = roles.find(r => r.uuid === selectedRole);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Configuration des Permissions</h1>
        <Button onClick={() => navigate('/roles')} variant="secondary">
          Gérer les rôles
        </Button>
      </div>

      <Card title="Sélectionner un rôle" className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {roles.map((role) => (
            <button
              key={role.uuid}
              onClick={() => setSelectedRole(role.uuid)}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
                selectedRole === role.uuid
                  ? 'bg-red-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-900 hover:text-white'
              }`}
            >
              {role.display_name || role.name}
              {role.is_super_admin ? <span className="text-xs text-gray-500"> (Super Admin)</span> : ''}
            </button>
          ))}
        </div>
      </Card>

      {currentRole && (
        <Card title={`Permissions du rôle : ${currentRole.display_name || currentRole.name}`}>
          {currentRole.is_super_admin ? (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
              <p className="font-semibold">Rôle Super Admin</p>
              <p className="text-sm">Ce rôle a toutes les permissions et ne peut pas être modifié.</p>
            </div>
          ) : ''}

          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>Permission</th>
                  <th className={tailwindClasses.tableHeaderCell}>Assignée</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {permissions.map((permission) => {
                  const hasPermission = currentRole.permissions?.some(
                    (p: Permission) => p.uuid === permission.uuid
                  ) || currentRole.is_super_admin || false;

                  return (
                    <tr key={permission.uuid}>
                      <td className={tailwindClasses.tableCell}>
                        <div>
                          <div className="font-medium">{permission.display_name || permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.name}</div>
                        </div>
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        <label className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() => togglePermission(currentRole.uuid, permission.uuid, hasPermission)}
                            disabled={saving || currentRole.is_super_admin}
                            className="w-5 h-5 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
