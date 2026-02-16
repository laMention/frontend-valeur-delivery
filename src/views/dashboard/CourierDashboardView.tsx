import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import type { CourierDashboardData } from '../../services/DashboardService';

const assignmentStatusLabels: Record<string, string> = {
  assigned: 'Assignée',
  accepted: 'Acceptée',
  picked: 'Collectée',
  delivering: 'En livraison',
  delivered: 'Livrée',
  returned: 'Retournée',
  completed: 'Terminée',
  canceled: 'Annulée',
};

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    order_created: '➕',
    order_updated: '✏️',
    login: '🔐',
    logout: '🚪',
  };
  return icons[type] ?? '📋';
}

interface Props {
  data: CourierDashboardData;
}

export default function CourierDashboardView({ data }: Props) {
  const { deliveries, performance, today_deliveries, upcoming, activities } = data;
  const inProgressCount = deliveries.in_progress;
  const hasNoToday = today_deliveries.length === 0 && deliveries.assigned_today === 0;

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Tableau de bord</h1>

      {hasNoToday && (
        <p className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
          Aucune livraison prévue aujourd&apos;hui
        </p>
      )}
      {inProgressCount > 0 && (
        <p className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-lg">
          {inProgressCount} livraison{inProgressCount > 1 ? 's' : ''} en cours
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attribuées aujourd'hui</p>
            <p className="text-2xl font-bold text-primary-red">{deliveries.assigned_today}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Acceptées</p>
            <p className="text-2xl font-bold text-blue-600">{deliveries.accepted}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En cours</p>
            <p className="text-2xl font-bold text-indigo-600">{deliveries.in_progress}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Livrées</p>
            <p className="text-2xl font-bold text-green-600">{deliveries.delivered}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retournées</p>
            <p className="text-2xl font-bold text-red-600">{deliveries.returned}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="Taux de livraison réussie">
          <p className="text-3xl font-bold text-green-600">{performance.success_rate} %</p>
          <p className="text-sm text-gray-500 mt-1">Sur {performance.total_deliveries} livraison(s) au total</p>
        </Card>
        <Card title="Livraisons à effectuer aujourd'hui">
          {today_deliveries.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Aucune livraison aujourd'hui</p>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {today_deliveries.length} livraison(s)
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Prochaines livraisons">
          {upcoming.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">Aucune livraison en attente</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((item) => (
                <li key={item.uuid} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Link to={`/orders/${item.order_uuid}`} className="font-medium text-primary-red hover:underline">
                      {item.order_number}
                    </Link>
                    <span className="text-xs font-semibold text-indigo-600">
                      {assignmentStatusLabels[item.status] ?? item.status}
                    </span>
                  </div>
                  {item.delivery_address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate" title={item.delivery_address}>
                      {item.delivery_address}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(item.assigned_at)}</p>
                  <Link to="/routes" className="mt-2 inline-block text-sm text-primary-red hover:underline">
                    Voir itinéraire
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/routes" className="mt-3 inline-block text-sm text-primary-red hover:underline">
            Itinéraires
          </Link>
        </Card>

        <Card title="Activités récentes">
          {activities.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
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
