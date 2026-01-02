import { useEffect, useState } from 'react';
import { partnerService } from '../../services/PartnerService';
import { usePermissions } from '../../hooks/usePermissions';
import type { Partner } from '../../models/Partner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function PartnerList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
    address: '',
  });

  useEffect(() => {
    loadPartners();
  }, [filters]);

  const loadPartners = async () => {
    setLoading(true);
    const params: any = {};
    if (filters.name) params.name = filters.name;
    if (filters.address) params.address = filters.address;

    const result = await partnerService.getAll(params);
    if (result.data) {
      setPartners(result.data);
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      address: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Partenaires</h1>
        {canCreate('partner') && (
          <Button onClick={() => navigate('/partners/new')}>
            + Nouveau partenaire
          </Button>
        )}
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Rechercher par nom"
            placeholder="Nom de l'entreprise..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />

          <Input
            label="Rechercher par adresse"
            placeholder="Adresse..."
            value={filters.address}
            onChange={(e) => setFilters({ ...filters, address: e.target.value })}
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
                  <th className={tailwindClasses.tableHeaderCell}>Entreprise</th>
                  <th className={tailwindClasses.tableHeaderCell}>Contact</th>
                  <th className={tailwindClasses.tableHeaderCell}>Email</th>
                  <th className={tailwindClasses.tableHeaderCell}>Téléphone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Adresse</th>
                  <th className={tailwindClasses.tableHeaderCell}>Créé le</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {partners.map((partner) => (
                  <tr key={partner.uuid}>
                    <td className={tailwindClasses.tableCell}>{partner.company_name}</td>
                    <td className={tailwindClasses.tableCell}>{partner.user?.name || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{partner.user?.email || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{partner.user?.phone || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{partner.address}</td>
                    <td className={tailwindClasses.tableCell}>{formatDateTime(partner.created_at)}</td>
                    <td className={tailwindClasses.tableCell}>
                      {canUpdate('partner') && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/partners/${partner.uuid}`)}
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
