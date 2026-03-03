import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import type { WebhookConfig } from '../../services/IntegrationService';

interface WebhookSectionProps {
  config: WebhookConfig | null;
  onSave: (e: React.FormEvent, url: string, enabled: boolean) => Promise<void>;
  saving: boolean;
}

export default function WebhookSection({ config, onSave, saving }: WebhookSectionProps) {
  const [url, setUrl] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (config) {
      setUrl(config.webhook_url || '');
      setEnabled(config.webhook_enabled ?? true);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    onSave(e, url, enabled);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="URL du webhook"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://votre-domaine.com/webhook/order-status"
      />
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="webhook-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-red focus:ring-primary-red"
        />
        <label htmlFor="webhook-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Activer les notifications webhook
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={saving} variant="primary">
          Enregistrer la configuration
        </Button>
      </div>
    </form>
  );
}
