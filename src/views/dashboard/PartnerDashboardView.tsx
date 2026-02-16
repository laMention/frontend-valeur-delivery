import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import type { PartnerDashboardData } from '../../services/DashboardService';

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  assigned: 'Assignée',
  picked: 'Collectée',
  delivering: 'En livraison',
  delivered: 'Livrée',
  returned: 'Retournée',
  stocked: 'En stock',
};

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-amber-600',
    assigned: 'text-blue-600',
    picked: 'text-purple-600',
    delivering: 'text-indigo-600',
    delivered: 'text-green-600',
    returned: 'text-red-600',
    stocked: 'text-gray-600',
  };
  return colors[status] ?? 'text-gray-600';
}

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
  data: PartnerDashboardData;
}

export default function PartnerDashboardView({ data }: Props) {
  const { orders, financial, recent_orders, activities } = data;

  const deliveringCount = orders.delivering;
  const hasNoOrders = orders.total === 0;

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Tableau de bord</h1>

      {hasNoOrders && (
        <p className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
          Aucune commande pour le moment
        </p>
      )}
      {!hasNoOrders && deliveringCount > 0 && (
        <p className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-lg">
          {deliveringCount} livraison{deliveringCount > 1 ? 's' : ''} en cours
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total commandes</p>
            <p className="text-2xl font-bold text-primary-red">{orders.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{orders.pending}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assignées</p>
            <p className="text-2xl font-bold text-blue-600">{orders.assigned}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En livraison</p>
            <p className="text-2xl font-bold text-indigo-600">{orders.delivering}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Livrées</p>
            <p className="text-2xl font-bold text-green-600">{orders.delivered}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retournées</p>
            <p className="text-2xl font-bold text-red-600">{orders.returned}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Montant total des livraisons">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(financial.total_amount)}
          </p>
        </Card>
        <Card title="Frais de livraison cumulés">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(financial.delivery_fees)}
          </p>
        </Card>
        <Card title="Facturables / Non facturables">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-green-600">{financial.billable_count}</span> facturables
            {' '}
            <span className="font-semibold text-gray-500">{financial.non_billable_count}</span> non facturables
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Dernières commandes">
          {recent_orders.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-500">Aucune commande pour le moment</p>
          ) : (
            <ul className="space-y-3">
              {recent_orders.map((order) => (
                <li key={order.uuid} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-200 rounded-lg">
                  <div>
                    <Link to={`/orders/${order.uuid}`} className="font-medium text-primary-red hover:underline">
                      {order.order_number}
                    </Link>
                    <p className={`text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {statusLabels[order.status] ?? order.status}
                    </p>
                    {order.courier_name && (
                      <p className="text-xs text-gray-500">Livreur : {order.courier_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {recent_orders.length > 0 && (
            <Link to="/orders" className="mt-3 inline-block text-sm text-primary-red hover:underline">
              Voir toutes les commandes
            </Link>
          )}
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
