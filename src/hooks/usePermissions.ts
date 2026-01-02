import { useAuth } from './useAuth';
import type { Role } from '../utils/roleHelpers';

export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  const hasRole = (roleName: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((role: any) => role.name === roleName);
  };

  /**
   * Vérifie si l'utilisateur a au moins un des rôles spécifiés
   */
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((role: any) => roleNames.includes(role.name));
  };

  /**
   * Vérifie si l'utilisateur a tous les rôles spécifiés
   */
  const hasAllRoles = (roleNames: string[]): boolean => {
    if (!user?.roles) return false;
    return roleNames.every(roleName => 
      user.roles.some((role: any) => role.name === roleName)
    );
  };

  /**
   * Vérifie si l'utilisateur est Admin ou SuperAdmin
   * Le SuperAdmin est implicitement reconnu comme Admin
   */
  const isAdmin = (): boolean => {
    return hasRole('admin') || hasRole('super_admin');
  };

  /**
   * Vérifie si l'utilisateur est SuperAdmin
   */
  const isSuperAdmin = (): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((role: any) => 
      role.name === 'super_admin' || role.is_super_admin === true
    );
  };

  /**
   * Vérifie si l'utilisateur est Partenaire
   */
  const isPartner = (): boolean => {
    return hasRole('partner');
  };

  /**
   * Vérifie si l'utilisateur est Livreur
   */
  const isCourier = (): boolean => {
    return hasRole('courier');
  };

  /**
   * Retourne tous les rôles de l'utilisateur (pour affichage uniquement)
   * Ne doit pas être utilisé pour des vérifications de permissions
   */
  const getUserRoles = (): Role[] => {
    if (!user?.roles) return [];
    return user.roles as Role[];
  };

  /**
   * Retourne le nombre de rôles de l'utilisateur
   */
  const getRolesCount = (): number => {
    return getUserRoles().length;
  };

  /**
   * Vérifie si l'utilisateur peut créer (Admin, SuperAdmin, ou Partenaire selon le contexte)
   */
  const canCreate = (resourceType: 'user' | 'order' | 'partner' | 'courier'): boolean => {
    if (isSuperAdmin()) return true;
    
    switch (resourceType) {
      case 'user':
      case 'partner':
      case 'courier':
        return isAdmin();
      case 'order':
        return isAdmin() || isPartner();
      default:
        return false;
    }
  };

  /**
   * Vérifie si l'utilisateur peut modifier
   */
  const canUpdate = (resourceType: 'user' | 'order' | 'partner' | 'courier'): boolean => {
    if (isSuperAdmin()) return true;
    return isAdmin() || (resourceType === 'order' && isPartner());
  };

  /**
   * Vérifie si l'utilisateur peut supprimer
   */
  const canDelete = (resourceType: 'user' | 'order' | 'partner' | 'courier'): boolean => {
    if (isSuperAdmin()) return true;
    return isAdmin();
  };

  /**
   * Vérifie si l'utilisateur peut accéder à une page spécifique
   */
  const canAccess = (page: string): boolean => {
    if (isSuperAdmin()) return true;

    const pagePermissions: Record<string, () => boolean> = {
      '/users': () => isAdmin(),
      '/partners': () => isAdmin(),
      '/couriers': () => isAdmin(),
      '/assignments': () => isAdmin(),
      '/reconciliation': () => isAdmin(),
      '/pricing': () => isAdmin(),
      '/labels': () => isAdmin() || isPartner(),
      '/routes': () => isAdmin() || isCourier(),
      '/audit': () => isAdmin(),
      '/permissions': () => isAdmin(),
      '/reporting': () => isAdmin(),
      '/zones': () => isAdmin(),
      '/orders': () => isAdmin() || isPartner(),
      '/profile': () => true, // Tous les utilisateurs peuvent accéder à leur profil
      '/settings': () => true, // Tous les utilisateurs peuvent accéder aux paramètres
    };

    const checkPermission = pagePermissions[page];
    return checkPermission ? checkPermission() : true;
  };

  return {
    // Vérifications de rôles
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isSuperAdmin,
    isPartner,
    isCourier,
    
    // Utilitaires
    getUserRoles,
    getRolesCount,
    
    // Vérifications de permissions
    canCreate,
    canUpdate,
    canDelete,
    canAccess,
  };
};

