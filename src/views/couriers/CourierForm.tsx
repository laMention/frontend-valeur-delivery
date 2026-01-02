import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courierService } from '../../services/CourierService';
// import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import UserSelect from '../../components/common/UserSelect';
import MultiZoneSelect from '../../components/common/MultiZoneSelect';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { useToastContext } from '../../contexts/ToastContext';

export default function CourierForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToastContext();
  const [formData, setFormData] = useState({
    user_uuid: '',
    vehicle_type: 'moto' as 'moto' | 'voiture' | 'velo',
    is_active: true,
  });
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [primaryZoneId, setPrimaryZoneId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (uuid) {
      loadCourier();
    }
  }, [uuid]);

  const loadCourier = async () => {
    setLoading(true);
    try {
      const result = await courierService.getById(uuid!);
      if (result.data) {
        const courier = result.data;
        setFormData({
          user_uuid: courier.user_uuid,
          vehicle_type: courier.vehicle_type,
          is_active: courier.is_active,
        });

        // Charger les zones associées
        if (courier.zones && courier.zones.length > 0) {
          const zoneIds = courier.zones.map((z: { uuid: string; is_primary?: boolean }) => z.uuid);
          const primary = courier.zones.find((z: { uuid: string; is_primary?: boolean }) => z.is_primary);
          setSelectedZoneIds(zoneIds);
          setPrimaryZoneId(primary?.uuid);
        } else {
          // Charger les zones depuis l'API si non incluses
          try {
            const zonesResult = await courierService.getZones(uuid!);
            if (zonesResult.data && zonesResult.data.length > 0) {
              const zoneIds = zonesResult.data.map((z: { uuid?: string; id?: string }) => z.uuid || z.id).filter(Boolean) as string[];
              const primary = zonesResult.data.find((z: { uuid?: string; id?: string; is_primary?: boolean; pivot?: { is_primary?: boolean } }) => 
                z.is_primary || z.pivot?.is_primary
              );
              setSelectedZoneIds(zoneIds);
              setPrimaryZoneId(primary ? (primary.uuid || primary.id) : undefined);
            }
          } catch (err) {
            console.error('Error loading zones:', err);
          }
        }
      }
    } catch (error) {
      setError('Erreur lors du chargement du livreur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation : au moins une zone requise
    if (selectedZoneIds.length === 0) {
      setError('Au moins une zone de couverture est requise');
      return;
    }

    setLoading(true);

    try {
      // Créer ou mettre à jour le livreur avec les zones
      const courierData = {
        ...formData,
        zone_ids: selectedZoneIds,
        primary_zone_id: primaryZoneId,
      };

      const result = uuid
        ? await courierService.update(uuid, courierData)
        : await courierService.create(courierData);

      if (result.data) {
        success('Livreur sauvegardé avec succès');
        navigate('/couriers');
      } else {
        setError('Erreur lors de la sauvegarde');
        showError('Erreur lors de la sauvegarde');
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la sauvegarde';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier le livreur' : 'Nouveau livreur'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/couriers')}>
          Retour
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <UserSelect
            label="Utilisateur (Livreur) *"
            value={formData.user_uuid}
            onChange={(value) => setFormData({ ...formData, user_uuid: value })}
            roleFilter="courier"
            placeholder="Sélectionner un utilisateur livreur..."
            required={!uuid}
            disabled={!!uuid}
          />

          <Select
            label="Type de véhicule *"
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
            options={[
              { value: 'moto', label: 'Moto' },
              { value: 'voiture', label: 'Voiture' },
              { value: 'velo', label: 'Vélo' },
            ]}
            required
            className="mt-4"
          />

          <div className="mb-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Actif</span>
            </label>
          </div>

          <MultiZoneSelect
            label="Zones de couverture *"
            selectedZoneIds={selectedZoneIds}
            primaryZoneId={primaryZoneId}
            onZonesChange={setSelectedZoneIds}
            onPrimaryZoneChange={setPrimaryZoneId}
            required
          />

          <div className="flex gap-4 mt-6">
            <Button type="submit" loading={loading} variant="primary">
              {uuid ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/couriers')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
