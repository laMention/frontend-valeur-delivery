import { useState, useEffect } from 'react';
import { reportingService } from '../../services/ReportingService';
import type { ReportStats, PartnerPerformance, CourierPerformance } from '../../models/Report';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatCurrency } from '../../utils/formatters';

export default function ReportingDashboard() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [partnerPerformance, setPartnerPerformance] = useState<PartnerPerformance[]>([]);
  const [courierPerformance, setCourierPerformance] = useState<CourierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResult, partnersResult, couriersResult] = await Promise.all([
        reportingService.getStats(filters),
        reportingService.getPartnerPerformance(filters),
        reportingService.getCourierPerformance(filters),
      ]);

      if (statsResult.data) {
        setStats(statsResult.data);
      }
      if (partnersResult.data) {
        setPartnerPerformance(partnersResult.data);
      }
      if (couriersResult.data) {
        setCourierPerformance(couriersResult.data);
      }
    } catch (error) {
      console.error('Error loading reporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const blob = await reportingService.exportReport(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Reporting</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Exporter CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            Exporter PDF
          </Button>
        </div>
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de début"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
          <Input
            label="Date de fin"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Commandes</p>
                  <p className="text-3xl font-bold text-primary-red">{stats.total_orders}</p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Livrées</p>
                  <p className="text-3xl font-bold text-green-600">{stats.delivered_orders}</p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">En attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending_orders}</p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Retournées</p>
                  <p className="text-3xl font-bold text-red-600">{stats.returned_orders}</p>
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card title="Performance">
              <div className="space-y-4">
                {stats && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Temps moyen de livraison</p>
                      <p className="text-2xl font-bold">{stats.average_delivery_time} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenus totaux</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card title="Taux de réussite">
              {stats && stats.total_orders > 0 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Taux de livraison</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{
                          width: `${(stats.delivered_orders / stats.total_orders) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {((stats.delivered_orders / stats.total_orders) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {partnerPerformance.length > 0 && (
            <Card title="Performance par partenaire" className="mb-6">
              <div className="overflow-x-auto">
                <table className={tailwindClasses.table}>
                  <thead className={tailwindClasses.tableHeader}>
                    <tr>
                      <th className={tailwindClasses.tableHeaderCell}>Partenaire</th>
                      <th className={tailwindClasses.tableHeaderCell}>Total</th>
                      <th className={tailwindClasses.tableHeaderCell}>Livrées</th>
                      <th className={tailwindClasses.tableHeaderCell}>Retournées</th>
                      <th className={tailwindClasses.tableHeaderCell}>Taux de réussite</th>
                    </tr>
                  </thead>
                  <tbody className={tailwindClasses.tableBody}>
                    {partnerPerformance.map((partner) => (
                      <tr key={partner.partner_uuid}>
                        <td className={tailwindClasses.tableCell}>{partner.partner_name}</td>
                        <td className={tailwindClasses.tableCell}>{partner.total_orders}</td>
                        <td className={tailwindClasses.tableCell}>{partner.delivered_orders}</td>
                        <td className={tailwindClasses.tableCell}>{partner.returned_orders}</td>
                        <td className={tailwindClasses.tableCell}>
                          <span className={partner.success_rate >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                            {partner.success_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {courierPerformance.length > 0 && (
            <Card title="Performance par livreur">
              <div className="overflow-x-auto">
                <table className={tailwindClasses.table}>
                  <thead className={tailwindClasses.tableHeader}>
                    <tr>
                      <th className={tailwindClasses.tableHeaderCell}>Livreur</th>
                      <th className={tailwindClasses.tableHeaderCell}>Total</th>
                      <th className={tailwindClasses.tableHeaderCell}>Complétées</th>
                      <th className={tailwindClasses.tableHeaderCell}>Temps moyen</th>
                    </tr>
                  </thead>
                  <tbody className={tailwindClasses.tableBody}>
                    {courierPerformance.map((courier) => (
                      <tr key={courier.courier_uuid}>
                        <td className={tailwindClasses.tableCell}>{courier.courier_name}</td>
                        <td className={tailwindClasses.tableCell}>{courier.total_deliveries}</td>
                        <td className={tailwindClasses.tableCell}>{courier.completed_deliveries}</td>
                        <td className={tailwindClasses.tableCell}>
                          {courier.average_delivery_time} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

