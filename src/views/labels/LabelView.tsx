import { useState, useEffect } from 'react';
import { labelService } from '../../services/LabelService';
import { orderService } from '../../services/OrderService';
import type { Label } from '../../services/LabelService';
import type { Order } from '../../models/Order';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { tailwindClasses } from '../../utils/tailwindClasses';
import { formatDateTime } from '../../utils/formatters';
import { useToastContext } from '../../contexts/ToastContext';


export default function LabelView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [labelFormat, setLabelFormat] = useState<'A6' | 'A7' | 'THERMAL'>('A6');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      loadLabels();
    }
  }, [selectedOrder]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await orderService.getAll({ per_page: 100 });
      if (result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLabels = async () => {
    if (!selectedOrder) return;
    
    try {
      const result = await labelService.getByOrder(selectedOrder);
      if (result.data) {
        setLabels(result.data);
      }
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedOrder) {
      showError('Veuillez sélectionner une commande');
      return;
    }

    setGenerating(true);
    try {
      const result = await labelService.generate({
        order_uuid: selectedOrder,
        format: labelFormat,
      });

      if (result.data) {
        success('Étiquette générée avec succès');
        loadLabels();
      }
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la génération de l\'étiquette';
      showError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (labelUuid: string, orderNumber: string) => {
    try {
      const blob = await labelService.download(labelUuid);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquette-${orderNumber}-${labelFormat}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors du téléchargement';
      showError(errorMessage);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Étiquettes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Générer une étiquette">
          <div className="space-y-4">
            <Select
              label="Commande"
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              options={[
                { value: '', label: 'Sélectionner une commande' },
                ...orders.map(order => ({
                  value: order.uuid,
                  label: `${order.order_number} - ${order.customer_name}`
                }))
              ]}
            />

            <Select
              label="Format"
              value={labelFormat}
              onChange={(e) => setLabelFormat(e.target.value as 'A6' | 'A7' | 'THERMAL')}
              options={[
                { value: 'A6', label: 'A6' },
                { value: 'A7', label: 'A7' },
                { value: 'THERMAL', label: 'Thermique' },
              ]}
            />

            <Button
              onClick={handleGenerate}
              loading={generating}
              disabled={!selectedOrder}
              variant="primary"
              className="w-full"
            >
              Générer l'étiquette
            </Button>
          </div>
        </Card>

        <Card title="Informations">
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>Format A6 :</strong> 105 × 148 mm - Standard
            </p>
            <p>
              <strong>Format A7 :</strong> 74 × 105 mm - Compact
            </p>
            <p>
              <strong>Format Thermique :</strong> Pour imprimantes thermiques
            </p>
            <p className="mt-4 text-xs">
              L'étiquette contient : nom client, téléphone, adresse, numéro de commande, code-barres
            </p>
          </div>
        </Card>
      </div>

      {selectedOrder && (
        <Card title="Étiquettes générées">
          {labels.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucune étiquette générée pour cette commande</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tailwindClasses.table}>
                <thead className={tailwindClasses.tableHeader}>
                  <tr>
                    <th className={tailwindClasses.tableHeaderCell}>Format</th>
                    <th className={tailwindClasses.tableHeaderCell}>Générée le</th>
                    <th className={tailwindClasses.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className={tailwindClasses.tableBody}>
                  {labels.map((label) => {
                    const order = orders.find(o => o.uuid === label.order_uuid);
                    return (
                      <tr key={label.uuid}>
                        <td className={tailwindClasses.tableCell}>{label.label_format}</td>
                        <td className={tailwindClasses.tableCell}>{formatDateTime(label.generated_at)}</td>
                        <td className={tailwindClasses.tableCell}>
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(label.uuid, order?.order_number || '')}
                          >
                            Télécharger
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

