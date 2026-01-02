import { useEffect, useState } from 'react';
import { courierService } from '../../services/CourierService';
import { usePermissions } from '../../hooks/usePermissions';
import type { Courier } from '../../models/Courier';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function CourierList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    vehicle_type: '',
    is_active: '',
  });

  useEffect(() => {
    loadCouriers();
  }, [filters]);

  const loadCouriers = async () => {
    setLoading(true);
    const params: any = {};
    if (filters.search) params.search = filters.search;
    if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
    if (filters.is_active !== '') params.is_active = filters.is_active === 'true';

    const result = await courierService.getAll(params);
    if (result.data) {
      setCouriers(result.data);
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      vehicle_type: '',
      is_active: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Livreurs</h1>
        {canCreate('courier') && (
          <Button onClick={() => navigate('/couriers/new')}>
            + Nouveau livreur
          </Button>
        )}
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Rechercher"
            placeholder="Nom, email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <Select
            label="Type de véhicule"
            value={filters.vehicle_type}
            onChange={(e) => setFilters({ ...filters, vehicle_type: e.target.value })}
            options={[
              { value: '', label: 'Tous les véhicules' },
              { value: 'moto', label: 'Moto' },
              { value: 'voiture', label: 'Voiture' },
              { value: 'velo', label: 'Vélo' },
            ]}
          />

          <Select
            label="Statut"
            value={filters.is_active}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'true', label: 'Actif' },
              { value: 'false', label: 'Inactif' },
            ]}
          />
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={resetFilters}>
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
                  <th className={tailwindClasses.tableHeaderCell}>Nom</th>
                  <th className={tailwindClasses.tableHeaderCell}>Email</th>
                  <th className={tailwindClasses.tableHeaderCell}>Téléphone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Véhicule</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Créé le</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {couriers.map((courier) => (
                  <tr key={courier.uuid}>
                    <td className={tailwindClasses.tableCell}>{courier.user?.name || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{courier.user?.email || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{courier.user?.phone || '-'}</td>
                    <td className={tailwindClasses.tableCell}>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {courier.vehicle_type === 'moto' ? '🏍️ Moto' : courier.vehicle_type === 'voiture' ? '🚗 Voiture' : '🚲 Vélo'}
                      </span>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <span className={courier.is_active ? 'text-green-600' : 'text-red-600'}>
                        {courier.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className={tailwindClasses.tableCell}>{formatDateTime(courier.created_at)}</td>
                    <td className={tailwindClasses.tableCell}>
                      {canUpdate('courier') && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/couriers/${courier.uuid}`)}
                        >
                          Voir
                        </Button>
                      )}
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
