import { useState, useEffect } from 'react';
import { routeService } from '../../services/RouteService';
import { courierService } from '../../services/CourierService';
import { assignmentService } from '../../services/AssignmentService';
import { orderService } from '../../services/OrderService';
import type { Courier } from '../../models/Courier';
import type { DeliveryAssignment } from '../../models/Assignment';
import type { OptimizedRoute } from '../../models/Route';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import Badge from '../../components/common/Badge';
import RouteMap from '../../components/orders/RouteMap';
import ReassignOrderModal from '../../components/orders/ReassignOrderModal';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useToastContext } from '../../contexts/ToastContext';

export default function OptimizedRoute() {
  const { success, error: showError } = useToastContext();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [acceptedAssignments, setAcceptedAssignments] = useState<DeliveryAssignment[]>([]);
  const [nonAcceptedAssignments, setNonAcceptedAssignments] = useState<DeliveryAssignment[]>([]);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [selectedOrderForRoute, setSelectedOrderForRoute] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAssignmentForReassign, setSelectedAssignmentForReassign] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCouriers();
  }, []);

  useEffect(() => {
    if (selectedCourier) {
      loadAssignments();
      loadRoute();
    } else {
      setAcceptedAssignments([]);
      setNonAcceptedAssignments([]);
      setRoute(null);
      setRouteData(null);
      setSelectedOrderForRoute(null);
    }
  }, [selectedCourier]);

  const loadCouriers = async () => {
    setLoading(true);
    try {
      const result = await courierService.getWithAcceptedOrders();
      if (result.data) {
        setCouriers(result.data);
      }
    } catch (error: any) {
      console.error('Error loading couriers:', error);
      showError('Erreur lors du chargement des livreurs');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!selectedCourier) return;
    
    setLoading(true);
    try {
      // Charger les commandes acceptées
      const acceptedResult = await assignmentService.getByCourier(selectedCourier, 'accepted');
      if (acceptedResult.data) {
        setAcceptedAssignments(acceptedResult.data);
      }

      // Charger les commandes assignées mais non acceptées
      const assignedResult = await assignmentService.getByCourier(selectedCourier, 'assigned');
      if (assignedResult.data) {
        setNonAcceptedAssignments(assignedResult.data);
      }
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      showError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadRoute = async () => {
    if (!selectedCourier) return;
    
    try {
      const result = await routeService.getByCourier(selectedCourier);
      if (result.data) {
        setRoute(result.data);
      }
    } catch (error) {
      // Pas d'erreur si aucune route n'existe
      setRoute(null);
    }
  };

  const handleShowRoute = async (orderUuid: string) => {
    if (selectedOrderForRoute === orderUuid && routeData) {
      setSelectedOrderForRoute(null);
      setRouteData(null);
      return;
    }

    setLoadingRoute(true);
    setSelectedOrderForRoute(orderUuid);
    try {
      const response = await orderService.getRoute(orderUuid);
      setRouteData(response.data);
    } catch (error: any) {
      console.error('Error loading route:', error);
      showError(error?.response?.data?.message || 'Erreur lors de la récupération de l\'itinéraire');
      setSelectedOrderForRoute(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleReassign = (assignment: DeliveryAssignment) => {
    setSelectedAssignmentForReassign(assignment);
    setReassignModalOpen(true);
  };

  const handleReassignSuccess = () => {
    loadAssignments();
    loadCouriers(); // Recharger pour mettre à jour la liste
  };

  const courierOptions = couriers.map(courier => ({
    value: courier.uuid,
    label: `${courier.user?.name || 'N/A'} - ${courier.vehicle_type}`,
  }));

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Itinéraires & Gestion des Livraisons</h1>

      <Card title="Sélectionner un livreur" className="mb-6">
        <div className="space-y-4">
          <SearchableSelect
            label="Livreur"
            value={selectedCourier}
            onChange={setSelectedCourier}
            options={[
              { value: '', label: 'Sélectionner un livreur' },
              ...courierOptions,
            ]}
            placeholder="Sélectionner un livreur"
            searchPlaceholder="Rechercher un livreur..."
          />

          {!selectedCourier && couriers.length === 0 && !loading && (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucun livreur avec des commandes acceptées.
            </p>
          )}

          {selectedCourier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commandes acceptées</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{acceptedAssignments.length}</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commandes non acceptées</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{nonAcceptedAssignments.length}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedCourier && (
        <>
          {/* Commandes acceptées */}
          {acceptedAssignments.length > 0 && (
            <Card title="Commandes acceptées" className="mb-6">
              {loading ? (
                <div className="text-center py-12">Chargement...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={tailwindClasses.table}>
                    <thead className={tailwindClasses.tableHeader}>
                      <tr>
                        <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                        <th className={tailwindClasses.tableHeaderCell}>Client</th>
                        <th className={tailwindClasses.tableHeaderCell}>Adresse de livraison</th>
                        <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                        <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={tailwindClasses.tableBody}>
                      {acceptedAssignments.map((assignment) => (
                        <tr key={assignment.uuid}>
                          <td className={tailwindClasses.tableCell}>
                            {assignment.order?.order_number || '-'}
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            {assignment.order?.customer_name || '-'}
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            {assignment.order?.delivery_address || '-'}
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            <Badge status={assignment.assignment_status}>
                              {assignment.assignment_status === 'accepted' ? 'Acceptée' : assignment.assignment_status}
                            </Badge>
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            <Button
                              variant="outline"
                              onClick={() => handleShowRoute(assignment.order_uuid)}
                              disabled={loadingRoute && selectedOrderForRoute === assignment.order_uuid}
                            >
                              {loadingRoute && selectedOrderForRoute === assignment.order_uuid
                                ? 'Chargement...'
                                : selectedOrderForRoute === assignment.order_uuid
                                ? 'Masquer l\'itinéraire'
                                : 'Voir l\'itinéraire'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Carte Google Maps pour la commande sélectionnée */}
              {selectedOrderForRoute && routeData && (
                <div className="mt-6">
                  <RouteMap
                    origin={{
                      lat: routeData.route.start_location.lat,
                      lng: routeData.route.start_location.lng,
                      address: routeData.route.start_address,
                    }}
                    destination={{
                      lat: routeData.route.end_location.lat,
                      lng: routeData.route.end_location.lng,
                      address: routeData.route.end_address,
                    }}
                    polyline={routeData.polyline}
                    distanceKm={routeData.distance_km}
                    durationMinutes={routeData.duration_minutes}
                    steps={routeData.route.steps}
                  />
                </div>
              )}
            </Card>
          )}

          {/* Commandes non acceptées */}
          {nonAcceptedAssignments.length > 0 && (
            <Card title="Commandes assignées (non acceptées)" className="mb-6">
              {loading ? (
                <div className="text-center py-12">Chargement...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={tailwindClasses.table}>
                    <thead className={tailwindClasses.tableHeader}>
                      <tr>
                        <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                        <th className={tailwindClasses.tableHeaderCell}>Client</th>
                        <th className={tailwindClasses.tableHeaderCell}>Adresse de livraison</th>
                        <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                        <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={tailwindClasses.tableBody}>
                      {nonAcceptedAssignments.map((assignment) => (
                        <tr key={assignment.uuid}>
                          <td className={tailwindClasses.tableCell}>
                            {assignment.order?.order_number || '-'}
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            {assignment.order?.customer_name || '-'}
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            {assignment.order?.delivery_address || '-'}
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            <Badge status={assignment.assignment_status}>
                              {assignment.assignment_status === 'assigned' ? 'Assignée' : assignment.assignment_status}
                            </Badge>
                          </td>
                          <td className={tailwindClasses.tableCell}>
                            <Button
                              variant="outline"
                              onClick={() => handleReassign(assignment)}
                            >
                              Réassigner
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Message si aucune commande */}
          {acceptedAssignments.length === 0 && nonAcceptedAssignments.length === 0 && !loading && (
            <Card title="Aucune commande">
              <p className="text-center text-gray-500 py-8">
                Ce livreur n'a aucune commande assignée ou acceptée.
              </p>
            </Card>
          )}
        </>
      )}

      {/* Modal de réassignation */}
      {reassignModalOpen && selectedAssignmentForReassign && (
        <ReassignOrderModal
          isOpen={reassignModalOpen}
          onClose={() => {
            setReassignModalOpen(false);
            setSelectedAssignmentForReassign(null);
          }}
          assignment={selectedAssignmentForReassign}
          onReassignSuccess={handleReassignSuccess}
        />
      )}
    </div>
  );
}
