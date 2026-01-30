import { useEffect, useState } from 'react';
import integrationAdminService, { type Integration, type IntegrationFilters } from '../../services/IntegrationAdminService';
import { usePermissions } from '../../hooks/usePermissions';
import { useToastContext } from '../../contexts/ToastContext';
import { partnerService } from '../../services/PartnerService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Badge from '../../components/common/Badge';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import type { Partner } from '../../models/Partner';

export default function IntegrationsList() {
  const { success, error: showError, hasPermission, isSuperAdmin } = usePermissions();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [filters, setFilters] = useState<IntegrationFilters>({
    partner_id: '',
    marketplace_name: '',
    is_active: '',
    created_from: '',
    created_to: '',
    per_page: 15,
  });
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  
  // État pour la modal de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    integration: Integration | null;
    action: 'disable' | 'enable' | null;
    loading: boolean;
  }>({
    isOpen: false,
    integration: null,
    action: null,
    loading: false,
  });

  // Vérifier les permissions
  const canViewAll = isSuperAdmin() || hasPermission('integrations.view_all');
  const canDisable = isSuperAdmin() || hasPermission('integrations.disable');
  const canEnable = isSuperAdmin() || hasPermission('integrations.enable');

  useEffect(() => {
    if (canViewAll) {
      loadIntegrations();
      loadPartners();
    }
  }, [page, filters, canViewAll]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const result = await integrationAdminService.getAllIntegrations({
        ...filters,
        page,
      });
      if (result.success) {
        setIntegrations(result.data);
        setMeta(result.meta);
      }
    } catch (error) {
      showError('Erreur lors du chargement des intégrations');
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      const result = await partnerService.getAll();
      if (result.success && result.data) {
        setPartners(result.data);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const handleToggleStatus = (integration: Integration) => {
    const action = integration.is_active ? 'disable' : 'enable';
    setConfirmModal({
      isOpen: true,
      integration,
      action,
      loading: false,
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal.integration || !confirmModal.action) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));

    try {
      const result = confirmModal.action === 'disable'
        ? await integrationAdminService.disableIntegration(confirmModal.integration.id)
        : await integrationAdminService.enableIntegration(confirmModal.integration.id);

      if (result.success) {
        success(result.message);
        setIntegrations(prevIntegrations =>
          prevIntegrations.map(i =>
            i.id === confirmModal.integration!.id
              ? { ...i, is_active: !i.is_active }
              : i
          )
        );
        setConfirmModal({ isOpen: false, integration: null, action: null, loading: false });
      } else {
        showError(result.message || 'Erreur lors de l\'opération');
        setConfirmModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de l\'opération';
      showError(errorMessage);
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCloseModal = () => {
    if (!confirmModal.loading) {
      setConfirmModal({ isOpen: false, integration: null, action: null, loading: false });
    }
  };

  const resetFilters = () => {
    setFilters({
      partner_id: '',
      marketplace_name: '',
      is_active: '',
      created_from: '',
      created_to: '',
      per_page: 15,
    });
    setPage(1);
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Clé API copiée avec succès');
  };

  if (!canViewAll) {
    return (
      <div>
        <h1 className={tailwindClasses.pageTitle}>Intégrations</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous n'avez pas l'autorisation de voir toutes les intégrations.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Intégrations API</h1>
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Partenaire"
            value={filters.partner_id || ''}
            onChange={(e) => setFilters({ ...filters, partner_id: e.target.value, page: 1 })}
            options={[
              { value: '', label: 'Tous les partenaires' },
              ...partners.map(p => ({ value: p.uuid, label: p.company_name })),
            ]}
          />

          <Input
            label="Nom de la marketplace"
            placeholder="WooCommerce, PrestaShop..."
            value={filters.marketplace_name || ''}
            onChange={(e) => setFilters({ ...filters, marketplace_name: e.target.value, page: 1 })}
          />

          <Select
            label="Statut"
            value={filters.is_active || ''}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value, page: 1 })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'true', label: 'Actif' },
              { value: 'false', label: 'Inactif' },
            ]}
          />

          <Input
            label="Date de génération (début)"
            type="date"
            value={filters.created_from || ''}
            onChange={(e) => setFilters({ ...filters, created_from: e.target.value, page: 1 })}
          />

          <Input
            label="Date de génération (fin)"
            type="date"
            value={filters.created_to || ''}
            onChange={(e) => setFilters({ ...filters, created_to: e.target.value, page: 1 })}
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
        ) : integrations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune intégration trouvée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>Marketplace</th>
                  <th className={tailwindClasses.tableHeaderCell}>Partenaire</th>
                  <th className={tailwindClasses.tableHeaderCell}>API Key</th>
                  <th className={tailwindClasses.tableHeaderCell}>Dernière utilisation</th>
                  <th className={tailwindClasses.tableHeaderCell}>Date de génération</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id} className={tailwindClasses.tableRow}>
                    <td className={tailwindClasses.tableCell}>
                      <span className="font-medium">{integration.marketplace_name}</span>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {integration.partner ? (
                        <span>{integration.partner.company_name}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {showApiKey[integration.id]
                            ? integration.api_key
                            : integration.api_key.substring(0, 20) + '...'}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(integration.id)}
                        >
                          {showApiKey[integration.id] ? '🙈' : '👁️'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(integration.api_key)}
                        >
                          📋
                        </Button>
                      </div>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {integration.last_used_at
                        ? formatDateTime(integration.last_used_at)
                        : <span className="text-gray-400">Jamais</span>}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      {formatDateTime(integration.created_at)}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <Badge status={integration.is_active ? 'completed' : 'cancelled'}>
                        {integration.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex gap-2">
                        {integration.is_active && canDisable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(integration)}
                          >
                            Désactiver
                          </Button>
                        )}
                        {!integration.is_active && canEnable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(integration)}
                          >
                            Réactiver
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {meta.current_page} sur {meta.last_page} ({meta.total} résultats)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmToggle}
        title={confirmModal.action === 'disable' ? 'Désactiver l\'intégration' : 'Réactiver l\'intégration'}
        message={
          confirmModal.action === 'disable'
            ? `Êtes-vous sûr de vouloir désactiver l'intégration "${confirmModal.integration?.marketplace_name}" ?`
            : `Êtes-vous sûr de vouloir réactiver l'intégration "${confirmModal.integration?.marketplace_name}" ?`
        }
        confirmText={confirmModal.action === 'disable' ? 'Désactiver' : 'Réactiver'}
        cancelText="Annuler"
        loading={confirmModal.loading}
      />
    </div>
  );
}
