import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/AssignmentService';
import { orderService } from '../../services/OrderService';
import { courierService, type Courier } from '../../services/CourierService';
import type { DeliveryAssignment } from '../../models/Assignment';
import type { Order } from '../../models/Order';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import Badge from '../../components/common/Badge';
import ReassignOrderModal from '../../components/orders/ReassignOrderModal';
import CouriersMap from '../../components/assignments/CouriersMap';
import Select from '../../components/common/Select';
import Pagination, { type PaginationMeta } from '../../components/common/Pagination';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useToastContext } from '../../contexts/ToastContext';


export default function AssignmentPanel() {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<DeliveryAssignment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pendingPagination, setPendingPagination] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 20,
    total: 0,
  });
  const [assignedPagination, setAssignedPagination] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 20,
    total: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState<Order | null>(null);
  const [showAllCouriers, setShowAllCouriers] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [assignmentToReassign, setAssignmentToReassign] = useState<DeliveryAssignment | null>(null);
  const [mapFilters, setMapFilters] = useState<{
    vehicleType: 'moto' | 'voiture' | 'velo' | '';
    availability: 'all' | 'available' | 'delivering' | 'offline';
  }>({
    vehicleType: '',
    availability: 'all',
  });
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    loadData();
  }, [pendingPagination.current_page, pendingPagination.per_page, assignedPagination.current_page, assignedPagination.per_page]);

  useEffect(() => {
    if (selectedOrder) {
      loadAvailableCouriers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder, showAllCouriers]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Charger les commandes en attente
      const ordersResult = await orderService.getAll({ 
        status: 'pending', 
        page: pendingPagination.current_page,
        per_page: pendingPagination.per_page 
      });
      if (ordersResult.data) {
        setPendingOrders(ordersResult.data);
        if (ordersResult.meta) {
          setPendingPagination((prev) => ({
            ...prev,
            ...ordersResult.meta,
          }));
        }
      }

      // Charger les commandes attribuées
      const assignedResult = await assignmentService.getAssignedOrders({ 
        page: assignedPagination.current_page,
        per_page: assignedPagination.per_page 
      });
      if (assignedResult.data) {
        setAssignedOrders(assignedResult.data);
        if (assignedResult.meta) {
          setAssignedPagination((prev) => ({
            ...prev,
            ...assignedResult.meta,
          }));
        }
      }

      // Charger les livreurs actifs
      const couriersResult = await courierService.getActiveCouriers();
      if (couriersResult.data) {
        setCouriers(couriersResult.data);
      }

      // Charger les compteurs d'attributions par livreur
      const countsResult = await assignmentService.getAssignmentCountsByCourier();
      if (countsResult.data) {
        setAssignmentCounts(countsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [pendingPagination.current_page, pendingPagination.per_page, assignedPagination.current_page, assignedPagination.per_page]);

  const loadAvailableCouriers = async () => {
    if (!selectedOrder) return;

    const order = pendingOrders.find(o => o.uuid === selectedOrder);
    if (!order) return;

    setSelectedOrderData(order);

    try {
      let result;
      
      // Si "Afficher tous les livreurs" est coché, utiliser getAvailableForZone sans filtre vehicle_type
      if (showAllCouriers) {
        result = await courierService.getAvailableForZone(
          order.zone_uuid || undefined,
          undefined // Pas de filtre par type de véhicule
        );
      } else {
        // Sinon, utiliser suggestCouriers qui filtre automatiquement par vehicle_type
        result = await assignmentService.suggestCouriers(order.uuid, 5.0);
      }
      
      if (result.data) {
        setAvailableCouriers(result.data);
      } else {
        // Fallback : tous les livreurs actifs si pas de zone
        setAvailableCouriers(couriers);
      }
    } catch (error) {
      console.error('Error loading available couriers:', error);
      // Fallback : tous les livreurs actifs
      setAvailableCouriers(couriers);
    }
  };

  const handleOrderSelect = (orderUuid: string) => {
    setSelectedOrder(orderUuid);
    setSelectedCourier(''); // Réinitialiser la sélection du livreur
    setShowAllCouriers(false); // Réinitialiser l'option "Afficher tous"
  };

  const handleAssign = async () => {
    if (!selectedOrder || !selectedCourier) {
      showError('Veuillez sélectionner une commande et un livreur');
      return;
    }

    setAssigning(true);
    try {
      const result = await assignmentService.assign({
        order_uuid: selectedOrder,
        courier_uuid: selectedCourier,
      });

      if (result.data) {
        success('Commande attribuée avec succès');
        setSelectedOrder('');
        setSelectedCourier('');
        setSelectedOrderData(null);
        setAvailableCouriers([]);
        loadData();
      }
    } catch {
      showError('Erreur lors de l\'attribution');
    } finally {
      setAssigning(false);
    }
  };


  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Attributions de livraisons</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Attribuer une commande">
          <div className="space-y-4">
            <SearchableSelect
              label="Commande en attente"
              value={selectedOrder}
              onChange={handleOrderSelect}
              options={[
                { value: '', label: 'Sélectionner une commande' },
                ...pendingOrders.map(order => ({
                  value: order.uuid,
                  label: `${order.order_number} - ${order.customer_name} (${order.delivery_address})`,
                  zone: order.zone_uuid,
                }))
              ]}
              placeholder="Rechercher une commande..."
              searchPlaceholder="Rechercher par numéro, client, adresse..."
            />

            {selectedOrderData && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm space-y-2">
                <p className="text-gray-900 dark:text-white">
                  <strong>Zone:</strong> {selectedOrderData.zone?.name || selectedOrderData.zone_uuid || 'Aucune zone'}
                </p>
                <p className="text-gray-900 dark:text-white">
                  <strong>Adresse:</strong> {selectedOrderData.delivery_address}
                </p>
                {selectedOrderData.pricing && (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Distance:</strong> {selectedOrderData.pricing.distance_km} km
                    </p>
                    <span className="text-gray-400">•</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Véhicule requis:</strong>
                    </p>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded capitalize font-semibold">
                      {selectedOrderData.pricing.vehicle_type}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* {selectedOrderData && selectedOrderData.pricing?.vehicle_type && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
                <input
                  type="checkbox"
                  id="showAllCouriers"
                  checked={showAllCouriers}
                  onChange={(e) => setShowAllCouriers(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="showAllCouriers" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Afficher tous les livreurs disponibles (ignorer le type de véhicule)
                </label>
              </div>
            )} */}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Livreur disponible
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(selectedOrder ? availableCouriers : couriers).map(courier => (
                  <div
                    key={courier.id}
                    onClick={() => setSelectedCourier(courier.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCourier === courier.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {courier.user?.name || 'N/A'}
                          </p>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                            {courier.vehicle_type}
                          </span>
                          {courier.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                              Actif
                            </span>
                          )}
                          {assignmentCounts[courier.id] !== undefined && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded font-semibold">
                              {assignmentCounts[courier.id]} commande{assignmentCounts[courier.id] > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {assignmentCounts[courier.id] !== undefined && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Commandes attribuées : {assignmentCounts[courier.id] || 0}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                          {courier.distance_km !== null && courier.distance_km !== undefined && (
                            <span>📍 {courier.distance_km} km</span>
                          )}
                          {courier.zones && courier.zones.length > 0 && (
                            <span>
                              🗺️ {courier.zones.map((z: { uuid: string; name: string; is_primary: boolean }) => z.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <input
                          type="radio"
                          checked={selectedCourier === courier.id}
                          onChange={() => {
                            console.log('courier', courier.id);
                            setSelectedCourier(courier.id);

                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder && availableCouriers.length === 0 && (
              <p className="text-sm text-yellow-600">
                Aucun livreur disponible pour cette zone. Tous les livreurs actifs seront affichés.
              </p>
            )}

            <Button
              onClick={handleAssign}
              loading={assigning}
              disabled={!selectedCourier}
              variant="primary"
              className="w-full"
            >
              Attribuer la commande
            </Button>
          </div>
        </Card>

        <Card title="Statistiques">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Commandes en attente</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Commandes attribuées</p>
              <p className="text-3xl font-bold text-blue-600">{assignedOrders.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Livreurs actifs</p>
              <p className="text-3xl font-bold text-green-600">{couriers.length}</p>
            </div>
            {selectedOrder && (
              <div>
                <p className="text-sm text-gray-600">Livreurs disponibles pour cette zone</p>
                <p className="text-3xl font-bold text-blue-600">{availableCouriers.length}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="📦 Commandes en attente d'attribution">
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : pendingOrders.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Aucune commande en attente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                  <th className={tailwindClasses.tableHeaderCell}>Client</th>
                  <th className={tailwindClasses.tableHeaderCell}>Adresse</th>
                  <th className={tailwindClasses.tableHeaderCell}>Zone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Montant</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {pendingOrders.map((order) => (
                  <tr key={order.uuid}>
                    <td className={tailwindClasses.tableCell}>{order.order_number}</td>
                    <td className={tailwindClasses.tableCell}>{order.customer_name}</td>
                    <td className={tailwindClasses.tableCell}>{order.delivery_address}</td>
                    <td className={tailwindClasses.tableCell}>
                      {order.zone?.name || (order.zone_uuid ? `Zone ${order.zone_uuid.substring(0, 8)}...` : '-')}
                    </td>
                    <td className={tailwindClasses.tableCell}>{order.total_amount} XOF</td>
                    <td className={tailwindClasses.tableCell}>
                      <Badge status="pending">En attente</Badge>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/orders/${order.uuid}`)}
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && pendingOrders.length > 0 && (
              <Pagination
                meta={pendingPagination}
                onPageChange={(page) => {
                  setPendingPagination((prev) => ({ ...prev, current_page: page }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPerPageChange={(perPage) => {
                  setPendingPagination((prev) => ({ ...prev, per_page: perPage, current_page: 1 }));
                }}
                perPageOptions={[10, 20, 50, 100]}
              />
            )}
          </div>
        )}
      </Card>

      <Card title="📦 Commandes attribuées" className="mt-6">
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : assignedOrders.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Aucune commande attribuée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                  <th className={tailwindClasses.tableHeaderCell}>Zone de livraison</th>
                  <th className={tailwindClasses.tableHeaderCell}>Livreur</th>
                  <th className={tailwindClasses.tableHeaderCell}>Téléphone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Date d'attribution</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {assignedOrders.map((assignment) => (
                  <tr key={assignment.uuid}>
                    <td className={tailwindClasses.tableCell}>
                      {assignment.order?.order_number || assignment.order_uuid}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {assignment.order?.zone?.name || (assignment.order?.zone_uuid ? `Zone ${assignment.order.zone_uuid.substring(0, 8)}...` : '-')}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {assignment.courier?.user?.name || 'N/A'}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {assignment.courier?.user?.phone || '-'}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <Badge status={assignment.assignment_status === 'assigned' ? 'assigned' : assignment.assignment_status}>
                        {assignment.assignment_status === 'assigned' ? 'Attribuée' : assignment.assignment_status}
                      </Badge>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {assignment.assigned_at ? formatDateTime(assignment.assigned_at) : '-'}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/orders/${assignment.order_uuid}`)}
                        >
                          Voir
                        </Button>
                        {(assignment.assignment_status === 'assigned' || assignment.assignment_status === 'accepted') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAssignmentToReassign(assignment);
                              setShowReassignModal(true);
                            }}
                          >
                            Réassigner
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && assignedOrders.length > 0 && (
              <Pagination
                meta={assignedPagination}
                onPageChange={(page) => {
                  setAssignedPagination((prev) => ({ ...prev, current_page: page }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPerPageChange={(perPage) => {
                  setAssignedPagination((prev) => ({ ...prev, per_page: perPage, current_page: 1 }));
                }}
                perPageOptions={[10, 20, 50, 100]}
              />
            )}
          </div>
        )}
      </Card>

      {/* Carte GPS des livreurs */}
      <Card title="📍 Position GPS des livreurs en temps réel" className="mb-6 mt-6">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Type de véhicule"
            value={mapFilters.vehicleType}
            onChange={(e) =>
              setMapFilters({ ...mapFilters, vehicleType: e.target.value as any })
            }
            options={[
              { value: '', label: 'Tous les véhicules' },
              { value: 'moto', label: 'Moto' },
              { value: 'voiture', label: 'Voiture' },
              { value: 'velo', label: 'Vélo' },
            ]}
          />
          <Select
            label="Disponibilité"
            value={mapFilters.availability}
            onChange={(e) =>
              setMapFilters({ ...mapFilters, availability: e.target.value as any })
            }
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'available', label: 'Disponibles' },
              { value: 'delivering', label: 'En livraison' },
              { value: 'offline', label: 'Hors ligne' },
            ]}
          />
        </div>
        <CouriersMap
          couriers={couriers}
          assignmentCounts={assignmentCounts}
          selectedCourierId={selectedCourier}
          filters={mapFilters}
          onCourierClick={(courier) => {
            setSelectedCourier(courier.id);
          }}
          autoRefresh={true}
          refreshInterval={10000}
          onCouriersUpdate={(updatedCouriers) => {
            setCouriers(updatedCouriers);
          }}
        />
      </Card>

      {/* Modal de réassignation */}
      {assignmentToReassign && (
        <ReassignOrderModal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setAssignmentToReassign(null);
          }}
          assignment={assignmentToReassign}
          onReassignSuccess={() => {
            loadData();
            setShowReassignModal(false);
            setAssignmentToReassign(null);
          }}
        />
      )}
    </div>
  );
}
