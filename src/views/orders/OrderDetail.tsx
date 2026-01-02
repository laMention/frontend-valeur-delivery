import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderController } from '../../controllers/OrderController';
import { orderService } from '../../services/OrderService';
import { labelService } from '../../services/LabelService';
import { usePermissions } from '../../hooks/usePermissions';
import { useToastContext } from '../../contexts/ToastContext';
import type { Order } from '../../models/Order';
import type { Label } from '../../services/LabelService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import RouteMap from '../../components/orders/RouteMap';
import LabelViewModal from '../../components/orders/LabelViewModal';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { assignmentService } from '../../services/AssignmentService';
import AssignCourierModal from '../../components/orders/AssignCourierModal';

interface RouteData {
  route: {
    start_address: string;
    end_address: string;
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
    steps: Array<{
      instruction: string;
      distance: string;
      duration: string;
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
    }>;
  };
  distance_km: number;
  duration_minutes: number;
  polyline: string;
}

export default function OrderDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isPartner, isCourier, canUpdate, canDelete, isSuperAdmin } = usePermissions();
  const { success, error: showError } = useToastContext();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!uuid) return;
    setLoading(true);
    const result = await orderController.getById(uuid);
    if (result.success && result.data) {
      setOrder(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (uuid) {
      loadOrder();
      loadLabels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const loadLabels = async () => {
    if (!uuid) return;
    setLoadingLabels(true);
    try {
      const result = await labelService.getByOrder(uuid);
      setLabels(result.data || []);
    } catch (error) {
      console.error('Error loading labels:', error);
    } finally {
      setLoadingLabels(false);
    }
  };

  const handleScanBarcode = async () => {
    // Implementation for barcode scanning
    alert('Fonctionnalité de scan à implémenter');
  };

  const handleDownloadLabel = async () => {
    try {
      const labels = await labelService.getByOrder(uuid!);
      if (labels.data && labels.data.length > 0) {
        const blob = await labelService.download(labels.data[0].uuid);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `etiquette-${order?.order_number}.pdf`;
        a.click();
      } else {
        alert('Aucune étiquette générée pour cette commande');
      }
    } catch {
      alert('Erreur lors du téléchargement');
    }
  };

  const handleShowRoute = async () => {
    if (showRoute) {
      setShowRoute(false);
      return;
    }

    if (routeData) {
      setShowRoute(true);
      return;
    }

    if (!uuid || !order) {
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);

    try {
      const response = await orderService.getRoute(uuid);
      setRouteData(response.data);
      setShowRoute(true);
    } catch (error: unknown) {
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        'Erreur lors de la récupération de l\'itinéraire';
      setRouteError(errorMessage);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleAssignCourier = async (courierUuid: string) => {
    if (!uuid) return;

    setAssigning(true);
    try {
      const result = await assignmentService.assign({
        order_uuid: uuid,
        courier_uuid: courierUuid,
      });

      if (result.data) {
        success('Livreur attribué avec succès');
        setShowAssignModal(false);
        loadOrder(); // Recharger les données de la commande
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de l\'attribution';
      showError(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!uuid) return;

    setDeleting(true);
    try {
      await orderService.delete(uuid);
      success('Commande supprimée avec succès');
      navigate('/orders');
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la suppression';
      showError(errorMessage);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteLabel = async (labelUuid: string) => {
    setDeletingLabel(labelUuid);
    try {
      await labelService.delete(labelUuid);
      success('Étiquette supprimée avec succès');
      loadLabels();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la suppression de l\'étiquette';
      showError(errorMessage);
    } finally {
      setDeletingLabel(null);
    }
  };

  const canEditOrder = () => isSuperAdmin() || canUpdate('order');
  const canDeleteOrder = () => isSuperAdmin() || canDelete('order');

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!order) {
    return <div className="text-center py-12">Commande non trouvée</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Détails de la commande</h1>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Informations générales">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Numéro de commande</p>
              <p className="font-semibold">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <Badge status={order.status} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant total</p>
              <p className="font-semibold text-lg">{formatCurrency(order.total_amount)}</p>
            </div>            
            <div>
              <p className="text-sm text-gray-600">Date de réservation</p>
              <p className="font-semibold">{formatDateTime(order.reserved_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type de livraison</p>
              <p className="font-mono text-sm">{order.is_express ? 'Express' : 'Standard'}</p>
            </div>
            {order.pricing && (
              <div>
                <p className="text-sm text-gray-600">Véhicule</p>
                <p className="font-mono text-sm">{order.pricing.vehicle_type.toUpperCase()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Code-barres</p>
              <p className="font-mono text-sm">{order.barcode_value}</p>
            </div>
          </div>
        </Card>

        <Card title="Informations client">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Nom</p>
              <p className="font-semibold">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              <p className="font-semibold">{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Adresse de livraison</p>
              <p className="font-semibold">{order.delivery_address}</p>
            </div>
          </div>
        </Card>

        {order.items && order.items.length > 0 && (
          <Card title="Articles" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className={tailwindClasses.table}>
                <thead className={tailwindClasses.tableHeader}>
                  <tr>
                    <th className={tailwindClasses.tableHeaderCell}>Produit</th>
                    <th className={tailwindClasses.tableHeaderCell}>Quantité</th>
                    <th className={tailwindClasses.tableHeaderCell}>Prix unitaire</th>
                    <th className={tailwindClasses.tableHeaderCell}>Total</th>
                  </tr>
                </thead>
                <tbody className={tailwindClasses.tableBody}>
                  {order.items.map((item) => (
                    <tr key={item.uuid}>
                      <td className={tailwindClasses.tableCell}>{item.product_name}</td>
                      <td className={tailwindClasses.tableCell}>{item.quantity}</td>
                      <td className={tailwindClasses.tableCell}>{formatCurrency(item.price)}</td>
                      <td className={tailwindClasses.tableCell}>
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card title="Actions" className="lg:col-span-2">
          <div className="flex gap-4 flex-wrap">
            {(isAdmin() || isPartner() || isCourier()) && (
              <Button onClick={handleScanBarcode}>
                Scanner code-barres
              </Button>
            )}
            {(isAdmin() || isPartner() || isCourier()) && (
              <Button 
                variant="outline" 
                onClick={handleShowRoute}
                disabled={loadingRoute}
              >
                {loadingRoute ? 'Chargement...' : showRoute ? 'Masquer l\'itinéraire' : 'Voir l\'itinéraire'}
              </Button>
            )}
            {canEditOrder() && (
              <Button variant="outline" onClick={() => navigate(`/orders/${uuid}/edit`)}>
                Modifier
              </Button>
            )}
            {canDeleteOrder() && (
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Supprimer
              </Button>
            )}
            {(isAdmin() || isPartner()) && (
              <>
                {labels.length > 0 ? (
                  <>
                    <Button variant="outline" onClick={() => setShowLabelModal(true)}>
                      Voir l'étiquette
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => handleDeleteLabel(labels[0].uuid)}
                      disabled={deletingLabel === labels[0].uuid}
                    >
                      {deletingLabel === labels[0].uuid ? 'Suppression...' : 'Supprimer l\'étiquette'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={handleDownloadLabel}>
                    Télécharger étiquette
                  </Button>
                )}
                {isAdmin() && order.status === 'pending' && (
                  <Button variant="primary" onClick={() => setShowAssignModal(true)}>
                    ➕ Attribuer un livreur
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Affichage de l'itinéraire */}
        {showRoute && routeData && (
          <Card title="Itinéraire de livraison" className="lg:col-span-2">
            {routeError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                {routeError}
              </div>
            ) : (
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
            )}
          </Card>
        )}

        {/* Modal d'attribution de livreur */}
        {order && (
          <AssignCourierModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignCourier}
            order={order}
            loading={assigning}
          />
        )}

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Supprimer la commande"
          message={`Êtes-vous sûr de vouloir supprimer la commande ${order?.order_number} ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          loading={deleting}
        />

        {/* Modal de visualisation d'étiquette */}
        {order && (
          <LabelViewModal
            isOpen={showLabelModal}
            onClose={() => setShowLabelModal(false)}
            orderUuid={order.uuid}
            orderNumber={order.order_number}
          />
        )}
      </div>
    </div>
  );
}

