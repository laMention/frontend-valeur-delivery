import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/NotificationService';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { getPrimaryRole, getRoleBadgeColor, getRoleIcon, formatRoleName } from '../../utils/roleHelpers';
import type { Role } from '../../utils/roleHelpers';
import Icon from '@mdi/react';
import { mdiAccount, mdiCog, mdiLogout } from '@mdi/js';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { getUserRoles } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRoles = getUserRoles();

  useEffect(() => {
    if (!user?.uuid) return;

    const loadUnreadCount = async () => {
      try {
        const result = await notificationService.getUnreadCount(user.uuid);
        if (result.count !== undefined) {
          setUnreadCount(result.count);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    // Charger immédiatement
    loadUnreadCount();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user?.uuid]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={`px-6 py-4 border-b transition-colors ${
      theme === 'light' 
        ? 'bg-red-900 border-red-800' 
        : 'bg-black border-gray-800'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Bouton toggle sidebar (desktop) */}
          <button
            onClick={toggleSidebar}
            className="hidden md:block p-2 rounded-md hover:bg-red-800 text-white cursor-pointer transition-colors"
            title={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          >
            <span className="text-xl">☰</span>
          </button>
          <h2 className={`hidden md:block text-lg font-semibold ${
            theme === 'light' ? 'text-white' : 'text-white'
          }`}>Administration</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggle Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-red-800 text-white cursor-pointer transition-colors"
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          >
            <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-md hover:bg-red-800 text-white cursor-pointer transition-colors"
            >
              <span className="text-xl">🔔</span>
              {/* Badge toujours visible, même à 0 */}
              <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 text-white text-xs font-semibold rounded-full flex items-center justify-center ${
                unreadCount > 0 ? 'bg-red-600' : 'bg-gray-500'
              }`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </button>

            {showNotifications && (
              <NotificationDropdown 
                onClose={() => setShowNotifications(false)}
                onNotificationRead={() => {
                  // Recharger le compteur après marquage comme lu
                  if (user?.uuid) {
                    notificationService.getUnreadCount(user.uuid).then(result => {
                      if (result.count !== undefined) {
                        setUnreadCount(result.count);
                      }
                    });
                  }
                }}
              />
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-red-900 hover:text-white dark:hover:bg-gray-700 cursor-pointer"
            >
              <div className={`w-8 h-8  rounded-full flex items-center justify-center text-white font-semibold ${theme === 'light' ? 'bg-gray-900' : 'bg-red-900'}`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white">{user?.name || 'Utilisateur'}</span>
                {userRoles.length > 0 && (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const primaryRole = getPrimaryRole(userRoles);
                      if (primaryRole) {
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(primaryRole)}`}>
                            {getRoleIcon(primaryRole)} {formatRoleName(primaryRole)}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {userRoles.length > 1 && (
                      <span className="text-xs text-white opacity-75">
                        +{userRoles.length - 1}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-white opacity-75">▼</span>
            </button>

            {showMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg border py-2 z-50 transition-colors ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-900 border-gray-700'
              }`}>
                {/* Informations utilisateur */}
                <div className={`px-4 py-3 border-b ${
                  theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${theme === 'light' ? 'bg-gray-500' : 'bg-red-900'}`}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {user?.name || 'Utilisateur'}
                      </p>
                      <p className={`text-xs truncate ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rôles */}
                  {userRoles.length > 0 && (
                    <div className="mt-2">
                      
                      <div className="flex flex-wrap gap-1">
                        {userRoles.map((role: Role) => (
                          <span
                            key={role.uuid}
                            className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(role)}`}
                            title={role.display_name || role.name}
                          >
                            {getRoleIcon(role)} {formatRoleName(role)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu actions */}
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                <span className={`text-xs mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                <Icon path={mdiAccount} size={1} /> 
                </span>
                <span className="text-sm font-medium">Profil</span>
                 
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                <span className={`text-xs mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                <Icon path={mdiCog} size={1} /> 
                </span>
                <span className="text-sm font-medium">Paramètres</span>
                </button>
                <hr className={`my-2 ${
                  theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                }`} />
                <button
                  onClick={handleLogout}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'text-white bg-red-900 hover:bg-gray-100'
                      : 'text-white bg-red-900 hover:bg-gray-800'
                  }`}
                >
                <span className={`text-xs mb-1 ${theme === 'light' ? 'text-white' : 'text-white'}`}>
                <Icon path={mdiLogout} size={1} /> 
                </span>
                <span className="text-sm font-medium">Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

