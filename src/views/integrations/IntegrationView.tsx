import { useEffect, useState } from 'react';
import { integrationService, type ApiKey } from '../../services/IntegrationService';
import { usePermissions } from '../../hooks/usePermissions';
import { useToastContext } from '../../contexts/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { tailwindClasses } from '../../utils/tailwindClasses';

interface GenerateApiKeyFormProps {
  onGenerate: (marketplaceName: string) => Promise<void>;
  loading: boolean;
}

function GenerateApiKeyForm({ onGenerate, loading }: GenerateApiKeyFormProps) {
  const [marketplaceName, setMarketplaceName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!marketplaceName.trim()) {
      setError('Le nom de la marketplace est obligatoire');
      return;
    }

    await onGenerate(marketplaceName.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom de la marketplace *"
        value={marketplaceName}
        onChange={(e) => {
          setMarketplaceName(e.target.value);
          setError('');
        }}
        placeholder="Ex: WooCommerce, PrestaShop, Shopify, Mon E-commerce..."
        required
        error={error}
      />
      <Button type="submit" loading={loading}>
        Générer une clé API
      </Button>
    </form>
  );
}
import DocumentationSection from './DocumentationSection';

export default function IntegrationView() {
  const { success, error: showError } = useToastContext();
  const { hasPermission } = usePermissions();
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    setLoading(true);
    try {
      const result = await integrationService.getApiKey();
      if (result.success && result.data) {
        setApiKey(result.data);
        // Si le secret en clair existe, l'afficher automatiquement
        if (result.data.api_secret_plain) {
          setShowSecret(true);
        }
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async (marketplaceName: string) => {
    setGenerating(true);
    try {
      const result = await integrationService.generateApiKey(marketplaceName);
      if (result.success && result.data) {
        setApiKey({
          api_key: result.data.api_key,
          api_secret_plain: result.data.api_secret,
          marketplace_name: result.data.marketplace_name,
          created_at: new Date().toISOString(),
        });
        setShowSecret(true);
        success(result.message || 'Clé API générée avec succès');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la génération de la clé API';
      showError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!confirm('Êtes-vous sûr de vouloir régénérer votre clé API ? L\'ancienne clé sera désactivée.')) {
      return;
    }

    setGenerating(true);
    try {
      const result = await integrationService.regenerateApiKey();
      if (result.success && result.data) {
        setApiKey({
          api_key: result.data.api_key,
          api_secret_plain: result.data.api_secret,
          marketplace_name: result.data.marketplace_name,
          created_at: new Date().toISOString(),
        });
        setShowSecret(true);
        success(result.message || 'Clé API régénérée avec succès');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la régénération de la clé API';
      showError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${label} copié avec succès`);
    } catch {
      showError('Erreur lors de la copie');
    }
  };

  const handleHideSecret = async () => {
    try {
      await integrationService.hideSecret();
      setShowSecret(false);
      if (apiKey) {
        setApiKey({ ...apiKey, api_secret_plain: null });
      }
    } catch {
      // Ignore errors when hiding secret
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a la permission de voir les intégrations
  const canViewIntegration = hasPermission('integration.view') || hasPermission('integration.generate_api_key');

  if (!canViewIntegration) {
    return (
      <div>
        <h1 className={tailwindClasses.pageTitle}>Intégration</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous n'avez pas l'autorisation de générer une clé API.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Veuillez contacter l'administrateur pour obtenir cette autorisation.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>Intégration</h1>
      </div>

      <Card title="Clés API">
        {!apiKey ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Générez une clé API pour intégrer votre marketplace (WooCommerce, PrestaShop, Shopify, etc.) avec Valeur Delivery.
            </p>
            <GenerateApiKeyForm onGenerate={handleGenerateApiKey} loading={generating} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avertissement */}
            {apiKey.api_secret_plain && (
              <div className="bg-orange-50 dark:bg-orange-400/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-800 dark:text-orange-400">
                  ⚠️ <strong>Important :</strong> Le secret ne sera affiché qu'une seule fois. Assurez-vous de le copier maintenant.
                </p>
              </div>
            )}

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <Input
                  value={apiKey.api_key}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => handleCopy(apiKey.api_key, 'Clé API')}
                  className="whitespace-nowrap"
                >
                  📋 Copier
                </Button>
              </div>
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Secret
              </label>
              <div className="flex gap-2">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={apiKey.api_secret_plain || '••••••••••••••••••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm"
                />
                {apiKey.api_secret_plain && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowSecret(!showSecret)}
                      className="whitespace-nowrap"
                    >
                      {showSecret ? '🙈 Masquer' : '👁️ Afficher'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCopy(apiKey.api_secret_plain!, 'Secret API')}
                      className="whitespace-nowrap"
                    >
                      📋 Copier
                    </Button>
                  </>
                )}
                {!apiKey.api_secret_plain && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 self-center">
                    Le secret a été masqué. Utilisez la régénération pour obtenir un nouveau secret.
                  </p>
                )}
              </div>
            </div>

            {/* Informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marketplace</p>
                <p className="font-medium">{apiKey.marketplace_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Créée le</p>
                <p className="font-medium">
                  {new Date(apiKey.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {apiKey.last_used_at && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dernière utilisation</p>
                  <p className="font-medium">
                    {new Date(apiKey.last_used_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleRegenerateApiKey}
                loading={generating}
              >
                🔄 Régénérer la clé API
              </Button>
              {apiKey.api_secret_plain && showSecret && (
                <Button
                  variant="outline"
                  onClick={handleHideSecret}
                >
                  Masquer le secret
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Documentation */}
      <Card title="Documentation API" className="mt-6">
        <DocumentationSection apiKey={apiKey?.api_key} />
      </Card>
    </div>
  );
}
