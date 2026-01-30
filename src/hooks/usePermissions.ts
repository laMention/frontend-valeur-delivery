import { useAuth } from './useAuth';
import type { Role } from '../utils/roleHelpers';
import type { Permission } from '../models/User';

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
   * Vérifie si l'utilisateur est SuperAdmin
   */
  const isSuperAdmin = (): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((role: any) => 
      role.name === 'super_admin' || role.is_super_admin === true
    );
  };

  /**
   * Vérifie si l'utilisateur est Admin (pour affichage uniquement, pas pour les permissions)
   */
  const isAdmin = (): boolean => {
    return hasRole('admin') || isSuperAdmin();
  };

  /**
   * Vérifie si l'utilisateur est Partenaire (pour affichage uniquement, pas pour les permissions)
   */
  const isPartner = (): boolean => {
    return hasRole('partner');
  };

  /**
   * Vérifie si l'utilisateur est Livreur (pour affichage uniquement, pas pour les permissions)
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
  const getRoleCount = (): number => {
    return user?.roles?.length || 0;
  };

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permissionName: string): boolean => {
    // Les super_admin ont toutes les permissions
    if (isSuperAdmin()) return true;

    // Vérifier si l'utilisateur a la permission dans la liste consolidée
    if (!user?.permissions || user.permissions.length === 0) {
      return false;
    }

    return user.permissions.some((permission: Permission) => permission.name === permissionName);
  };

  /**
   * Vérifie si l'utilisateur peut créer une ressource spécifique
   */
  const canCreate = (resourceType: 'user' | 'order' | 'partner' | 'courier' | 'zone' | 'label' | 'pricing-rule' | 'role'): boolean => {
    if (isSuperAdmin()) return true;

    const permissionMap: Record<string, string> = {
      'user': 'create-user',
      'order': 'create-order',
      'partner': 'create-partner',
      'courier': 'create-courier',
      'zone': 'create-zones',
      'label': 'create-label',
      'pricing-rule': 'create-pricing-rule',
      'role': 'assign-roles',
    };

    const permission = permissionMap[resourceType];
    return permission ? hasPermission(permission) : false;
  };

  /**
   * Vérifie si l'utilisateur peut modifier une ressource spécifique
   */
  const canUpdate = (resourceType: 'user' | 'order' | 'partner' | 'courier' | 'zone' | 'label' | 'pricing-rule' | 'role'): boolean => {
    if (isSuperAdmin()) return true;

    const permissionMap: Record<string, string> = {
      'user': 'update-user',
      'order': 'update-order',
      'partner': 'update-partner',
      'courier': 'update-courier',
      'zone': 'update-zones',
      'label': 'update-label',
      'pricing-rule': 'update-pricing-rule',
      'role': 'assign-roles',
    };

    const permission = permissionMap[resourceType];
    return permission ? hasPermission(permission) : false;
  };

  /**
   * Vérifie si l'utilisateur peut supprimer une ressource spécifique
   */
  const canDelete = (resourceType: 'user' | 'order' | 'partner' | 'courier' | 'zone' | 'label' | 'pricing-rule' | 'role'): boolean => {
    if (isSuperAdmin()) return true;

    const permissionMap: Record<string, string> = {
      'user': 'delete-user',
      'order': 'delete-order',
      'partner': 'delete-partner',
      'courier': 'delete-courier',
      'zone': 'delete-zones',
      'label': 'delete-label',
      'pricing-rule': 'delete-pricing-rule',
      'role': 'assign-roles',
    };

    const permission = permissionMap[resourceType];
    return permission ? hasPermission(permission) : false;
  };

  /**
   * Vérifie si l'utilisateur peut accéder à une page spécifique
   */
  const canAccess = (page: string): boolean => {
    if (isSuperAdmin()) return true;

    const pagePermissions: Record<string, string> = {
      '/users': 'view-users',
      '/partners': 'view-partners',
      '/couriers': 'view-couriers',
      '/assignments': 'assign-delivery',
      '/reconciliation': 'view-reconciliation',
      '/pricing': 'view-pricing',
      '/labels': 'view-labels',
      '/routes': 'view-routes',
      '/audit': 'view-audit-logs',
      '/permissions': 'assign-permissions',
      '/reporting': 'view-reports',
      '/zones': 'view-zones',
      '/orders': 'view-orders',
      '/integrations': 'integration.view',
      '/admin/integrations': 'integrations.view_all',
      '/partner/tracking': 'partner.tracking.view',
      '/profile': '', // Tous les utilisateurs peuvent accéder à leur profil
      '/settings': '', // Tous les utilisateurs peuvent accéder aux paramètres
    };

    const permission = pagePermissions[page];
    if (!permission) return true; // Par défaut, autoriser l'accès si aucune permission n'est définie

    return hasPermission(permission);
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
    isAdmin,
    isPartner,
    isCourier,
    getUserRoles,
    getRoleCount,
    hasPermission,
    canCreate,
    canUpdate,
    canDelete,
    canAccess,
  };
};
