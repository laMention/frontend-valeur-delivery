import { useState, useEffect } from 'react';
import { pricingService } from '../../services/PricingService';
import { zoneService } from '../../services/ZoneService';
import type { PricingCalculation } from '../../services/PricingService';
import type { Zone } from '../../models/Zone';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatCurrency } from '../../utils/formatters';
import { useToastContext } from '../../contexts/ToastContext';

export default function PricingView() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [formData, setFormData] = useState({
    delivery_address: '',
    zone_uuid: '',
    vehicle_type: 'moto' as 'moto' | 'voiture',
    weight: 0,
    is_express: false,
  });
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    loadZones();
  }, []);

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

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCalculating(true);

    try {
      const result = await pricingService.calculate(formData);
      if (result.data) {
        setCalculation(result.data);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors du calcul du prix';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Tarification automatique</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Calculer le prix de livraison">
          <form onSubmit={handleCalculate}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse de livraison
              </label>
              <textarea
                className={tailwindClasses.textarea}
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                required
                rows={3}
                placeholder="Ex: Cocody, Abidjan, Côte d'Ivoire"
              />
            </div>

            <Select
              label="Zone"
              value={formData.zone_uuid}
              onChange={(e) => setFormData({ ...formData, zone_uuid: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner une zone' },
                ...zones.map(z => ({ value: z.uuid, label: z.name }))
              ]}
              required
            />

            <Select
              label="Type de véhicule"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as 'moto' | 'voiture' })}
              options={[
                { value: 'moto', label: 'Moto' },
                { value: 'voiture', label: 'Voiture' },
              ]}
            />

            <Input
              label="Poids (kg) - Optionnel"
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.1"
            />

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_express}
                  onChange={(e) => setFormData({ ...formData, is_express: e.target.checked })}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm font-medium text-gray-700">Livraison express</span>
              </label>
            </div>

            <Button type="submit" loading={calculating} variant="primary" className="w-full">
              Calculer le prix
            </Button>
          </form>
        </Card>

        <Card title="Résultat du calcul">
          {calculation ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Distance</p>
                <p className="text-2xl font-bold">{calculation.distance_km.toFixed(2)} km</p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Type de véhicule</p>
                <p className="text-lg font-semibold capitalize">{calculation.vehicle_type}</p>
              </div>

              <div className="p-4 bg-primary-red text-white rounded">
                <p className="text-sm mb-1">Prix de livraison</p>
                <p className="text-3xl font-bold">{formatCurrency(calculation.price)}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Temps estimé</p>
                <p className="text-lg font-semibold">{calculation.estimated_time} minutes</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Remplissez le formulaire et cliquez sur "Calculer le prix" pour obtenir une estimation
            </div>
          )}
        </Card>
      </div>

      <Card title="Grille tarifaire" className="mt-6">
        <div className="overflow-x-auto">
          <table className={tailwindClasses.table}>
            <thead className={tailwindClasses.tableHeader}>
              <tr>
                <th className={tailwindClasses.tableHeaderCell}>Type de véhicule</th>
                <th className={tailwindClasses.tableHeaderCell}>Distance (km)</th>
                <th className={tailwindClasses.tableHeaderCell}>Prix de base</th>
                <th className={tailwindClasses.tableHeaderCell}>Express (+%)</th>
              </tr>
            </thead>
            <tbody className={tailwindClasses.tableBody}>
              <tr>
                <td className={tailwindClasses.tableCell}>Moto</td>
                <td className={tailwindClasses.tableCell}>0-5 km</td>
                <td className={tailwindClasses.tableCell}>1000 XOF</td>
                <td className={tailwindClasses.tableCell}>+50%</td>
              </tr>
              <tr>
                <td className={tailwindClasses.tableCell}>Moto</td>
                <td className={tailwindClasses.tableCell}>5-10 km</td>
                <td className={tailwindClasses.tableCell}>1500 XOF</td>
                <td className={tailwindClasses.tableCell}>+50%</td>
              </tr>
              <tr>
                <td className={tailwindClasses.tableCell}>Voiture</td>
                <td className={tailwindClasses.tableCell}>0-5 km</td>
                <td className={tailwindClasses.tableCell}>2000 XOF</td>
                <td className={tailwindClasses.tableCell}>+50%</td>
              </tr>
              <tr>
                <td className={tailwindClasses.tableCell}>Voiture</td>
                <td className={tailwindClasses.tableCell}>5-10 km</td>
                <td className={tailwindClasses.tableCell}>3000 XOF</td>
                <td className={tailwindClasses.tableCell}>+50%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          * Les prix peuvent varier selon la zone et le poids du colis. Le calcul est effectué automatiquement.
        </p>
      </Card>
    </div>
  );
}

