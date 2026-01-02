import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partnerService } from '../../services/PartnerService';
import Input from '../../components/common/Input';
import AddressInput from '../../components/common/AddressInput';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import UserSelect from '../../components/common/UserSelect';
import { tailwindClasses } from '../../utils/tailwindClasses';

export default function PartnerForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_uuid: '',
    company_name: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (uuid) {
      loadPartner();
    }
  }, [uuid]);

  const loadPartner = async () => {
    setLoading(true);
    try {
      const result = await partnerService.getById(uuid!);
      if (result.data) {
        const partner = result.data;
        setFormData({
          user_uuid: partner.user_uuid,
          company_name: partner.company_name,
          address: partner.address,
        });
      }
    } catch (error) {
      setError('Erreur lors du chargement du partenaire');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = uuid
        ? await partnerService.update(uuid, formData)
        : await partnerService.create(formData);

      if (result.data) {
        navigate('/partners');
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch (error: unknown) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={tailwindClasses.pageTitle}>
          {uuid ? 'Modifier le partenaire' : 'Nouveau partenaire'}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/partners')}>
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

          <UserSelect
            label="Utilisateur (Partenaire) *"
            value={formData.user_uuid}
            onChange={(value) => setFormData({ ...formData, user_uuid: value })}
            roleFilter="partner"
            placeholder="Sélectionner un utilisateur partenaire..."
            required={!uuid}
            disabled={!!uuid}
          />

          <Input
            label="Nom de l'entreprise *"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            required
            className="mt-4"
          />

          <AddressInput
            label="Adresse *"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            onPlaceSelect={(place) => {
              setFormData({
                ...formData,
                address: place.address,
                latitude: place.latitude || null,
                longitude: place.longitude || null,
                city: place.city || '',
              });
            }}
            required
            rows={3}
          />

          <div className="flex gap-4 mt-6">
            <Button type="submit" loading={loading} variant="primary">
              {uuid ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/partners')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
