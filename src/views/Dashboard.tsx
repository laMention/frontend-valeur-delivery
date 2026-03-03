import { useEffect, useState } from 'react';
import {
  dashboardService,
  type DashboardResponse,
  type PartnerDashboardData,
  type CourierDashboardData,
  type AdminDashboardData,
} from '../services/DashboardService';
import PartnerDashboardView from './dashboard/PartnerDashboardView';
import CourierDashboardView from './dashboard/CourierDashboardView';
import AdminDashboardView from './dashboard/AdminDashboardView';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getDashboard();
      setDashboard(response);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err?.response?.data?.message ?? 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 dark:text-gray-400">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="px-4 py-2 bg-primary-red text-white rounded-md hover:bg-red-800"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { role, data } = dashboard;

  if (role === 'partner') {
    return <PartnerDashboardView data={data as PartnerDashboardData} />;
  }
  if (role === 'courier') {
    return <CourierDashboardView data={data as CourierDashboardData} />;
  }
  return <AdminDashboardView data={data as AdminDashboardData} />;
}
