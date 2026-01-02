import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pricingRuleService } from '../../services/PricingRuleService';
import { zoneService } from '../../services/ZoneService';
import type { PricingRule, StorePricingRuleData } from '../../models/PricingRule';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatCurrency } from '../../utils/formatters';

export default function PricingRuleForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [formData, setFormData] = useState<StorePricingRuleData>({
    vehicle_type: 'moto',
    min_distance_km: 0,
    max_distance_km: null,
    base_price: 0,
    express_price: null,
    zone_uuid: null,
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    loadZones();
    if (uuid) {
      loadRule();
    }
  }, [uuid]);

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

  const loadRule = async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const result = await pricingRuleService.getByUuid(uuid);
      if (result.data) {
        const rule = result.data;
        setFormData({
          vehicle_type: rule.vehicle_type,
          min_distance_km: rule.min_distance_km,
          max_distance_km: rule.max_distance_km,
          base_price: rule.base_price,
          express_price: rule.express_price,
          zone_uuid: rule.zone?.uuid || null,
          is_active: rule.is_active,
          priority: rule.priority,
        });
      }
    } catch (error) {
      console.error('Error loading pricing rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (uuid) {
        await pricingRuleService.update(uuid, formData);
      } else {
        await pricingRuleService.create(formData);
      }
      navigate('/pricing-rules');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (loading && uuid) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier la règle tarifaire' : 'Nouvelle règle tarifaire'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/pricing-rules')}>
          Retour
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Type de véhicule *"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as 'moto' | 'voiture' })}
              options={[
                { value: 'moto', label: 'Moto' },
                { value: 'voiture', label: 'Voiture' },
              ]}
            />

            <Input
              label="Priorité"
              type="number"
              value={formData.priority || 0}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              min="0"
            />

            <Input
              label="Distance minimale (km) *"
              type="number"
              step="0.01"
              value={formData.min_distance_km}
              onChange={(e) => setFormData({ ...formData, min_distance_km: parseFloat(e.target.value) || 0 })}
              min="0"
              required
            />

            <Input
              label="Distance maximale (km)"
              type="number"
              step="0.01"
              value={formData.max_distance_km || ''}
              onChange={(e) => setFormData({ ...formData, max_distance_km: e.target.value ? parseFloat(e.target.value) : null })}
              min="0"
              placeholder="Laisser vide pour illimité"
            />

            <Input
              label="Prix de base (XOF) *"
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
              min="0"
              required
            />

            <Input
              label="Prix express (XOF)"
              type="number"
              step="0.01"
              value={formData.express_price || ''}
              onChange={(e) => setFormData({ ...formData, express_price: e.target.value ? parseFloat(e.target.value) : null })}
              min="0"
              placeholder="Optionnel"
            />

            <Select
              label="Zone"
              value={formData.zone_uuid || ''}
              onChange={(e) => setFormData({ ...formData, zone_uuid: e.target.value || null })}
              options={[
                { value: '', label: 'Toutes zones' },
                ...zones.map(zone => ({ value: zone.uuid, label: zone.name }))
              ]}
            />

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Règle active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" loading={loading}>
              {uuid ? 'Mettre à jour' : 'Créer la règle'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/pricing-rules')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

