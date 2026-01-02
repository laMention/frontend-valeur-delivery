import { useState, useEffect, useRef } from 'react';
import { zoneService } from '../../services/ZoneService';
import type { Zone } from '../../services/ZoneService';

interface MultiZoneSelectProps {
  label?: string;
  selectedZoneIds: string[];
  primaryZoneId?: string;
  onZonesChange: (zoneIds: string[]) => void;
  onPrimaryZoneChange: (zoneId: string | undefined) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function MultiZoneSelect({
  label = 'Zones de couverture',
  selectedZoneIds,
  primaryZoneId,
  onZonesChange,
  onPrimaryZoneChange,
  required = false,
  className = '',
  disabled = false,
}: MultiZoneSelectProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
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

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleZone = (zoneId: string) => {
    if (disabled) return;

    const isSelected = selectedZoneIds.includes(zoneId);
    let newSelectedIds: string[];

    if (isSelected) {
      newSelectedIds = selectedZoneIds.filter(id => id !== zoneId);
      // Si la zone supprimée était la zone principale, la retirer
      if (primaryZoneId === zoneId) {
        onPrimaryZoneChange(undefined);
      }
    } else {
      newSelectedIds = [...selectedZoneIds, zoneId];
    }

    onZonesChange(newSelectedIds);
  };

  const handlePrimaryZoneChange = (zoneId: string) => {
    if (disabled) return;
    onPrimaryZoneChange(zoneId === primaryZoneId ? undefined : zoneId);
  };

  const selectedZones = zones.filter(z => selectedZoneIds.includes(z.uuid));

  return (
    <div className={`mb-4 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Zones sélectionnées */}
      {selectedZones.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedZones.map(zone => (
            <div
              key={zone.uuid}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                primaryZoneId === zone.uuid
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <span>{zone.name}</span>
              {primaryZoneId === zone.uuid && (
                <span className="text-xs font-semibold">(Principale)</span>
              )}
              <button
                type="button"
                onClick={() => toggleZone(zone.uuid)}
                disabled={disabled}
                className="ml-1 text-gray-500 hover:text-red-500 disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ouverture du dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={`w-full px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-primary-red disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen ? 'ring-2 ring-primary-red border-primary-red' : ''
          }`}
        >
          {loading ? (
            <span className="text-gray-500">Chargement des zones...</span>
          ) : (
            <span className="text-gray-500">
              {selectedZones.length > 0
                ? `${selectedZones.length} zone(s) sélectionnée(s)`
                : 'Sélectionner des zones...'}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Barre de recherche */}
            <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Rechercher une zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>

            {/* Liste des zones */}
            <div className="py-1">
              {filteredZones.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Aucun résultat
                </div>
              ) : (
                filteredZones.map((zone) => {
                  const isSelected = selectedZoneIds.includes(zone.uuid);
                  const isPrimary = primaryZoneId === zone.uuid;

                  return (
                    <div
                      key={zone.uuid}
                      className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleZone(zone.uuid)}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {zone.name}
                          </span>
                        </div>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => handlePrimaryZoneChange(zone.uuid)}
                            disabled={disabled}
                            className={`ml-2 px-2 py-1 text-xs rounded ${
                              isPrimary
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-400'
                            } disabled:opacity-50`}
                            title={isPrimary ? 'Zone principale' : 'Définir comme zone principale'}
                          >
                            {isPrimary ? '⭐ Principale' : 'Définir principale'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message d'aide */}
      {selectedZoneIds.length > 1 && !primaryZoneId && (
        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
          ⚠️ Il est recommandé de définir une zone principale lorsque plusieurs zones sont sélectionnées.
        </p>
      )}

      {selectedZoneIds.length === 0 && required && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Au moins une zone est requise.
        </p>
      )}
    </div>
  );
}

