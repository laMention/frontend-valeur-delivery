import { useEffect, useState } from 'react';
import { notificationService } from '../../services/NotificationService';
import { useAuth } from '../../hooks/useAuth';
import type { Notification } from '../../models/Notification';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';

export default function NotificationsList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (user?.uuid) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.uuid) return;
    
    setLoading(true);
    try {
      const result = await notificationService.getByUser(user.uuid);
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
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uuid) return;
    
    try {
      await notificationService.markAllAsRead(user.uuid);
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = filter
    ? notifications.filter(n => n.type === filter)
    : notifications;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Notifications</h1>
        {notifications.length > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <select
            className={tailwindClasses.select}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
            <option value="system">Système</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune notification
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.uuid}
                className={`p-4 border rounded-lg ${
                  notification.status === 'sent' ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge status={notification.type}>
                        {notification.type.toUpperCase()}
                      </Badge>
                      <Badge status={notification.status}>
                        {notification.status === 'sent' ? 'Envoyée' : notification.status === 'pending' ? 'En attente' : 'Échouée'}
                      </Badge>
                    </div>
                    <p className="text-gray-900 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">{formatDateTime(notification.created_at)}</p>
                  </div>
                  {notification.status === 'sent' && (
                    <Button
                      variant="outline"
                      onClick={() => handleMarkAsRead(notification.uuid)}
                    >
                      Marquer comme lu
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

