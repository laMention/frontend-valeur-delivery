import { useEffect, useState } from 'react';
import { pricingRuleService } from '../../services/PricingRuleService';
import { usePermissions } from '../../hooks/usePermissions';
import type { PricingRule } from '../../models/PricingRule';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';

export default function PricingRuleList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    vehicle_type?: 'moto' | 'voiture';
    is_active?: boolean;
  }>({});

  useEffect(() => {
    loadRules();
  }, [filters]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const result = await pricingRuleService.getAll(filters);
      if (result.data) {
        setRules(result.data);
      }
    } catch (error) {
      console.error('Error loading pricing rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle tarifaire ?')) {
      try {
        await pricingRuleService.delete(uuid);
        loadRules();
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleToggleActive = async (rule: PricingRule) => {
    try {
      await pricingRuleService.update(rule.uuid, { is_active: !rule.is_active });
      loadRules();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Grille Tarifaire</h1>
        {canCreate('pricing') && (
          <Button onClick={() => navigate('/pricing-rules/new')}>
            + Nouvelle règle
          </Button>
        )}
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Type de véhicule"
            value={filters.vehicle_type || ''}
            onChange={(e) => setFilters({ ...filters, vehicle_type: e.target.value as 'moto' | 'voiture' || undefined })}
            options={[
              { value: '', label: 'Tous les véhicules' },
              { value: 'moto', label: 'Moto' },
              { value: 'voiture', label: 'Voiture' },
            ]}
          />
          <Select
            label="Statut"
            value={filters.is_active === undefined ? '' : filters.is_active ? 'true' : 'false'}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value === '' ? undefined : e.target.value === 'true' })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'true', label: 'Actif' },
              { value: 'false', label: 'Inactif' },
            ]}
          />
          <Input
            label="Priorité minimale"
            type="number"
            value={filters.priority || ''}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Ex: 0"
            min="0"
          />
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setFilters({})}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>Véhicule</th>
                  <th className={tailwindClasses.tableHeaderCell}>Distance (km)</th>
                  <th className={tailwindClasses.tableHeaderCell}>Prix standard</th>
                  <th className={tailwindClasses.tableHeaderCell}>Prix express</th>
                  <th className={tailwindClasses.tableHeaderCell}>Zone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Priorité</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {rules.map((rule) => (
                  <tr key={rule.uuid}>
                    <td className={tailwindClasses.tableCell}>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {rule.vehicle_type === 'moto' ? '🏍️ Moto' : '🚗 Voiture'}
                      </span>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {rule.min_distance_km} - {rule.max_distance_km ? rule.max_distance_km : '∞'} km
                    </td>
                    <td className={tailwindClasses.tableCell}>{formatCurrency(rule.base_price)}</td>
                    <td className={tailwindClasses.tableCell}>
                      {rule.express_price ? formatCurrency(rule.express_price) : '-'}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {rule.zone?.name || 'Toutes zones'}
                    </td>
                    <td className={tailwindClasses.tableCell}>{rule.priority}</td>
                    <td className={tailwindClasses.tableCell}>
                      <span className={rule.is_active ? 'text-green-600' : 'text-red-600'}>
                        {rule.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex gap-2">
                        {canUpdate('pricing') && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/pricing-rules/${rule.uuid}`)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleToggleActive(rule)}
                            >
                              {rule.is_active ? 'Désactiver' : 'Activer'}
                            </Button>
                          </>
                        )}
                        {canDelete('pricing') && (
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(rule.uuid)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

