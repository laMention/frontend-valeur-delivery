import { useState, useEffect, useCallback } from 'react';
import { auditService } from '../../services/AuditService';
import { userService } from '../../services/UserService';
import type { AuditLog, AuditFilters } from '../../services/AuditService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useToastContext } from '../../contexts/ToastContext';

export default function AuditListView() {
  const { success, error: showError } = useToastContext();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState(false);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: null,
    to: null,
  });

  const [filters, setFilters] = useState<AuditFilters>({
    user_uuid: '',
    action: '',
    target_type: '',
    period: undefined,
    start_date: '',
    end_date: '',
    page: 1,
    per_page: 15,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const result = await userService.getAll({ per_page: 100 });
      if (result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await auditService.getAll(filters);
      if (result.data) {
        setLogs(result.data);
      }
      if (result.meta) {
        setMeta(result.meta);
      }
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      showError(error?.response?.data?.message || 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodFilter = (period: 'today' | 'yesterday' | 'range' | undefined) => {
    setFilters({
      ...filters,
      period,
      start_date: period === 'range' ? filters.start_date : '',
      end_date: period === 'range' ? filters.end_date : '',
      page: 1, // Reset to first page
    });
    setSelectedLogs(new Set()); // Clear selection
  };

  const handleDateRangeChange = (field: 'start_date' | 'end_date', value: string) => {
    setFilters({
      ...filters,
      [field]: value,
      period: value ? 'range' : undefined,
      page: 1,
    });
    setSelectedLogs(new Set());
  };

  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      page,
    });
    setSelectedLogs(new Set()); // Clear selection on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map(log => log.uuid)));
    }
  };

  const handleArchive = async () => {
    if (selectedLogs.size === 0) {
      showError('Veuillez sélectionner au moins un log à archiver');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir archiver ${selectedLogs.size} log(s) ?`)) {
      return;
    }

    setArchiving(true);
    try {
      const result = await auditService.archive(Array.from(selectedLogs));
      success(result.message || `${result.data.archived} log(s) archivé(s) avec succès`);
      setSelectedLogs(new Set());
      loadLogs(); // Reload without page reload
    } catch (error: any) {
      console.error('Error archiving logs:', error);
      showError(error?.response?.data?.message || 'Erreur lors de l\'archivage');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Journal des Activités</h1>

      <Card title="Filtres" className="mb-6">
        <div className="space-y-4">
          {/* Filtres par période rapide */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePeriodFilter('today')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filters.period === 'today'
                  ? 'bg-primary-red text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => handlePeriodFilter('yesterday')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filters.period === 'yesterday'
                  ? 'bg-primary-red text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Hier
            </button>
            <button
              type="button"
              onClick={() => handlePeriodFilter(undefined)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !filters.period
                  ? 'bg-primary-red text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Toutes les périodes
            </button>
          </div>

          {/* Filtres détaillés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Utilisateur"
              value={filters.user_uuid || ''}
              onChange={(e) => setFilters({ ...filters, user_uuid: e.target.value || undefined, page: 1 })}
              options={[
                { value: '', label: 'Tous les utilisateurs' },
                ...users.map(u => ({ value: u.uuid, label: u.name }))
              ]}
            />

            <Input
              label="Action"
              value={filters.action || ''}
              onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined, page: 1 })}
              placeholder="Ex: order_status_update"
            />

            <Select
              label="Entité"
              value={filters.target_type || ''}
              onChange={(e) => setFilters({ ...filters, target_type: e.target.value || undefined, page: 1 })}
              options={[
                { value: '', label: 'Toutes les entités' },
                { value: 'Order', label: 'Commande' },
                { value: 'User', label: 'Utilisateur' },
                { value: 'Partner', label: 'Partenaire' },
                { value: 'Courier', label: 'Livreur' },
              ]}
            />

            <Input
              label="Date de début"
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
            />

            <Input
              label="Date de fin"
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card title="Journal des activités">
        {/* Actions de sélection */}
        {logs.length > 0 && (
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedLogs.size === logs.length && logs.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary-red rounded focus:ring-primary-red"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedLogs.size > 0
                  ? `${selectedLogs.size} log(s) sélectionné(s)`
                  : 'Tout sélectionner'}
              </span>
            </div>
            {selectedLogs.size > 0 && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={archiving}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {archiving ? 'Archivage...' : `Archiver ${selectedLogs.size} log(s)`}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">Aucune activité trouvée pour cette période.</p>
            <p className="text-sm">Essayez de modifier les filtres ou de sélectionner une autre période.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tailwindClasses.table}>
                <thead className={tailwindClasses.tableHeader}>
                  <tr>
                    <th className={tailwindClasses.tableHeaderCell} style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedLogs.size === logs.length && logs.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-red rounded focus:ring-primary-red"
                      />
                    </th>
                    <th className={tailwindClasses.tableHeaderCell}>Utilisateur</th>
                    <th className={tailwindClasses.tableHeaderCell}>Action</th>
                    <th className={tailwindClasses.tableHeaderCell}>Entité</th>
                    <th className={tailwindClasses.tableHeaderCell}>Date / Heure</th>
                    <th className={tailwindClasses.tableHeaderCell}>IP</th>
                    <th className={tailwindClasses.tableHeaderCell}>Détails</th>
                  </tr>
                </thead>
                <tbody className={tailwindClasses.tableBody}>
                  {logs.map((log) => (
                    <tr key={log.uuid}>
                      <td className={tailwindClasses.tableCell}>
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.uuid)}
                          onChange={() => handleSelectLog(log.uuid)}
                          className="w-4 h-4 text-primary-red rounded focus:ring-primary-red"
                        />
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        {log.user?.name || 'Système'}
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm dark:bg-blue-900 dark:text-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        {log.target_type || '-'}
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        {log.ip_address || '-'}
                      </td>
                      <td className={tailwindClasses.tableCell}>
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-primary-red hover:underline">Voir détails</summary>
                            <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto max-w-md">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Affichage de {meta.from || 0} à {meta.to || 0} sur {meta.total} résultat(s)
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(meta.current_page - 1)}
                    disabled={meta.current_page === 1}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Précédent
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                      let pageNum;
                      if (meta.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (meta.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (meta.current_page >= meta.last_page - 2) {
                        pageNum = meta.last_page - 4 + i;
                      } else {
                        pageNum = meta.current_page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            meta.current_page === pageNum
                              ? 'bg-primary-red text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePageChange(meta.current_page + 1)}
                    disabled={meta.current_page === meta.last_page}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
