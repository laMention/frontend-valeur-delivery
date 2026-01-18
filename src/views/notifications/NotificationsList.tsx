import { useEffect, useState } from 'react';
import { notificationService } from '../../services/NotificationService';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../contexts/ToastContext';
import type { Notification } from '../../models/Notification';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export default function NotificationsList() {
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    read_status: '',
    type: '',
  });
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, [filters, currentPage]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 20,
      };
      
      if (filters.read_status) {
        params.read_status = filters.read_status;
      }
      
      if (filters.type) {
        params.type = filters.type;
      }

      const result = await notificationService.getMyNotifications(params);
      if (result.data) {
        setNotifications(result.data);
      }
      if (result.meta) {
        setMeta(result.meta);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      showError('Erreur lors du chargement des notifications');
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
      showError('Erreur lors du marquage de la notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uuid) return;
    
    try {
      await notificationService.markAllAsRead(user.uuid);
      loadNotifications();
      success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showError('Erreur lors du marquage des notifications');
    }
  };

  const handleSelectNotification = (uuid: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.uuid)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;

    setDeleting(true);
    try {
      const result = await notificationService.deleteMultiple(Array.from(selectedNotifications));
      success(`${result.deleted} notification(s) supprimée(s)`);
      setSelectedNotifications(new Set());
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notifications:', error);
      showError('Erreur lors de la suppression des notifications');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedNotifications(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isRead = (notification: Notification) => {
    return notification.is_read === true || (notification as any).meta?.is_read === true;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Mes notifications</h1>
        <div className="flex gap-2">
          {selectedNotifications.size > 0 && (
            <Button
              variant="danger"
              onClick={handleDeleteSelected}
              loading={deleting}
              disabled={deleting}
            >
              Supprimer la sélection ({selectedNotifications.size})
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Statut"
            value={filters.read_status}
            onChange={(e) => {
              setFilters({ ...filters, read_status: e.target.value });
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'Toutes' },
              { value: 'unread', label: 'Non lues' },
              { value: 'read', label: 'Lues' },
            ]}
          />
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
              setCurrentPage(1);
            }}
            options={[
              { value: '', label: 'Tous les types' },
              { value: 'sms', label: 'SMS' },
              { value: 'email', label: 'Email' },
              { value: 'push', label: 'Push' },
              { value: 'system', label: 'Système' },
            ]}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune notification
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Tout sélectionner
              </label>
            </div>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.uuid}
                  className={`p-4 border rounded-lg ${
                    isRead(notification) 
                      ? 'bg-gray-50 dark:bg-gray-800 opacity-75' 
                      : 'bg-white dark:bg-gray-900'
                  } ${selectedNotifications.has(notification.uuid) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.uuid)}
                      onChange={() => handleSelectNotification(notification.uuid)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge status={notification.type}>
                          {notification.type.toUpperCase()}
                        </Badge>
                        {!isRead(notification) && (
                          <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
                            Nouvelle
                          </span>
                        )}
                      </div>
                      {notification.title && (
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {notification.title}
                        </p>
                      )}
                      <p className="text-gray-900 dark:text-gray-100 mb-2">{notification.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                    {!isRead(notification) && (
                      <Button
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.uuid)}
                        className="text-sm"
                      >
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Affichage de {meta.from} à {meta.to} sur {meta.total} notification(s)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    Page {meta.current_page} sur {meta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === meta.last_page}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
