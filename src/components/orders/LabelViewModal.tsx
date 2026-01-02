import { useState, useEffect } from 'react';
import { labelService } from '../../services/LabelService';
import type { Label } from '../../services/LabelService';
import Button from '../common/Button';

interface LabelViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderUuid: string;
  orderNumber: string;
}

export default function LabelViewModal({
  isOpen,
  onClose,
  orderUuid,
  orderNumber,
}: LabelViewModalProps) {
  const [label, setLabel] = useState<Label | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderUuid) {
      loadLabel();
    } else {
      setLabel(null);
      setPdfUrl(null);
      setError(null);
    }
  }, [isOpen, orderUuid]);

  const loadLabel = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await labelService.getByOrder(orderUuid);
      if (result.data && result.data.length > 0) {
        const latestLabel = result.data[0];
        setLabel(latestLabel);
        
        // Télécharger le PDF pour l'affichage
        const blob = await labelService.download(latestLabel.uuid);
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        setError('Aucune étiquette générée pour cette commande');
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'étiquette');
      console.error('Error loading label:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleDownload = () => {
    if (pdfUrl && label) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `etiquette-${orderNumber}.pdf`;
      a.click();
    }
  };

  useEffect(() => {
    // Nettoyer l'URL lors de la fermeture
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Étiquette - {orderNumber}
          </h3>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Chargement de l'étiquette...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col items-center">
              <iframe
                src={pdfUrl}
                className="w-full h-[600px] border border-gray-300 dark:border-gray-600 rounded"
                title="Étiquette PDF"
              />
            </div>
          ) : null}
        </div>

        {pdfUrl && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <Button variant="outline" onClick={handleDownload}>
              Télécharger
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              Imprimer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

