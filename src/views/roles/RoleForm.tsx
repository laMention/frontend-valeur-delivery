import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roleService } from '../../services/RoleService';
import { permissionService } from '../../services/PermissionService';
import type { Role, Permission } from '../../models/Permission';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailwindClasses } from '../../utils/tailwindClasses';

export default function RoleForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    permission_ids: [] as string[],
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    loadPermissions();
    if (uuid) {
      loadRole();
    }
  }, [uuid]);

  const loadPermissions = async () => {
    try {
      const result = await permissionService.getPermissions();
      if (result.data) {
        setPermissions(result.data);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadRole = async () => {
    setLoading(true);
    try {
      const result = await roleService.getByUuid(uuid!);
      if (result.data) {
        const roleData = result.data;
        setRole(roleData);
        setFormData({
          name: roleData.name,
          display_name: roleData.display_name || roleData.name,
          permission_ids: roleData.permissions?.map(p => p.uuid) || [],
        });
      }
    } catch (error) {
      console.error('Error loading role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionUuid: string) => {
    setFormData(prev => {
      const hasPermission = prev.permission_ids.includes(permissionUuid);
      return {
        ...prev,
        permission_ids: hasPermission
          ? prev.permission_ids.filter(id => id !== permissionUuid)
          : [...prev.permission_ids, permissionUuid],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (uuid) {
        await roleService.update(uuid, formData);
      } else {
        await roleService.create(formData);
      }
      navigate('/roles');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (loading && uuid) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const isSuperAdmin = role?.is_super_admin;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier le rôle' : 'Nouveau rôle'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/roles')}>
          Retour
        </Button>
      </div>

      <Card>
        {isSuperAdmin && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
            <p className="font-semibold">Rôle Super Admin</p>
            <p className="text-sm">Ce rôle a toutes les permissions et ne peut pas être modifié.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Nom du rôle *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSuperAdmin}
            />

            <Input
              label="Nom d'affichage"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Nom affiché dans l'interface"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Permissions</h3>
            {isSuperAdmin ? (
              <div className="p-4 bg-gray-50 rounded border">
                <p className="text-sm text-gray-600">
                  Le rôle Super Admin a toutes les permissions. Aucune modification n'est nécessaire.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border rounded">
                {permissions.map((permission) => {
                  const hasPermission = formData.permission_ids.includes(permission.uuid);
                  return (
                    <label
                      key={permission.uuid}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={hasPermission}
                        onChange={() => handleTogglePermission(permission.uuid)}
                        className="w-4 h-4 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {permission.display_name || permission.name}
                        </div>
                        <div className="text-xs text-gray-500">{permission.name}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={loading} disabled={isSuperAdmin}>
              {uuid ? 'Mettre à jour' : 'Créer le rôle'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/roles')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

