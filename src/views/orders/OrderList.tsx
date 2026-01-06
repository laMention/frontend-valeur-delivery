import { useEffect, useState } from 'react';
import { orderController } from '../../controllers/OrderController';
import { orderService } from '../../services/OrderService';
import { usePermissions } from '../../hooks/usePermissions';
import { useToastContext } from '../../contexts/ToastContext';
import type { Order } from '../../models/Order';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmModal from '../../components/common/ConfirmModal';
import ImportOrdersModal from '../../components/orders/ImportOrdersModal';
import ReassignOrderModal from '../../components/orders/ReassignOrderModal';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function OrderList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete, isSuperAdmin } = usePermissions();
  const { success, error: showError } = useToastContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [orderToReassign, setOrderToReassign] = useState<Order | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_filter: '',
    start_date: '',
    end_date: '',
    sort_by: 'newest',
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    const result = await orderController.getAll(filters);
    if (result.success) {
      setOrders(result.data || []);
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      search: '',
      date_filter: '',
      start_date: '',
      end_date: '',
      sort_by: 'newest',
    });
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    setDeletingOrder(orderToDelete.uuid);
    try {
      await orderService.delete(orderToDelete.uuid);
      success('Commande supprimée avec succès');
      setShowDeleteModal(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (error: unknown) {
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la suppression de la commande';
      showError(errorMessage);
    } finally {
      setDeletingOrder(null);
    }
  };

  const canEditOrder = () => isSuperAdmin() || canUpdate('order');
  const canDeleteOrder = () => isSuperAdmin() || canDelete('order');
  const canReassignOrder = (order: Order) => {
    // Peut réassigner si la commande est assignée mais non livrée/annulée
    return (isSuperAdmin() || canUpdate('order')) && 
           (order.status === 'assigned' || order.status === 'picked' || order.status === 'delivering');
  };

  const handleReassignClick = (order: Order) => {
    setOrderToReassign(order);
    setShowReassignModal(true);
  };

  const handleReassignSuccess = () => {
    loadOrders();
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      await orderService.export(filters, format);
      success(`Export ${format.toUpperCase()} réussi`);
    } catch (error: unknown) {
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de l\'export';
      showError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleImportSuccess = () => {
    loadOrders();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Commandes</h1>
        <div className="flex gap-2">
          {canCreate('order') && (
            <>
              <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                📥 Importer
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleExport('csv')}
                disabled={exporting}
                loading={exporting}
              >
                📤 Exporter CSV
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                loading={exporting}
              >
                📤 Exporter Excel
              </Button>
            </>
          )}
          {canCreate('order') && (
            <Button onClick={() => navigate('/orders/new')}>
              + Nouvelle commande
            </Button>
          )}
        </div>
      </div>

      <Card title="Filtres" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Rechercher"
            placeholder="N° commande, client, téléphone, adresse..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <Select
            label="Statut"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'pending', label: 'En attente' },
              { value: 'assigned', label: 'Assignée' },
              { value: 'picked', label: 'Récupérée' },
              { value: 'delivering', label: 'En livraison' },
              { value: 'delivered', label: 'Livrée' },
              { value: 'returned', label: 'Retournée' },
            ]}
          />

          <Select
            label="Date prédéfinie"
            value={filters.date_filter}
            onChange={(e) => setFilters({ ...filters, date_filter: e.target.value, start_date: '', end_date: '' })}
            options={[
              { value: '', label: 'Toutes les dates' },
              { value: 'today', label: 'Aujourd\'hui' },
              { value: 'yesterday', label: 'Hier' },
              { value: 'last_7_days', label: '7 derniers jours' },
            ]}
          />

          <Input
            label="Date de début"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value, date_filter: '' })}
          />

          <Input
            label="Date de fin"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value, date_filter: '' })}
          />

          <Select
            label="Tri"
            value={filters.sort_by}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
            options={[
              { value: 'newest', label: 'Plus récentes' },
              { value: 'oldest', label: 'Plus anciennes' },
            ]}
          />
        </div>

        <div className="mt-4 flex gap-2">
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
                  <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                  <th className={tailwindClasses.tableHeaderCell}>Client</th>
                  <th className={tailwindClasses.tableHeaderCell}>Téléphone</th>
                  <th className={tailwindClasses.tableHeaderCell}>Adresse</th>
                  <th className={tailwindClasses.tableHeaderCell}>Montant</th>
                  <th className={tailwindClasses.tableHeaderCell}>Frais de livraison</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut</th>
                  <th className={tailwindClasses.tableHeaderCell}>Créé le</th>
                  <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {orders.map((order) => (
                  <tr key={order.uuid}>
                    <td className={tailwindClasses.tableCell}>{order.order_number}</td>
                    <td className={tailwindClasses.tableCell}>{order.customer_name}</td>
                    <td className={tailwindClasses.tableCell}>{order.customer_phone}</td>
                    <td className={tailwindClasses.tableCell}>{order.delivery_address}</td>
                    <td className={tailwindClasses.tableCell}>{formatCurrency(order.order_amount)}</td>
                    <td className={tailwindClasses.tableCell}>{formatCurrency(order?.pricing?.price || 0)}</td>
                    <td className={tailwindClasses.tableCell}>
                      <Badge status={order.status} />
                    </td>
                    <td className={tailwindClasses.tableCell}>{formatDateTime(order.created_at)}</td>
                    <td className={tailwindClasses.tableCell}>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/orders/${order.uuid}`)}
                        >
                          Voir
                        </Button>
                        {canReassignOrder(order) && (
                          <Button
                            variant="outline"
                            onClick={() => handleReassignClick(order)}
                          >
                            Réassigner
                          </Button>
                        )}
                        {canEditOrder() && (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/orders/${order.uuid}/edit`)}
                          >
                            Modifier
                          </Button>
                        )}
                        {canDeleteOrder() && (
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteClick(order)}
                            disabled={deletingOrder === order.uuid}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la commande"
        message={`Êtes-vous sûr de vouloir supprimer la commande ${orderToDelete?.order_number} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        loading={deletingOrder !== null}
      />

      <ImportOrdersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      {orderToReassign && (
        <ReassignOrderModal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setOrderToReassign(null);
          }}
          order={orderToReassign}
          onReassignSuccess={handleReassignSuccess}
        />
      )}
    </div>
  );
}
