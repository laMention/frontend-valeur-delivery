import { useEffect, useState } from 'react';
import { zoneService, type Zone } from '../../services/ZoneService';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function ZoneList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
  });

  useEffect(() => {
    loadZones();
  }, [filters]);

  const loadZones = async () => {
    setLoading(true);
    try {
      const result = await zoneService.getAll();
      if (result.data) {
        let filteredZones = result.data;
        
        // Filtrer par nom si fourni
        if (filters.name) {
          filteredZones = filteredZones.filter((zone) =>
            zone.name.toLowerCase().includes(filters.name.toLowerCase())
          );
        }
        
        setZones(filteredZones);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      name: '',
    });
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      return;
    }

    try {
      await zoneService.delete(uuid);
      loadZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Erreur lors de la suppression de la zone');
    }
  };

  const canManageZones = canCreate('zone') || canUpdate('zone') || canDelete('zone');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Zones de livraison</h1>
        {canCreate('zone') && (
          <Button onClick={() => navigate('/zones/new')}>
            + Nouvelle zone
          </Button>
        )}
      </div>

      {canManageZones && (
        <Card title="Filtres" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Rechercher par nom"
              placeholder="Nom de la zone..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>

          <div className="mt-4">
            <Button variant="secondary" onClick={resetFilters}>
              Réinitialiser
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : zones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune zone trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points du polygone
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                  {canManageZones && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {zones.map((zone) => (
                  <tr key={zone.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {zone.name}
                      </div>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {zone.polygon?.length || 0} points
                      </div>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(zone.created_at)}
                      </div>
                    </td>
                    {canManageZones && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canUpdate('zone') && (
                            <Button
                              variant="secondary"
                              onClick={() => navigate(`/zones/${zone.uuid}/edit`)}
                            >
                              Modifier
                            </Button>
                          )}
                          {canDelete('zone') && (
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(zone.uuid)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
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

