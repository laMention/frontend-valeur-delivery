import { useState, useEffect, useMemo } from 'react';
import { reconciliationService } from '../../services/ReconciliationService';
import { courierService } from '../../services/CourierService';
import { assignmentService } from '../../services/AssignmentService';
import type { ReconciliationStats } from '../../models/Reconciliation';
import type { Courier } from '../../services/CourierService';
import type { DeliveryAssignment } from '../../services/AssignmentService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchableSelect from '../../components/common/SearchableSelect';
import Pagination, { type PaginationMeta } from '../../components/common/Pagination';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { useToastContext } from '../../contexts/ToastContext';


interface CourierOrder {
  assignment: DeliveryAssignment;
  order: any;
  isLate: boolean;
  hasDiscrepancy: boolean;
}

export default function ReconciliationView() {
  const [barcode, setBarcode] = useState('');
  const [scanType, setScanType] = useState<'delivery' | 'return' | 'stocked' | 'not_found'>('delivery');
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { success, error: showError } = useToastContext();

  // Nouveaux états pour la réconciliation par livreur
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourierUuid, setSelectedCourierUuid] = useState<string>('');
  const [courierOrders, setCourierOrders] = useState<CourierOrder[]>([]);
  const [allCourierOrders, setAllCourierOrders] = useState<CourierOrder[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [courierPagination, setCourierPagination] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 20,
    total: 0,
  });
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lateFilter, setLateFilter] = useState<string>('all');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>('all');

  useEffect(() => {
    loadStats();
    loadDiscrepancies();
    loadCouriers();
  }, [date]);

  useEffect(() => {
    if (selectedCourierUuid) {
      loadCourierOrders(selectedCourierUuid);
    } else {
      setCourierOrders([]);
    }
  }, [selectedCourierUuid]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await reconciliationService.getStats(date);
      if (result.data) {
        setStats(result.data);
      }

      console.log(result.data);
      console.log(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscrepancies = async () => {
    try {
      const result = await reconciliationService.getDiscrepancies(date);
      if (result.data) {
        setDiscrepancies(result.data);
      }
    } catch (error) {
      console.error('Error loading discrepancies:', error);
    }
  };

  const loadCouriers = async () => {
    setLoadingCouriers(true);
    try {
      const result = await courierService.getAll({ is_active: true, per_page: 1000 });
      if (result.data) {
        setCouriers(result.data);
      }
    } catch (error) {
      console.error('Error loading couriers:', error);
      showError('Erreur lors du chargement des livreurs');
    } finally {
      setLoadingCouriers(false);
    }
  };

  const loadCourierOrders = async (courierUuid: string) => {
    setLoadingOrders(true);
    try {
      const result = await assignmentService.getByCourier(courierUuid);
      if (result.data) {
        const ordersWithMetadata = result.data.map((assignment) => {
          const order = assignment.order;
          if (!order) return null;

          // Calculer le retard
          const isLate = calculateIsLate(order);
          
          // Calculer l'écart (commande assignée/accepted/picked/delivering mais non livrée après un certain temps)
          // Un écart existe si la commande est assignée mais pas livrée et qu'il y a un délai significatif
          const hasDiscrepancy = (order.status === 'assigned' || order.status === 'accepted' || order.status === 'picked' || order.status === 'delivering') 
            && !hasDeliveryScan(order) 
            && order.reserved_at 
            && (new Date().getTime() - new Date(order.reserved_at).getTime()) > (2 * 60 * 60 * 1000); // Plus de 2 heures

          return {
            assignment,
            order,
            isLate,
            hasDiscrepancy,
          };
        }).filter((item): item is CourierOrder => item !== null);

        setAllCourierOrders(ordersWithMetadata);
        // Mettre à jour la pagination
        setCourierPagination((prev) => ({
          ...prev,
          total: ordersWithMetadata.length,
        }));
      }
    } catch (error) {
      console.error('Error loading courier orders:', error);
      showError('Erreur lors du chargement des commandes du livreur');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Calculer si une commande est en retard
  const calculateIsLate = (order: any): boolean => {
    if (order.status === 'delivered') {
      return false;
    }

    if (!order.reserved_at) {
      return false;
    }

    // Temps de livraison estimé par défaut : 2 heures (120 minutes)
    // Peut être ajusté selon la zone ou d'autres critères
    const estimatedDeliveryTimeMinutes = 120;
    const reservedAt = new Date(order.reserved_at);
    const estimatedDeliveryTime = new Date(reservedAt.getTime() + estimatedDeliveryTimeMinutes * 60 * 1000);
    const now = new Date();

    return now > estimatedDeliveryTime;
  };

  // Vérifier si une commande a un scan (livraison, retour, stockage)
  const hasDeliveryScan = (order: any): boolean => {
    // Cette logique peut être améliorée en vérifiant les scans réels
    // Pour l'instant, on considère qu'une commande avec un scan a un statut final
    return order.status === 'delivered' || order.status === 'returned' || order.status === 'stocked';
  };

  const handleScan = async () => {
    if (!barcode) {
      showError('Veuillez entrer un code-barres');
      return;
    }

    setScanning(true);
    try {
      const result = await reconciliationService.scan({
        barcode_value: barcode,
        scan_type: scanType,
      });
      success('Scan enregistré avec succès');
      setBarcode('');
      loadStats();
      loadDiscrepancies();
      // Recharger les commandes du livreur si un livreur est sélectionné
      if (selectedCourierUuid) {
        loadCourierOrders(selectedCourierUuid);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors du scan';
      showError(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const handleReconcile = async (order: any) => {
    try {
      // Utiliser le service de réconciliation existant pour marquer comme réconcilié
      await reconciliationService.scan({
        barcode_value: order.barcode_value || order.order_number,
        scan_type: 'delivery',
      });
      success(`Commande ${order.order_number} réconciliée avec succès`);
      // Recharger les données
      loadStats();
      loadDiscrepancies();
      if (selectedCourierUuid) {
        loadCourierOrders(selectedCourierUuid);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la réconciliation';
      showError(errorMessage);
    }
  };

  // Filtrer les commandes selon les filtres sélectionnés
  const filteredCourierOrders = useMemo(() => {
    return allCourierOrders.filter((item) => {
      // Filtre par statut
      if (statusFilter !== 'all') {
        const statusMap: Record<string, string[]> = {
          'assigned': ['assigned'],
          'in_progress': ['accepted', 'picked', 'delivering'],
          'delivered': ['delivered'],
          'returned': ['returned'],
        };
        if (statusFilter in statusMap && !statusMap[statusFilter].includes(item.order.status)) {
          return false;
        }
      }

      // Filtre par retard
      if (lateFilter !== 'all') {
        if (lateFilter === 'late' && !item.isLate) {
          return false;
        }
        if (lateFilter === 'on_time' && item.isLate) {
          return false;
        }
      }

      // Filtre par écart
      if (discrepancyFilter !== 'all') {
        if (discrepancyFilter === 'with_discrepancy' && !item.hasDiscrepancy) {
          return false;
        }
        if (discrepancyFilter === 'without_discrepancy' && item.hasDiscrepancy) {
          return false;
        }
      }

      return true;
    });
  }, [allCourierOrders, statusFilter, lateFilter, discrepancyFilter]);

  // Paginer les résultats filtrés
  const paginatedCourierOrders = useMemo(() => {
    const start = (courierPagination.current_page - 1) * courierPagination.per_page;
    const end = start + courierPagination.per_page;
    return filteredCourierOrders.slice(start, end);
  }, [filteredCourierOrders, courierPagination.current_page, courierPagination.per_page]);

  // Mettre à jour la pagination totale basée sur les résultats filtrés
  useEffect(() => {
    setCourierPagination((prev) => ({
      ...prev,
      total: filteredCourierOrders.length,
    }));
  }, [filteredCourierOrders.length]);

  const handleCourierPageChange = (page: number) => {
    setCourierPagination((prev) => ({ ...prev, current_page: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCourierPerPageChange = (perPage: number) => {
    setCourierPagination((prev) => ({ ...prev, per_page: perPage, current_page: 1 }));
  };

  const courierOptions = useMemo(() => {
    return couriers.map((courier) => ({
      value: courier.uuid,
      label: `${courier.user?.name || 'Livreur'} - ${courier.user?.phone || ''}`,
    }));
  }, [couriers]);

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Réconciliation</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Scanner un colis">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code-barres
              </label>
              <input
                type="text"
                className={tailwindClasses.input}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') {
                    handleScan();
                  }
                }}
                placeholder="Scanner ou saisir le code-barres"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de scan
              </label>
              <select
                className={tailwindClasses.select}
                value={scanType}
                onChange={(e) => setScanType(e.target.value as any)}
              >
                <option value="delivery">Livré</option>
                <option value="return">Retourné</option>
                <option value="stocked">En stock</option>
                <option value="not_found">Non trouvé</option>
              </select>
            </div>

            <Button onClick={handleScan} loading={scanning} variant="primary" className="w-full">
              Enregistrer le scan
            </Button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <SearchableSelect
                label="Sélectionner un livreur"
                value={selectedCourierUuid}
                onChange={setSelectedCourierUuid}
                options={courierOptions}
                placeholder="Rechercher un livreur..."
                searchPlaceholder="Rechercher par nom ou téléphone..."
                disabled={loadingCouriers}
              />
            </div>
          </div>
        </Card>

        <Card title="Statistiques de réconciliation">
          <div className="mb-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Assignées</p>
                <p className="text-2xl font-bold">{stats.assigned}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Livrées</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-gray-600">Retournées</p>
                <p className="text-2xl font-bold">{stats.returned}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">En stock</p>
                <p className="text-2xl font-bold">{stats.stocked}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-xs text-gray-600">Non trouvées</p>
                <p className="text-2xl font-bold">{stats.not_found}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <p className="text-xs text-gray-600">Écarts</p>
                <p className="text-2xl font-bold">{stats.discrepancies}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Aucune statistique disponible</p>
          )}
        </Card>
      </div>

      {discrepancies.length > 0 && (
        <Card title="Écarts détectés">
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut attendu</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut réel</th>
                  <th className={tailwindClasses.tableHeaderCell}>Type d'écart</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {discrepancies.map((discrepancy, index) => (
                  <tr key={index}>
                    <td className={tailwindClasses.tableCell}>{discrepancy.order_number || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{discrepancy.expected_status || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{discrepancy.actual_status || '-'}</td>
                    <td className={tailwindClasses.tableCell}>
                      <span className="text-red-600 font-semibold">Écart détecté</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedCourierUuid && (
        <Card title={`Commandes du livreur - ${couriers.find(c => c.uuid === selectedCourierUuid)?.user?.name || 'Livreur sélectionné'}`}>
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                className={tailwindClasses.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="assigned">Assignée</option>
                <option value="in_progress">En cours</option>
                <option value="delivered">Livrée</option>
                <option value="returned">Retournée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retard
              </label>
              <select
                className={tailwindClasses.select}
                value={lateFilter}
                onChange={(e) => setLateFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="late">En retard</option>
                <option value="on_time">À temps</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Écart
              </label>
              <select
                className={tailwindClasses.select}
                value={discrepancyFilter}
                onChange={(e) => setDiscrepancyFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="with_discrepancy">Avec écart</option>
                <option value="without_discrepancy">Sans écart</option>
              </select>
            </div>
          </div>

          {/* Tableau des commandes */}
          {loadingOrders ? (
            <div className="text-center py-8">Chargement des commandes...</div>
          ) : paginatedCourierOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={tailwindClasses.table}>
                <thead className={tailwindClasses.tableHeader}>
                  <tr>
                    <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                    <th className={tailwindClasses.tableHeaderCell}>Client</th>
                    <th className={tailwindClasses.tableHeaderCell}>Zone</th>
                    <th className={tailwindClasses.tableHeaderCell}>Date réservation</th>
                    <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                    <th className={tailwindClasses.tableHeaderCell}>Date attribution</th>
                    <th className={tailwindClasses.tableHeaderCell}>Date livraison</th>
                    <th className={tailwindClasses.tableHeaderCell}>Écart</th>
                    <th className={tailwindClasses.tableHeaderCell}>Retard</th>
                    <th className={tailwindClasses.tableHeaderCell}>Action</th>
                  </tr>
                </thead>
                <tbody className={tailwindClasses.tableBody}>
                  {paginatedCourierOrders.map((item) => {
                    const order = item.order;
                    const assignment = item.assignment;
                    return (
                      <tr key={assignment.uuid}>
                        <td className={tailwindClasses.tableCell}>{order.order_number || '-'}</td>
                        <td className={tailwindClasses.tableCell}>{order.customer_name || '-'}</td>
                        <td className={tailwindClasses.tableCell}>{order.zone?.name || '-'}</td>
                        <td className={tailwindClasses.tableCell}>
                          {order.reserved_at ? new Date(order.reserved_at).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'returned' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || '-'}
                          </span>
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          {assignment.completed_at ? new Date(assignment.completed_at).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          {item.hasDiscrepancy ? (
                            <span className="text-red-600 font-semibold">Oui</span>
                          ) : (
                            <span className="text-green-600">Non</span>
                          )}
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          {item.isLate ? (
                            <span className="text-red-600 font-semibold">Oui</span>
                          ) : (
                            <span className="text-green-600">Non</span>
                          )}
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          {order.status !== 'delivered' && order.status !== 'returned' && (
                            <Button
                              onClick={() => handleReconcile(order)}
                              variant="primary"
                              className="text-sm px-3 py-1"
                            >
                              Réconcilier
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loadingOrders && filteredCourierOrders.length > 0 && (
                <Pagination
                  meta={{
                    ...courierPagination,
                    last_page: Math.ceil(filteredCourierOrders.length / courierPagination.per_page),
                    from: filteredCourierOrders.length > 0 ? (courierPagination.current_page - 1) * courierPagination.per_page + 1 : 0,
                    to: Math.min(courierPagination.current_page * courierPagination.per_page, filteredCourierOrders.length),
                  }}
                  onPageChange={handleCourierPageChange}
                  onPerPageChange={handleCourierPerPageChange}
                  perPageOptions={[10, 20, 50, 100]}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              {selectedCourierUuid ? 'Aucune commande trouvée pour ce livreur' : 'Sélectionnez un livreur pour voir ses commandes'}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

