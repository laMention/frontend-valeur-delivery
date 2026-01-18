import { useEffect, useState } from 'react';
import { userActivityService, type UserActivity } from '../../services/UserActivityService';
import Card from './Card';
import { formatDateTime } from '../../utils/formatters';

export default function RecentActivities() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const result = await userActivityService.getRecent();
      if (result.data) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'order_created':
        return '➕';
      case 'order_updated':
        return '✏️';
      case 'order_deleted':
        return '🗑️';
      default:
        return '📋';
    }
  };

  return (
    <Card title="Activités récentes">
      {loading ? (
        <div className="text-center py-4 text-gray-500">Chargement...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Aucune activité récente
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDateTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
