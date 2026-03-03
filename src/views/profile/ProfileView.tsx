import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { userService } from '../../services/UserService';
import Card from '../../components/common/Card';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatRoleName, getRoleBadgeColor, getRoleIcon } from '../../utils/roleHelpers';
import type { Role } from '../../utils/roleHelpers';

export default function ProfileView() {
  const { user } = useAuth();
  const { getUserRoles } = usePermissions();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uuid) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.uuid) return;
    
    setLoading(true);
    try {
      const result = await userService.getById(user.uuid);
      if (result.data) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const displayUser = profile || user;

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Mon Profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Informations personnelles">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <p className="text-gray-900">{displayUser?.name || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{displayUser?.email || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <p className="text-gray-900">{displayUser?.phone || '-'}</p>
            </div>

            {/* Si l'utilisateur est partenaire, afficher les informations sur sa compagnie */}
            {(displayUser?.partner?.company_name || displayUser?.partner?.address) && (
              <>
                {displayUser?.partner?.company_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">Société / Compagnie</label>
                    <p className="text-gray-900 dark:text-gray-900">{displayUser.partner.company_name}</p>
                  </div>
                )}
                {displayUser?.partner?.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 mb-1">Adresse de l'entreprise</label>
                    <p className="text-gray-900 dark:text-gray-900">{displayUser.partner.address}</p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôles</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(() => {
                  // Utiliser les rôles de l'utilisateur connecté via usePermissions
                  const roles = getUserRoles();
                  return roles.length > 0 ? (
                    roles.map((role: Role) => (
                      <span
                        key={role.uuid}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(role)}`}
                        title={role.display_name || role.name}
                      >
                        {getRoleIcon(role)} {formatRoleName(role)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Aucun rôle assigné</span>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Photo de profil">
          <div className="flex flex-col items-center">
            <div className="w-50 h-50 bg-red-900 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-4">
              {user?.files?.find((file: { category: string; url: string }) => file.category === 'profile')?.url ? (
                <img src={user?.files?.find((file: { category: string; url: string }) => file?.category === 'profile')?.url} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-24 h-24 bg-red-900 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-4">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

