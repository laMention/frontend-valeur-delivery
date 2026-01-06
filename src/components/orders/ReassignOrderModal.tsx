import { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../../services/AssignmentService';
import type { Courier } from '../../services/CourierService';
import type { DeliveryAssignment } from '../../models/Assignment';
import type { Order } from '../../models/Order';
import SearchableSelect from '../common/SearchableSelect';
import Button from '../common/Button';
import { useToastContext } from '../../contexts/ToastContext';

interface ReassignOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: DeliveryAssignment | null;
  order?: Order | null;
  onReassignSuccess: () => void;
}

export default function ReassignOrderModal({
  isOpen,
  onClose,
  assignment,
  order,
  onReassignSuccess,
}: ReassignOrderModalProps) {
  const { success, error: showError } = useToastContext();
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<DeliveryAssignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // Déterminer l'UUID de la commande
  const orderUuid = assignment?.order_uuid || order?.uuid;

  const loadAvailableCouriers = useCallback(async () => {
    if (!orderUuid) return;

    setLoading(true);
    try {
      const result = await assignmentService.suggestCouriers(orderUuid, 5.0);
      if (result.data) {
        setAvailableCouriers(result.data);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      console.error('Error loading available couriers:', error);
      showError(errorMessage || 'Erreur lors du chargement des livreurs disponibles');
    } finally {
      setLoading(false);
    }
  }, [orderUuid, showError]);

  const loadAssignmentForOrder = useCallback(async () => {
    if (!order?.uuid) return;

    setLoadingAssignment(true);
    try {
      const result = await assignmentService.getByOrder(order.uuid);
      if (result.data && result.data.length > 0) {
        const activeAssignment = result.data.find(a => a.assignment_status !== 'canceled' && a.assignment_status !== 'completed');
        if (activeAssignment) {
          setCurrentAssignment(activeAssignment);
          await loadAvailableCouriers();
        } else {
          showError('Aucune attribution active trouvée pour cette commande');
        }
      } else {
        showError('Cette commande n\'est pas encore attribuée');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      console.error('Error loading assignment:', error);
      showError(errorMessage || 'Erreur lors du chargement de l\'attribution');
    } finally {
      setLoadingAssignment(false);
    }
  }, [order, loadAvailableCouriers, showError]);

  useEffect(() => {
    if (isOpen && orderUuid) {
      if (assignment) {
        setCurrentAssignment(assignment);
        loadAvailableCouriers();
      } else if (order) {
        loadAssignmentForOrder();
      }
    } else {
      setSelectedCourier('');
      setAvailableCouriers([]);
      setCurrentAssignment(null);
    }
  }, [isOpen, assignment, order, orderUuid, loadAvailableCouriers, loadAssignmentForOrder]);

  const handleReassign = async () => {
    if (!currentAssignment || !selectedCourier) {
      showError('Veuillez sélectionner un livreur');
      return;
    }

    setReassigning(true);
    try {
      await assignmentService.reassign({
        assignment_uuid: currentAssignment.uuid,
        new_courier_uuid: selectedCourier,
      });
      success('Commande réassignée avec succès');
      onReassignSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      console.error('Error reassigning order:', error);
      showError(errorMessage || 'Erreur lors de la réassignation');
    } finally {
      setReassigning(false);
    }
  };

  if (!isOpen || !orderUuid) return null;

  const courierOptions = availableCouriers.map(courier => ({
    value: courier.id,
    label: `${courier.user?.name || 'N/A'} - ${courier.vehicle_type}`,
  }));

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Réassigner la commande
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {loadingAssignment ? (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                Chargement de l'attribution...
              </div>
            ) : currentAssignment ? (
              <>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong className="text-gray-900 dark:text-white">Commande:</strong> {currentAssignment.order?.order_number || order?.order_number || orderUuid}
                  </p>
                  {
                    currentAssignment.courier?.user?.name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Livreur actuel:</strong> {currentAssignment.courier?.user?.name}
                      </p>
                    )
                  }
                </div>

                {loading ? (
                  <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                    Chargement des livreurs disponibles...
                  </div>
                ) : (
                  <div className="relative z-10">
                    <SearchableSelect
                      label="Nouveau livreur"
                      value={selectedCourier}
                      onChange={setSelectedCourier}
                      options={courierOptions}
                      placeholder="Sélectionner un livreur"
                      searchPlaceholder="Rechercher un livreur..."
                    />
                  </div>
                )}

                {availableCouriers.length === 0 && !loading && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                    Aucun livreur disponible pour cette commande.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                Cette commande n'est pas encore attribuée ou ne peut pas être réassignée.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={reassigning}
            >
              Annuler
            </Button>
            <Button
              onClick={handleReassign}
              loading={reassigning}
              disabled={!selectedCourier || loading || loadingAssignment || !currentAssignment}
              variant="primary"
            >
              Réassigner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

