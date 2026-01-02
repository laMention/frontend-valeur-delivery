import { useEffect, useState } from 'react';
import { zoneService, type Zone } from '../../services/ZoneService';
import Select from './Select';

interface ZoneSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  includeAllZones?: boolean; // Pour afficher "Toutes zones" comme option
}

export default function ZoneSelect({
  label = 'Zone de livraison',
  value,
  onChange,
  required = false,
  error,
  placeholder = 'Sélectionner une zone',
  includeAllZones = false,
}: ZoneSelectProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const result = await zoneService.getAll();
      if (result.data) {
        setZones(result.data);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    ...(includeAllZones ? [{ value: '', label: 'Toutes zones' }] : []),
    { value: '', label: placeholder },
    ...zones.map((zone) => ({
      value: zone.uuid,
      label: zone.name,
    })),
  ];

  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      options={loading ? [{ value: '', label: 'Chargement...' }] : options}
      disabled={loading}
    />
  );
}

