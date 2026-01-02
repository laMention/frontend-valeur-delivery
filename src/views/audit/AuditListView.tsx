import { useState, useEffect } from 'react';
import { auditService } from '../../services/AuditService';
import { userService } from '../../services/UserService';
import type { AuditLog } from '../../models/AuditLog';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';

export default function AuditListView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_uuid: '',
    action: '',
    target_type: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadUsers();
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
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Audit / Activités</h1>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Utilisateur"
            value={filters.user_uuid}
            onChange={(e) => setFilters({ ...filters, user_uuid: e.target.value })}
            options={[
              { value: '', label: 'Tous les utilisateurs' },
              ...users.map(u => ({ value: u.uuid, label: u.name }))
            ]}
          />

          <Input
            label="Action"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            placeholder="Ex: order_status_update"
          />

          <Select
            label="Entité"
            value={filters.target_type}
            onChange={(e) => setFilters({ ...filters, target_type: e.target.value })}
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
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />

          <Input
            label="Date de fin"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>
      </Card>

      <Card title="Journal des activités">
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucune activité enregistrée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
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
                      {log.user?.name || 'Système'}
                    </td>
                    <td className={tailwindClasses.tableCell}>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
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
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-md">
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
        )}
      </Card>
    </div>
  );
}

