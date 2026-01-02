export interface Role {
  uuid: string;
  name: string;
  display_name: string;
  is_super_admin?: boolean;
}

/**
 * Formate le nom du rôle pour l'affichage
 */
export const formatRoleName = (role: Role): string => {
  return role.display_name || role.name.charAt(0).toUpperCase() + role.name.slice(1);
};

/**
 * Obtient le rôle principal de l'utilisateur (priorité: super_admin > admin > autres)
 */
export const getPrimaryRole = (roles: Role[]): Role | null => {
  if (!roles || roles.length === 0) return null;
  
  // Priorité: super_admin > admin > autres
  const superAdmin = roles.find(r => r.name === 'super_admin' || r.is_super_admin);
  if (superAdmin) return superAdmin;
  
  const admin = roles.find(r => r.name === 'admin');
  if (admin) return admin;
  
  return roles[0];
};

/**
 * Obtient tous les noms de rôles formatés
 */
export const getAllRoleNames = (roles: Role[]): string => {
  if (!roles || roles.length === 0) return 'Aucun rôle';
  
  return roles.map(formatRoleName).join(', ');
};

/**
 * Obtient la couleur du badge selon le rôle
 */
export const getRoleBadgeColor = (role: Role): string => {
  switch (role.name) {
    case 'super_admin':
      return 'bg-purple-600 text-white';
    case 'admin':
      return 'bg-primary-red text-white';
    case 'partner':
      return 'bg-blue-600 text-white';
    case 'courier':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

/**
 * Obtient l'icône selon le rôle
 */
export const getRoleIcon = (role: Role): string => {
  switch (role.name) {
    case 'super_admin':
      return '👑';
    case 'admin':
      return '🛡️';
    case 'partner':
      return '🏢';
    case 'courier':
      return '🚴';
    default:
      return '👤';
  }
};

