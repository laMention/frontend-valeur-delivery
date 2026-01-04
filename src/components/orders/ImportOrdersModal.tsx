import { useState } from 'react';
import { orderService } from '../../services/OrderService';
import Button from '../common/Button';
import { useToastContext } from '../../contexts/ToastContext';

interface ImportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportOrdersModal({ isOpen, onClose, onSuccess }: ImportOrdersModalProps) {
  const { success: showSuccess, error: showError } = useToastContext();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ line: number; message: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        showError('Format de fichier invalide. Veuillez sélectionner un fichier CSV ou Excel.');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        showError('Le fichier est trop volumineux. Taille maximale : 10 Mo.');
        return;
      }

      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    setDownloadingTemplate(true);
    try {
      await orderService.downloadTemplate(format);
      showSuccess(`Modèle ${format.toUpperCase()} téléchargé avec succès`);
    } catch (error) {
      showError('Erreur lors du téléchargement du modèle');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      showError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const result = await orderService.import(file);
      
      if (result.success) {
        setImportResult(result.data);
        
        if (result.data.failed === 0) {
          showSuccess(result.message);
          setTimeout(() => {
            onSuccess();
            onClose();
            setFile(null);
            setImportResult(null);
          }, 2000);
        } else {
          showError(`${result.data.success} commande(s) créée(s), ${result.data.failed} échec(s)`);
        }
      } else {
        showError(result.message || 'Erreur lors de l\'import');
      }
    } catch (error: unknown) {
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de l\'import du fichier';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Importer des commandes</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Télécharger le modèle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Télécharger le modèle
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Téléchargez le modèle CSV ou Excel pour connaître le format attendu.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleDownloadTemplate('csv')}
                  disabled={downloadingTemplate}
                  loading={downloadingTemplate}
                >
                  Télécharger CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  disabled={downloadingTemplate}
                  loading={downloadingTemplate}
                >
                  Télécharger Excel
                </Button>
              </div>
            </div>

            {/* Upload du fichier */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Sélectionner le fichier à importer
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-red file:text-white
                    hover:file:bg-red-800
                    cursor-pointer"
                  disabled={loading}
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Fichier sélectionné : <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} Ko)
                  </p>
                )}
              </div>
            </div>

            {/* Résultats de l'import */}
            {importResult && (
              <div className={`p-4 rounded-lg ${importResult.failed === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                <h4 className="font-semibold mb-2">
                  Résultats de l'import
                </h4>
                <p className="text-sm mb-2">
                  <strong>{importResult.success}</strong> commande(s) créée(s)
                  {importResult.failed > 0 && (
                    <>, <strong>{importResult.failed}</strong> échec(s)</>
                  )}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2">Erreurs :</p>
                    <div className="max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <p key={index} className="text-xs text-red-600 dark:text-red-400">
                          Ligne {error.line} : {error.message}
                        </p>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-gray-500 mt-1">
                          ... et {importResult.errors.length - 10} autre(s) erreur(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                loading={loading}
                disabled={!file || loading}
              >
                Lancer l'import
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

