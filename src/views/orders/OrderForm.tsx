import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderController } from '../../controllers/OrderController';
import { partnerService } from '../../services/PartnerService';
import { zoneService } from '../../services/ZoneService';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../contexts/ToastContext';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import AddressInput from '../../components/common/AddressInput';
import { tailwindClasses } from '../../utils/tailwindClasses';
import type { Partner } from '../../models/Partner';
import type { Zone } from '../../models/Zone';
import type { Order, CreateOrderData, UpdateOrderData } from '../../services/OrderService';
import { usePermissions } from '../../hooks/usePermissions';
import type { Role } from '../../models/User';



interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

// Poids prédéfinis pour sélection
const WEIGHT_OPTIONS = [
  { value: 0.5, label: '0.5 kg' },
  { value: 1, label: '1 kg' },
  { value: 2, label: '2 kg' },
  { value: 3, label: '3 kg' },
  { value: 5, label: '5 kg' },
  { value: 10, label: '10 kg' },
  { value: 15, label: '15 kg' },
  { value: 20, label: '20 kg' },
  { value: 30, label: '30 kg' },
  { value: 50, label: '50 kg' },
];

export default function OrderForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculations, setCalculations] = useState<{
    distance_km?: number;
    estimated_time?: number;
    vehicle_type?: 'moto' | 'voiture';
    delivery_price?: number;
  }>({});
  const [isPartner, setIsPartner] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const { getUserRoles } = usePermissions();
  const userRoles = getUserRoles();
  const { user: currentUser } = useAuth();

  
    

    const checkUserRole = async () => {
        // Vérifier si l'utilisateur est un partenaire
        const userRoles = user?.roles || [];
        const partnerRole = userRoles.find((r: any) => r.name === 'partner' || r.name === 'partenaire');
        setIsPartner(!!partnerRole);

        console.log('✅ isPartner:', isPartner);
        
        // Si partenaire, récupérer le partenaire associé
        if (partnerRole) {
            const userPartner = currentUser && isPartner ? currentUser?.partner : undefined;
            setFormData(prev => ({ ...prev, partner_id: userPartner?.uuid || '' }));  
        }
    };

    // console.log(currentUser);
    console.log(currentUser && isPartner ? currentUser?.partner?.uuid : '');

  const [formData, setFormData] = useState<CreateOrderData>({
    order_number: '',
    partner_id: currentUser && isPartner ? currentUser?.partner?.uuid : '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_latitude: undefined,
    delivery_longitude: undefined,
    pickup_address: '',
    pickup_latitude: undefined,
    pickup_longitude: undefined,
    package_weight_kg: 1,
    is_express: false,
    zone_uuid: '',
    reserved_at: new Date().toISOString().slice(0, 16),
    total_amount: 0,
    order_amount: 0,
  });

   

  const loadPartners = async () => {
    try {
      const result = await partnerService.getAll();
      if (result.data) {
        setPartners(result.data);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadZones = async () => {
    try {
      const result = await zoneService.getAll();
      if (result.data) {
        setZones(result.data);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadOrder = async () => {
    setLoading(true);
    try {
      const result = await orderController.getById(uuid!);
      if (result.success && result.data) {
        const order = result.data;
        setFormData({
          order_number: order.order_number,
          partner_id: order.partner_id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          delivery_address: order.delivery_address || '',
          delivery_latitude: order.delivery_location?.latitude || undefined,
          delivery_longitude: order.delivery_location?.longitude || undefined,
          pickup_address: order.pickup_address || '',
          pickup_latitude: order.pickup_location?.latitude || undefined,
          pickup_longitude: order.pickup_location?.longitude || undefined,
          package_weight_kg: order.package_weight_kg || 1,
          is_express: order.is_express || false,
          zone_uuid: order.zone_uuid,
          reserved_at: order.reserved_at ? new Date(order.reserved_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          total_amount: order.total_amount,
          order_amount: order.order_amount,
        });
        
        // Charger les calculs depuis le pricing
        if (order.pricing) {
          setCalculations({
            distance_km: order.pricing.distance_km,
            vehicle_type: order.pricing.vehicle_type,
            delivery_price: order.pricing.price,
            estimated_time: undefined, // Non stocké actuellement
          });
        }
        
        if (order.items) {
          setItems(order.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
          })));
        }
      }
    } catch (error) {
      setError('Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingGPS(true);
    setError('');
    
    try {
      // Vérifier que le navigateur supporte la géolocalisation
      if (!navigator.geolocation) {
        const errorMsg = 'La géolocalisation n\'est pas supportée par votre navigateur. Veuillez saisir l\'adresse manuellement.';
        setError(errorMsg);
        showError(errorMsg);
        setIsLoadingGPS(false);
        return;
      }

      // Demander l'autorisation et récupérer la position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Vérifier que les coordonnées sont valides
            if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
              throw new Error('Coordonnées GPS invalides');
            }

            // Utiliser Google Geocoding API pour convertir en adresse (reverse geocoding)
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            
            if (!apiKey) {
              // Si pas d'API key, utiliser les coordonnées directement
              setFormData(prev => ({ 
                ...prev, 
                pickup_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                pickup_latitude: latitude,
                pickup_longitude: longitude,
              }));
              setIsLoadingGPS(false);
              return;
            }

            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=fr&region=ci`
              );
              
              if (!response.ok) {
                throw new Error('Erreur lors du géocodage inverse');
              }

              const data = await response.json();
              
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                // Utiliser la première adresse trouvée
                const address = data.results[0].formatted_address;
                setFormData(prev => ({ 
                  ...prev, 
                  pickup_address: address,
                  pickup_latitude: latitude,
                  pickup_longitude: longitude,
                }));
                success('Position actuelle récupérée avec succès');
              } else if (data.status === 'ZERO_RESULTS') {
                // Aucune adresse trouvée, utiliser les coordonnées
                setFormData(prev => ({ 
                  ...prev, 
                  pickup_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                  pickup_latitude: latitude,
                  pickup_longitude: longitude,
                }));
                showError('Aucune adresse trouvée pour cette position. Les coordonnées GPS ont été enregistrées.');
              } else {
                // Erreur de l'API Google
                throw new Error(data.error_message || 'Erreur lors du géocodage inverse');
              }
            } catch (geocodeError) {
              // En cas d'erreur de géocodage, utiliser quand même les coordonnées
              console.warn('Erreur de géocodage inverse, utilisation des coordonnées:', geocodeError);
              setFormData(prev => ({ 
                ...prev, 
                pickup_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                pickup_latitude: latitude,
                pickup_longitude: longitude,
              }));
              showError('Impossible de convertir la position en adresse. Les coordonnées GPS ont été enregistrées.');
            }
            
            setIsLoadingGPS(false);
          } catch (error) {
            console.error('Erreur lors du traitement de la position:', error);
            const errorMsg = 'Erreur lors du traitement de votre position. Veuillez saisir l\'adresse manuellement.';
            setError(errorMsg);
            showError(errorMsg);
            setIsLoadingGPS(false);
          }
        },
        (error) => {
          // Gestion des erreurs de géolocalisation
          let errorMsg = 'Impossible de récupérer votre position actuelle. Veuillez saisir l\'adresse manuellement.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position ou saisir l\'adresse manuellement.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Position indisponible. Veuillez vérifier que votre GPS est activé ou saisir l\'adresse manuellement.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Délai d\'attente dépassé pour la récupération de la position. Veuillez réessayer ou saisir l\'adresse manuellement.';
              break;
            default:
              errorMsg = 'Impossible de récupérer votre position actuelle. Veuillez saisir l\'adresse manuellement.';
          }
          
          console.error('Erreur GPS:', error);
          setError(errorMsg);
          showError(errorMsg);
          setIsLoadingGPS(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      const errorMsg = 'Erreur lors de la récupération de votre position. Veuillez saisir l\'adresse manuellement.';
      setError(errorMsg);
      showError(errorMsg);
      setIsLoadingGPS(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // console.log('✅ formData:', formData);
    try {
      // vérifier que pickup_address a des coordonnées GPS
      if (formData.pickup_address && (!formData.pickup_latitude || !formData.pickup_longitude)) {
        setError('Veuillez renseigner l\'adresse de récupération du colis en sélectionnant une adresse depuis les suggestions');
        showError('Veuillez renseigner l\'adresse de récupération du colis en sélectionnant une adresse depuis les suggestions');
        setLoading(false);
        return;
      }
      // vérifier que delivery_address a des coordonnées GPS
      if (formData.delivery_address && (!formData.delivery_latitude || !formData.delivery_longitude)) {
        setError('Veuillez renseigner l\'adresse de livraison en sélectionnant une adresse depuis les suggestions');
        showError('Veuillez renseigner l\'adresse de livraison en sélectionnant une adresse depuis les suggestions');
        setLoading(false);
        return;
      }

      // Utiliser le montant total saisi par l'utilisateur, ou calculer depuis les items
      const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const finalTotalAmount = formData.total_amount > 0 ? formData.total_amount : itemsTotal;
      
      const data: CreateOrderData | UpdateOrderData = {
        ...formData,
        total_amount: finalTotalAmount,
        items: items.length > 0 ? items : undefined,
      };

      const result = uuid
        ? await orderController.update(uuid, data as UpdateOrderData)
        : await orderController.create(data as CreateOrderData);

      if (result.success) {
        success(uuid ? 'Commande modifiée avec succès' : 'Commande créée avec succès');
        navigate('/orders');
      } else {
        const errorMsg = result.error || 'Erreur lors de la sauvegarde';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Erreur lors de la sauvegarde';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handlePickupAddressChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, pickup_address: e.target.value }));
    // console.log('✅ pickup_address:', e.target.value);
    // Récupérer les coordonnées GPS de l'adresse
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${e.target.value}&key=${apiKey}`);
    const data = await response.json();
    // console.log('✅ data:', data);
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const latitude = data.results[0].geometry.location.lat;
      const longitude = data.results[0].geometry.location.lng;
      setFormData(prev => ({ ...prev, pickup_latitude: latitude, pickup_longitude: longitude }));
    }
  };

  const handlePickupAddressSelect = (place: any) => {
    // console.log('✅ place:', place);
    setFormData(prev => ({ ...prev, pickup_address: place.address, pickup_latitude: place.latitude || undefined, pickup_longitude: place.longitude || undefined }));
  };
  const handleDeliveryAddressChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, delivery_address: e.target.value }));
    // console.log('✅ delivery_address:', e.target.value);
    // Récupérer les coordonnées GPS de l'adresse
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${e.target.value}&key=${apiKey}`);
    const data = await response.json();
    // console.log('✅ data:', data.results[0].geometry.location);
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const latitude = data.results[0].geometry.location.lat;
      const longitude = data.results[0].geometry.location.lng;
      setFormData(prev => ({ ...prev, delivery_latitude: latitude, delivery_longitude: longitude }));
    }
  };
  const handleDeliveryAddressSelect = (place: any) => {
    setFormData(prev => ({ ...prev, delivery_address: place.address, delivery_latitude: place.latitude || undefined, delivery_longitude: place.longitude || undefined }));
  };

  useEffect(() => {
    loadPartners();
    loadZones();
    checkUserRole();
    if (uuid) {
      loadOrder();
    }
  }, [uuid, user]);

  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryPrice = Number(calculations.delivery_price) || 0;
  const totalAmount = Number(itemsTotal) + Number(deliveryPrice);

  if (loading && uuid) {
    return <div className="p-4 text-center">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier la commande' : 'Nouvelle commande'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Retour
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Informations commande */}
          <Card title="Informations commande">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Numéro de commande *"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                required={!uuid}
                placeholder="Ex: CMD-2025-001"
                disabled={!!uuid}
              />
              {/* Si l'utilisateur n'est pas un partenaire, afficher le select pour sélectionner un partenaire */}
              {!userRoles.some((r: any) => r.name === 'partner' || r.name === 'partenaire') && (
                <Select
                  label="Vendeur (Partenaire) *"
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                  options={[
                    { value: '', label: 'Sélectionner un partenaire' },
                    ...partners.map(p => ({ value: p.uuid, label: p.company_name }))
                  ]}
                  required
                />
              )}
              {/* Si l'utilisateur est un partenaire, afficher le nom de l'entreprise */}
              {userRoles.some((r: Role) => r.name === 'partner' || r.name === 'partenaire') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vendeur ({currentUser?.partner?.company_name})
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                    
                      {currentUser?.partner?.company_name || 'Votre entreprise'}
                    </p>
                  </div>
                  <Input
                      type='hidden'
                      name='partner_id'
                      value={isPartner ? currentUser?.partner?.uuid || '' : ''}
                      onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                    />
                  <p className="mt-1 text-xs text-gray-500">
                    Les commandes créées vous seront automatiquement attribuées
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Livraison */}
          <Card title="Livraison">
            <div className="space-y-4">
              <Select
                label="Zone de livraison *"
                value={formData.zone_uuid}
                onChange={(e) => setFormData({ ...formData, zone_uuid: e.target.value })}
                options={[
                  { value: '', label: 'Sélectionner une zone' },
                  ...zones.map(z => ({ value: z.uuid, label: z.name }))
                ]}
                
              />

              <div>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <AddressInput
                      label="Adresse de récupération du colis *"
                      value={formData.pickup_address}
                      onChange={(e) => handlePickupAddressChange(e as React.ChangeEvent<HTMLTextAreaElement>)}
                        onPlaceSelect={(place) => handlePickupAddressSelect(place)}
                      placeholder="Commencez à taper une adresse..."
                      required
                    />
                  </div>
                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseCurrentLocation}
                      disabled={isLoadingGPS}
                      className="whitespace-nowrap"
                    >
                      {isLoadingGPS ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Chargement...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">📍</span>
                          Utiliser ma position
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {formData.pickup_latitude && formData.pickup_longitude && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Coordonnées GPS: {formData.pickup_latitude.toFixed(6)}, {formData.pickup_longitude.toFixed(6)} - Adresse de récupération: {formData.pickup_address}
                  </p>
                )}
                {!formData.pickup_latitude && formData.pickup_address && (
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠ Veuillez sélectionner une adresse depuis les suggestions pour obtenir les coordonnées GPS
                  </p>
                )}
              </div>

              <Input
                label="Date de réservation *"
                type="datetime-local"
                value={formData.reserved_at}
                onChange={(e) => setFormData({ ...formData, reserved_at: e.target.value })}
                required
              />
            </div>
          </Card>

          {/* Client final */}
          <Card title="Client final">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom du client *"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />

              <Input
                label="Téléphone du client *"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                required
              />
            </div>

            <div className="mt-4">
              <AddressInput
                label="Adresse de livraison *"
                value={formData.delivery_address}
                // onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                onChange={(e) => handleDeliveryAddressChange(e as React.ChangeEvent<HTMLTextAreaElement>)}
                required
                onPlaceSelect={(place) => handleDeliveryAddressSelect(place)}
              />
            </div>
            {formData.delivery_latitude && formData.delivery_longitude && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Coordonnées GPS: {formData.delivery_latitude.toFixed(6)}, {formData.delivery_longitude.toFixed(6)} - Adresse de livraison: {formData.delivery_address}
              </p>
            )}
            {!formData.delivery_latitude && formData.delivery_address && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                ⚠ Veuillez sélectionner une adresse depuis les suggestions pour obtenir les coordonnées GPS
              </p>
            )}
          </Card>

          {/* Colis */}
          <Card title="Colis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Select
                  label="Poids du colis (kg) "
                  value={formData.package_weight_kg.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && value !== 'custom') {
                      setFormData({ ...formData, package_weight_kg: parseFloat(value) });
                    }
                  }}
                  options={[
                    { value: '', label: 'Sélectionner un poids' },
                    ...WEIGHT_OPTIONS.map(w => ({ value: w.value.toString(), label: w.label })),
                    { value: 'custom', label: 'Autre (saisie manuelle)' }
                  ]}
                  
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Poids personnalisé (kg) *"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={formData.package_weight_kg}
                  onChange={(e) => setFormData({ ...formData, package_weight_kg: parseFloat(e.target.value) || 0.1 })}
                  placeholder="Saisir le poids"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le véhicule sera déterminé automatiquement selon ce poids
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_express}
                    onChange={(e) => setFormData({ ...formData, is_express: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Livraison express
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  La livraison express peut entraîner des frais supplémentaires
                </p>
              </div>
            </div>
          </Card>

          {/* Calculs automatiques (lecture seule) */}
          <Card title="Calculs automatiques">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <label className="text-xs text-gray-500 dark:text-gray-400">Distance</label>
                <p className="text-lg font-semibold">
                  {calculations.distance_km !== undefined 
                    ? `${calculations.distance_km} km` 
                    : 'Non calculé'}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <label className="text-xs text-gray-500 dark:text-gray-400">Temps estimé</label>
                <p className="text-lg font-semibold">
                  {calculations.estimated_time 
                    ? `${calculations.estimated_time} min` 
                    : 'Non calculé'}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <label className="text-xs text-gray-500 dark:text-gray-400">Véhicule attribué</label>
                <p className="text-lg font-semibold">
                  {calculations.vehicle_type 
                    ? (calculations.vehicle_type === 'moto' ? '🏍️ Moto' : '🚗 Voiture')
                    : 'Non déterminé'}
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                <label className="text-xs text-blue-600 dark:text-blue-400">Montant livraison</label>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {deliveryPrice > 0 ? `${Number(deliveryPrice).toFixed(2)} XOF` : 'Calculé à la sauvegarde'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 italic">
              * Les calculs sont effectués automatiquement lors de la sauvegarde de la commande
            </p>
          </Card>

          {/* Montant total de la commande */}
          <Card title="Montant de la commande">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Montant total de la commande à livrer (XOF) *"
                type="number"
                step="0.01"
                min="0"
                value={formData.order_amount || ''}
                onChange={(e) => setFormData({ ...formData, order_amount: parseFloat(e.target.value) || 0 })}
                required
                placeholder="0.00"
              />
              <div className="flex items-end">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ce montant est distinct du montant de la livraison
                </p>
              </div>
            </div>
          </Card>

          {/* Articles (optionnel) */}
          <Card title="Articles (optionnel)">
            <div className="mb-4">
              <Button type="button" variant="outline" onClick={addItem}>
                + Ajouter un article
              </Button>
            </div>

            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className={tailwindClasses.table}>
                  <thead className={tailwindClasses.tableHeader}>
                    <tr>
                      <th className={tailwindClasses.tableHeaderCell}>Produit</th>
                      <th className={tailwindClasses.tableHeaderCell}>Quantité</th>
                      <th className={tailwindClasses.tableHeaderCell}>Prix unitaire</th>
                      <th className={tailwindClasses.tableHeaderCell}>Total</th>
                      <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={tailwindClasses.tableBody}>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className={tailwindClasses.tableCell}>
                          <input
                            type="text"
                            className={tailwindClasses.input}
                            value={item.product_name}
                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                            placeholder="Nom du produit"
                          />
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          <input
                            type="number"
                            className={tailwindClasses.input}
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          <input
                            type="number"
                            className={tailwindClasses.input}
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          {(item.price * item.quantity).toFixed(2)} XOF
                        </td>
                        <td className={tailwindClasses.tableCell}>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeItem(index)}
                          >
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun article. Cliquez sur "Ajouter un article" pour en ajouter.
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sous-total articles:</span>
                  <span className="font-bold">{Number(itemsTotal).toFixed(2)} XOF</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Frais de livraison:</span>
                  <span className="font-bold">{deliveryPrice > 0 ? `${Number(deliveryPrice).toFixed(2)} XOF` : 'Calculé à la sauvegarde'}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="text-lg font-bold">Total général:</span>
                  <span className="text-lg font-bold text-primary-red">{Number(totalAmount).toFixed(2)} XOF</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6 flex gap-4">
          <Button type="submit" loading={loading} variant="primary">
            {uuid ? 'Mettre à jour' : 'Créer la commande'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
