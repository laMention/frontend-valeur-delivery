import { useState, useEffect } from 'react';
import { reconciliationService } from '../../services/ReconciliationService';
import type { ReconciliationStats } from '../../models/Reconciliation';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailwindClasses } from '../../utils/tailwindClasses';

export default function ReconciliationView() {
  const [barcode, setBarcode] = useState('');
  const [scanType, setScanType] = useState<'delivery' | 'return' | 'stocked' | 'not_found'>('delivery');
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadStats();
    loadDiscrepancies();
  }, [date]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await reconciliationService.getStats(date);
      if (result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscrepancies = async () => {
    try {
      const result = await reconciliationService.getDiscrepancies(date);
      if (result.data) {
        setDiscrepancies(result.data);
      }
    } catch (error) {
      console.error('Error loading discrepancies:', error);
    }
  };

  const handleScan = async () => {
    if (!barcode) {
      alert('Veuillez entrer un code-barres');
      return;
    }

    setScanning(true);
    try {
      const result = await reconciliationService.scan({
        barcode_value: barcode,
        scan_type: scanType,
      });
      alert('Scan enregistré avec succès');
      setBarcode('');
      loadStats();
      loadDiscrepancies();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors du scan';
      alert(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <h1 className={tailwindClasses.pageTitle}>Réconciliation</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Scanner un colis">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code-barres
              </label>
              <input
                type="text"
                className={tailwindClasses.input}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScan();
                  }
                }}
                placeholder="Scanner ou saisir le code-barres"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de scan
              </label>
              <select
                className={tailwindClasses.select}
                value={scanType}
                onChange={(e) => setScanType(e.target.value as any)}
              >
                <option value="delivery">Livré</option>
                <option value="return">Retourné</option>
                <option value="stocked">En stock</option>
                <option value="not_found">Non trouvé</option>
              </select>
            </div>

            <Button onClick={handleScan} loading={scanning} variant="primary" className="w-full">
              Enregistrer le scan
            </Button>
          </div>
        </Card>

        <Card title="Statistiques de réconciliation">
          <div className="mb-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Assignées</p>
                <p className="text-2xl font-bold">{stats.assigned}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Livrées</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-gray-600">Retournées</p>
                <p className="text-2xl font-bold">{stats.returned}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">En stock</p>
                <p className="text-2xl font-bold">{stats.stocked}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-xs text-gray-600">Non trouvées</p>
                <p className="text-2xl font-bold">{stats.not_found}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <p className="text-xs text-gray-600">Écarts</p>
                <p className="text-2xl font-bold">{stats.discrepancies}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Aucune statistique disponible</p>
          )}
        </Card>
      </div>

      {discrepancies.length > 0 && (
        <Card title="Écarts détectés">
          <div className="overflow-x-auto">
            <table className={tailwindClasses.table}>
              <thead className={tailwindClasses.tableHeader}>
                <tr>
                  <th className={tailwindClasses.tableHeaderCell}>N° Commande</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut attendu</th>
                  <th className={tailwindClasses.tableHeaderCell}>Statut réel</th>
                  <th className={tailwindClasses.tableHeaderCell}>Type d'écart</th>
                </tr>
              </thead>
              <tbody className={tailwindClasses.tableBody}>
                {discrepancies.map((discrepancy, index) => (
                  <tr key={index}>
                    <td className={tailwindClasses.tableCell}>{discrepancy.order_number || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{discrepancy.expected_status || '-'}</td>
                    <td className={tailwindClasses.tableCell}>{discrepancy.actual_status || '-'}</td>
                    <td className={tailwindClasses.tableCell}>
                      <span className="text-red-600 font-semibold">Écart détecté</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

