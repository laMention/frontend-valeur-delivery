import Card from '../../components/common/Card';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import type { AdminDashboardData } from '../../services/DashboardService';

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    order_created: '➕',
    order_updated: '✏️',
    order_deleted: '🗑️',
    login: '🔐',
    logout: '🚪',
  };
  return icons[type] ?? '📋';
}

interface Props {
  data: AdminDashboardData;
}

export default function AdminDashboardView({ data }: Props) {
  const {
    total_orders,
    delivered_orders,
    pending_orders,
    returned_orders,
    average_delivery_time,
    total_revenue,
    activities,
  } = data;

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Commandes</p>
            <p className="text-3xl font-bold text-primary-red">{total_orders ?? 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Livrées</p>
            <p className="text-3xl font-bold text-green-600">{delivered_orders ?? 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">En attente</p>
            <p className="text-3xl font-bold text-amber-600">{pending_orders ?? 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Retournées</p>
            <p className="text-3xl font-bold text-red-600">{returned_orders ?? 0}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Performance">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temps moyen de livraison</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {average_delivery_time ?? 0} min
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenus totaux</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(total_revenue ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Activités récentes">
          {!activities?.length ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Aucune activité récente
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity: { type: string; description: string; created_at: string }, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
