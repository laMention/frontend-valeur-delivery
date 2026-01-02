import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/NotificationService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { Notification } from '../../models/Notification';
import { formatDateTime } from '../../utils/formatters';
import Badge from '../common/Badge';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead?: () => void;
}

export default function NotificationDropdown({ onClose, onNotificationRead }: NotificationDropdownProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.uuid) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadNotifications = async () => {
    if (!user?.uuid) return;
    
    setLoading(true);
    try {
      const result = await notificationService.getByUser(user.uuid, { unread_only: false });
      if (result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (uuid: string) => {
    try {
      await notificationService.markAsRead(uuid);
      setNotifications(notifications.map(n => 
        n.uuid === uuid ? { ...n, is_read: true } : n
      ));
      // Notifier le parent pour mettre à jour le compteur
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uuid) return;
    
    try {
      await notificationService.markAllAsRead(user.uuid);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      // Notifier le parent pour mettre à jour le compteur
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-96 rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden flex flex-col transition-colors ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-900 border-gray-700'
      }`}
    >
      <div className={`p-4 border-b flex justify-between items-center ${
        theme === 'light' ? 'border-gray-200' : 'border-gray-700'
      }`}>
        <h3 className={`font-semibold ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-red hover:underline"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className={`p-4 text-center ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className={`p-4 text-center ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>Aucune notification</div>
        ) : (
          <div className={`divide-y ${
            theme === 'light' ? 'divide-gray-100' : 'divide-gray-700'
          }`}>
            {notifications.map((notification) => (
              <div
                key={notification.uuid}
                className={`p-4 cursor-pointer transition-colors ${
                  !notification.is_read
                    ? theme === 'light' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-blue-900 hover:bg-blue-800'
                    : theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800'
                }`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.uuid)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    {notification.title && (
                      <h4 className={`font-medium mb-1 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>{notification.title}</h4>
                    )}
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>{notification.message}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-primary-red rounded-full ml-2 mt-1" />
                  )}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Badge status={notification.type}>
                    {notification.type.toUpperCase()}
                  </Badge>
                  <span className={`text-xs ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {formatDateTime(notification.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

