import { useState, useEffect } from 'react';
import { routeService } from '../../services/RouteService';
import { courierService } from '../../services/CourierService';
import { assignmentService } from '../../services/AssignmentService';
import type { Courier } from '../../models/Courier';
import type { DeliveryAssignment } from '../../models/Assignment';
import type { OptimizedRoute } from '../../models/Route';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';

export default function OptimizedRoute() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCouriers();
  }, []);

  useEffect(() => {
    if (selectedCourier) {
      loadAssignments();
      loadRoute();
    }
  }, [selectedCourier]);

  const loadCouriers = async () => {
    try {
      const result = await courierService.getActiveCouriers();
      if (result.data) {
        setCouriers(result.data);
      }
    } catch (error) {
      console.error('Error loading couriers:', error);
    }
  };

  const loadAssignments = async () => {
    if (!selectedCourier) return;
    
    setLoading(true);
    try {
      const result = await assignmentService.getByCourier(selectedCourier, 'assigned');
      if (result.data) {
        setAssignments(result.data);
        setSelectedOrders(result.data.map(a => a.order_uuid));
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
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
      console.error('Error loading route:', error);
    }
  };

  const handleOptimize = async () => {
    if (!selectedCourier || selectedOrders.length === 0) {
      alert('Veuillez sélectionner un livreur avec des commandes assignées');
      return;
    }

    setOptimizing(true);
    try {
      const result = await routeService.optimize({
        courier_uuid: selectedCourier,
        order_uuids: selectedOrders,
      });

      if (result.data) {
        setRoute(result.data);
        alert('Itinéraire optimisé avec succès');
      }
    } catch (error) {
      alert('Erreur lors de l\'optimisation');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Itinéraires optimisés</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Sélectionner un livreur">
          <div className="space-y-4">
            <Select
              label="Livreur"
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              options={[
                { value: '', label: 'Sélectionner un livreur' },
                ...couriers.map(courier => ({
                  value: courier.uuid,
                  label: `${courier.user?.name || 'N/A'} - ${courier.vehicle_type}`
                }))
              ]}
            />

            {selectedCourier && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-2">Commandes assignées</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
            )}

            {selectedCourier && assignments.length > 0 && (
              <Button
                onClick={handleOptimize}
                loading={optimizing}
                variant="primary"
                className="w-full"
              >
                Optimiser l'itinéraire
              </Button>
            )}
          </div>
        </Card>

        {route && (
          <Card title="Itinéraire optimisé">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Distance totale</p>
                <p className="text-2xl font-bold">{route.total_distance.toFixed(2)} km</p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Temps estimé</p>
                <p className="text-2xl font-bold">{route.estimated_time} min</p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Nombre de points</p>
                <p className="text-2xl font-bold">{route.route_points.length}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Généré le</p>
                <p className="text-sm">{formatDateTime(route.created_at)}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {selectedCourier && assignments.length > 0 && (
        <Card title="Commandes assignées">
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                  <th className={tailwindClasses.tableHeaderCell}>Client</th>
                  <th className={tailwindClasses.tableHeaderCell}>Adresse</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {assignments.map((assignment) => (
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
                        {assignment.assignment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {route && route.route_points.length > 0 && (
        <Card title="Ordre de livraison optimisé" className="mt-6">
          <div className="space-y-2">
            {route.route_points
              .sort((a, b) => a.sequence - b.sequence)
              .map((point, index) => (
                <div
                  key={point.order_uuid}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{point.address}</p>
                    <p className="text-sm text-gray-600">Commande: {point.order_uuid}</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

