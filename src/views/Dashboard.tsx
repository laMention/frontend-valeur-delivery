import { useEffect, useState } from 'react';
import { reportingService } from '../services/ReportingService';
import Card from '../components/common/Card';
import { tailwindClasses } from '../utils/tailwindClasses';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await reportingService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Commandes</p>
            <p className="text-3xl font-bold text-primary-red">{stats?.total_orders || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Livrées</p>
            <p className="text-3xl font-bold text-green-600">{stats?.delivered_orders || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">En attente</p>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pending_orders || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Retournées</p>
            <p className="text-3xl font-bold text-red-600">{stats?.returned_orders || 0}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Performance">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Temps moyen de livraison</p>
              <p className="text-2xl font-bold">{stats?.average_delivery_time || 0} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenus totaux</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
            </div>
          </div>
        </Card>

        <Card title="Activité récente">
          <p className="text-gray-600">Les activités récentes seront affichées ici</p>
        </Card>
      </div>
    </div>
  );
}

