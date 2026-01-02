import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zoneService } from '../../services/ZoneService';
import type { CreateZoneData, UpdateZoneData } from '../../services/ZoneService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ZoneMapEditor from '../../components/zones/ZoneMapEditor';
import { tailwindClasses } from '../../utils/tailwindClasses';

export default function ZoneForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateZoneData>({
    name: '',
    polygon: [],
  });

  useEffect(() => {
    if (uuid) {
      loadZone();
    }
  }, [uuid]);

  const loadZone = async () => {
    setLoading(true);
    try {
      const result = await zoneService.getById(uuid!);
      if (result.data) {
        const zone = result.data;
        setFormData({
          name: zone.name,
          polygon: zone.polygon || [],
        });
      }
    } catch (error) {
      setError('Erreur lors du chargement de la zone');
      console.error('Error loading zone:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom de la zone est requis');
      setLoading(false);
      return;
    }

    if (!formData.polygon || formData.polygon.length < 3) {
      setError('Le polygone doit contenir au moins 3 points');
      setLoading(false);
      return;
    }

    try {
      if (uuid) {
        const updateData: UpdateZoneData = {
          name: formData.name,
          polygon: formData.polygon,
        };
        await zoneService.update(uuid, updateData);
      } else {
        // S'assurer que le polygone est bien présent et valide
        if (!formData.polygon || formData.polygon.length < 3) {
          setError('Le polygone doit contenir au moins 3 points');
          setLoading(false);
          return;
        }
        
        // Créer un objet avec les données garanties
        const createData: CreateZoneData = {
          name: formData.name.trim(),
          polygon: formData.polygon,
        };
        
        await zoneService.create(createData);
      }
      navigate('/zones');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Erreur lors de la sauvegarde';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: { name: string; lat: number; lng: number }) => {
    // Optionnel : mettre à jour le nom de la zone avec le lieu sélectionné
    if (!formData.name.trim()) {
      setFormData({ ...formData, name: place.name });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/zones')}>
          Retour
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <Input
              label="Nom de la zone *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Cocody, Abidjan Centre, etc."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zone géographique (polygone) *
              </label>
              <ZoneMapEditor
                polygon={formData.polygon}
                onPolygonChange={(polygon) => setFormData({ ...formData, polygon })}
                onPlaceSelect={handlePlaceSelect}
                error={formData.polygon.length < 3 ? 'Le polygone doit contenir au moins 3 points' : undefined}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" loading={loading} variant="primary">
                {uuid ? 'Mettre à jour' : 'Créer la zone'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/zones')}>
                Annuler
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

