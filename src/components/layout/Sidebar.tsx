import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import logo from '../../assets/VD_LOGO.png';

interface MenuItem {
  name: string;
  path: string;
  icon: string;
  roles?: string[];
  permission?: string;
}



export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { hasAnyRole, hasPermission, isSuperAdmin, isPartner } = usePermissions();
  const { theme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  const menuItems = useMemo(() => {
    return [
      { name: 'Tableau de bord', path: '/', icon: '📊' },
      { name: 'Commandes', path: '/orders', icon: '📦', roles: ['admin','super_admin', 'partner'] },
      { name: 'Suivi des livraisons', path: '/partner/tracking', icon: '📍', permission: 'partner.tracking.view' },
      { name: 'Utilisateurs', path: '/users', icon: '👥', roles: ['admin','super_admin'] },
      { name: 'Partenaires', path: '/partners', icon: '🏢', roles: ['admin','super_admin'] },
      { name: 'Livreurs', path: '/couriers', icon: '🚴', roles: ['admin','super_admin'] },
      { name: 'Attributions', path: '/assignments', icon: '📋', roles: ['admin','super_admin'] },
      { name: 'Réconciliation', path: '/reconciliation', icon: '✅', roles: ['admin','super_admin'] },
      // { name: 'Tarification', path: '/pricing', icon: '💰', roles: ['admin','super_admin'] }, // Désactivé - Calcul automatique dans les commandes
      { name: 'Grille Tarifaire', path: '/pricing-rules', icon: '📋', roles: ['admin','super_admin'] },
      { name: 'Zones de livraison', path: '/zones', icon: '🗺️', roles: ['admin','super_admin'] },
      { name: 'Étiquettes', path: '/labels', icon: '🏷️', roles: ['admin', 'partner','super_admin'] },
      { name: 'Itinéraires', path: '/routes', icon: '🗺️', roles: ['admin', 'courier','super_admin'] },
      { name: 'Audit / Activités', path: '/audit', icon: '📋', roles: ['admin', 'super_admin'] },
      { name: 'Rôles', path: '/roles', icon: '👤', roles: ['admin', 'super_admin'] },
      { name: 'Permissions', path: '/permissions', icon: '🔐', roles: ['admin', 'super_admin'] },
      { name: 'Reporting', path: '/reporting', icon: '📈', roles: ['admin','super_admin'] },
      // { name: 'Intégrations (Admin)', path: '/admin/integrations', icon: '🔌', permission: 'integrations.view_all' },
      // Si l'utilisateur n'est pas partenaire, on redirige vers la page liste des integrations sinon vers la page pour generer une clé API
      { name: 'Intégration', path: !isPartner() ? '/admin/integrations' : '/integrations', icon: '🔌', permission: 'integration.view' },
    ];
  }, [isSuperAdmin, hasPermission, hasAnyRole, isPartner]);

  const filteredMenuItems = menuItems.filter((item) => {
    // Si super admin, tout est visible
    if (isSuperAdmin()) return true;
    
    // Vérifier la permission si définie
    if (item.permission) {
      return hasPermission(item.permission);
    }
    
    // Sinon, vérifier les rôles
    if (item.roles) {
      return hasAnyRole(item.roles);
    }
    
    // Par défaut, visible
    return true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden fixed top-4 left-4 z-50 p-2 text-white rounded-md transition-colors ${
          theme === 'light' ? 'bg-red-900' : 'bg-black'
        }`}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static
          top-0 left-0
          h-screen
          flex flex-col
          transform transition-all duration-300 ease-in-out
          z-40
          border-r 
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${theme === 'light' 
            ? 'bg-red-900 border-red-800' 
            : 'bg-black border-gray-800'
          }
        `}
      >
        {/* Header avec logo et bouton toggle */}
        <div className={`p-4 border-b flex items-center justify-between bg-white flex-shrink-0 ${
          theme === 'light' ? 'border-red-800' : 'border-gray-800'
        }`}>
          {!isCollapsed && (
            <img src={logo} alt="Logo" className="w-20 h-20 mx-auto" />
          )}
          {isCollapsed && (
            <img src={logo} alt="Logo" className="w-10 h-10 mx-auto" />
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-xl transition-colors cursor-pointer  ${
              theme === 'light'
                ? 'text-white bg-gray-800  hover:bg-red-800 hover:text-white'
                : 'text-white bg-red-900 hover:bg-gray-800 hover:text-white'
            }`}
            title={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-label={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          >
            <Icon 
              path={isCollapsed ? mdiChevronRight : mdiChevronLeft} 
              size={1.2}
              className="w-5 h-5 "
            />
          </button>
        </div>

        {/* Menu avec scroll vertical */}
        <nav className="flex-1 overflow-y-auto mt-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3
                  px-6 py-3
                  transition-colors
                  ${isCollapsed ? 'justify-center px-3' : ''}
                  ${isActive
                    ? theme === 'light'
                      ? 'bg-red-800 text-white border-r-4 border-white'
                      : 'bg-gray-800 text-white border-r-4 border-red-900'
                    : theme === 'light'
                      ? 'text-white hover:bg-red-800'
                      : 'text-gray-300 hover:bg-gray-800'
                  }
                `}
                title={isCollapsed ? item.name : ''}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

