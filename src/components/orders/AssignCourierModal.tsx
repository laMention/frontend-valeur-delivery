import { useEffect, useState, useCallback } from 'react';
import { assignmentService } from '../../services/AssignmentService';
import { courierService } from '../../services/CourierService';
import type { Courier } from '../../models/Courier';
import type { Order } from '../../models/Order';
import Button from '../common/Button';
import Badge from '../common/Badge';

interface AssignCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (courierUuid: string) => void;
  order: Order;
  loading?: boolean;
}

export default function AssignCourierModal({
  isOpen,
  onClose,
  onAssign,
  order,
  loading = false,
}: AssignCourierModalProps) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [filteredCouriers, setFilteredCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllCouriers, setShowAllCouriers] = useState(false);

  const loadAvailableCouriers = useCallback(async () => {
    if (!order) return;
    
    setLoadingCouriers(true);
    setError(null);
    try {
      // Si "Afficher tous les livreurs" est coché, utiliser getAvailableForZone sans filtre vehicle_type
      const result = await assignmentService.suggestCouriers(order.uuid, 5.0);
      
      
      if (result.data) {
        setCouriers(result.data);
      }
    } catch (err: unknown) {
      setError('Erreur lors du chargement des livreurs disponibles');
      console.error('Error loading couriers:', err);
    } finally {
      setLoadingCouriers(false);
    }
  }, [order, showAllCouriers]);

  useEffect(() => {
    if (isOpen && order) {
      setShowAllCouriers(false); // Réinitialiser l'option "Afficher tous"
      loadAvailableCouriers();
    } else {
      setCouriers([]);
      setFilteredCouriers([]);
      setSelectedCourier('');
      setError(null);
    }
  }, [isOpen, order, loadAvailableCouriers]);

  useEffect(() => {
    // Afficher tous les livreurs chargés (déjà filtrés côté backend selon showAllCouriers)
    setFilteredCouriers(couriers);
  }, [couriers]);

  const handleAssign = () => {
    if (!selectedCourier) {
      setError('Veuillez sélectionner un livreur');
      return;
    }
    onAssign(selectedCourier);
  };
  const handleSelectCourier = (courierUuid: string) => {
    setSelectedCourier(courierUuid);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Attribuer un livreur
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {/* Informations de la commande */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Commande:</strong> {order.order_number}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Zone:</strong> {order.zone?.name || order.zone_uuid || 'Non définie'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Adresse:</strong> {order.delivery_address}
            </p>
            {order.pricing && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Véhicule requis:</strong>
                </p>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded capitalize font-semibold text-sm">
                  {order.pricing.vehicle_type}
                </span>
                {order.pricing.distance_km && (
                  <>
                    <span className="text-gray-400">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Distance:</strong> {order.pricing.distance_km} km
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* {order.pricing?.vehicle_type && (
            <div className="mb-4 flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
              <input
                type="checkbox"
                id="showAllCouriersModal"
                checked={showAllCouriers}
                onChange={(e) => {
                  setShowAllCouriers(e.target.checked);
                  // Le useEffect se chargera de recharger les livreurs
                }}    
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="showAllCouriersModal" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Afficher tous les livreurs disponibles (ignorer le type de véhicule)
              </label>
            </div>
          )} */}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {/* Liste des livreurs disponibles */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Livreurs disponibles ({filteredCouriers.length}
              {!showAllCouriers && order.pricing?.vehicle_type && filteredCouriers.length !== couriers.length && (
                <span className="text-gray-500"> / {couriers.length} total</span>
              )}
              )
            </h3>

            {loadingCouriers ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Chargement des livreurs...
              </div>
            ) : filteredCouriers.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                {couriers.length === 0 ? (
                  'Aucun livreur disponible pour cette zone'
                ) : (
                  <div>
                    <p>Aucun livreur avec le type de véhicule requis ({order.pricing?.vehicle_type})</p>
                    <p className="text-xs mt-2 text-gray-500">
                      Cochez "Afficher tous les livreurs" pour voir tous les livreurs disponibles
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCouriers.map((courier) => (
                  <div
                    key={courier.id}
                    onClick={() => handleSelectCourier(courier.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
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
                          <Badge
                            status={courier.is_active ? 'active' : 'inactive'}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 items-center">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded capitalize font-medium">
                            {courier.vehicle_type}
                          </span>
                          {courier.distance_km !== null && courier.distance_km !== undefined && (
                            <span>• {courier.distance_km} km</span>
                          )}
                          {courier.zones && courier.zones.length > 0 && (
                            <span>
                              • Zones: {courier.zones.map((z) => z.name).join(', ')}
                            </span>
                          )}
                          {showAllCouriers && 
                           order.pricing?.vehicle_type && 
                           courier.vehicle_type !== order.pricing.vehicle_type &&
                           !(order.pricing.vehicle_type === 'moto' && courier.vehicle_type === 'velo') && (
                            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded text-xs">
                              ⚠️ Type différent
                            </span>
                          )}
                        </div>
                        {courier.current_location && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            📍 Position GPS disponible
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <input
                          type="radio"
                          checked={selectedCourier === courier.id}
                          onChange={() => setSelectedCourier(courier.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              loading={loading}
              disabled={!selectedCourier || loadingCouriers}
            >
              Attribuer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

