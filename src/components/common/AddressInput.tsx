import { useEffect, useRef, useState, forwardRef } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { tailwindClasses } from '../../utils/tailwindClasses';

interface AddressInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  onPlaceSelect?: (place: {
    address: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }) => void;
}

const AddressInput = forwardRef<HTMLTextAreaElement, AddressInputProps>(
  ({ label, error, className = '', onPlaceSelect, value, onChange, ...props }, ref) => {
    const autocompleteInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const autocompleteRef = useRef<any>(null);
    const isPlaceSelectedRef = useRef<boolean>(false);
    const { isLoaded, isError } = useGoogleMaps();
    const [address, setAddress] = useState((value as string) || '');

    // Synchroniser l'état local avec la prop value
    useEffect(() => {
      const newValue = (value as string) || '';
      if (newValue !== address) {
        setTimeout(() => setAddress(newValue), 0);
        if (autocompleteInputRef.current) {
          autocompleteInputRef.current.value = newValue;
        }
      }
    }, [value]);

    // Initialiser l'ancienne API Autocomplete
    useEffect(() => {
      if (!isLoaded || !autocompleteInputRef.current || isError) {
        return;
      }

      if (!window.google || !window.google.maps || !window.google.maps.places) {
        return;
      }

      // Vérifier que l'ancienne API Autocomplete est disponible
      if (!window.google.maps.places.Autocomplete) {
        console.error('Autocomplete (ancienne API) non disponible');
        return;
      }

      // Éviter les appels multiples : vérifier si l'autocomplete existe déjà
      if (autocompleteRef.current) {
        return;
      }

      try {
        // S'assurer que tous les champs nécessaires sont demandés (geometry inclut location)
        const autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteInputRef.current,
          {
            // types: ['address'],
            componentRestrictions: { country: 'ci' },
            fields: [
              'formatted_address',
              'geometry', // Inclut geometry.location
              'address_components',
            ],
          }
        );

        autocompleteRef.current = autocomplete;

        // Écouter l'événement place_changed
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place) {
            console.warn('Place non disponible dans place_changed');
            return;
          }

          // Vérifier que l'adresse formatée existe
          if (!place.formatted_address) {
            console.warn('Adresse formatée non disponible');
            return;
          }

          const formattedAddress = place.formatted_address;
          isPlaceSelectedRef.current = true;
          setAddress(formattedAddress);

          if (autocompleteInputRef.current) {
            autocompleteInputRef.current.value = formattedAddress;
          }

          if (textareaRef.current) {
            textareaRef.current.value = formattedAddress;
          }

          // Extraire les coordonnées GPS de manière robuste
          let latitude: number | undefined;
          let longitude: number | undefined;

          if (place.geometry && place.geometry.location) {
            const location = place.geometry.location;

            

            // Gérer les différents formats de location (LatLng peut être un objet ou avoir des méthodes)
            if (typeof location.lat === 'function' && typeof location.lng === 'function') {
              // Format avec méthodes lat() et lng()
              latitude = location.lat();
              longitude = location.lng();
            } else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
              // Format avec propriétés directes
              latitude = location.lat;
              longitude = location.lng;
            } else {
              // Essayer d'accéder aux propriétés directement
              const latValue = (location as any).lat;
              const lngValue = (location as any).lng;
              
              if (typeof latValue === 'number' && typeof lngValue === 'number') {
                latitude = latValue;
                longitude = lngValue;
              } else if (typeof latValue === 'function' && typeof lngValue === 'function') {
                latitude = latValue();
                longitude = lngValue();
              }
            }

            // Valider que les coordonnées sont des nombres valides
            if (latitude !== undefined && longitude !== undefined) {
              latitude = Number(latitude);
              longitude = Number(longitude);
              
              if (isNaN(latitude) || isNaN(longitude)) {
                console.warn('Coordonnées GPS invalides:', { latitude, longitude });
                latitude = undefined;
                longitude = undefined;
              } else if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                console.warn('Coordonnées GPS hors limites:', { latitude, longitude });
                latitude = undefined;
                longitude = undefined;
              }
            }
          }

          // Si les coordonnées ne sont pas disponibles, essayer un géocodage inverse
          if ((!latitude || !longitude) && formattedAddress) {
            console.warn('Coordonnées GPS non disponibles depuis place.geometry.location, tentative de géocodage inverse');
            
            // Effectuer un géocodage inverse en fallback
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { address: formattedAddress },
              (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                  const result = results[0];
                  if (result.geometry && result.geometry.location) {
                    const loc = result.geometry.location;
                    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
                    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
                    
                    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                      // Mettre à jour avec les coordonnées obtenues
                      if (onPlaceSelect) {
                        onPlaceSelect({
                          address: formattedAddress,
                          latitude: lat,
                          longitude: lng,
                          city,
                          country,
                        });
                      }
                      console.log('Coordonnées GPS récupérées via géocodage inverse:', { lat, lng });
                    }
                  }
                } else {
                  console.error('Échec du géocodage inverse:', status);
                }
              }
            );
          }

          // Extraire la ville et le pays
          let city = '';
          let country = '';

          if (place.address_components) {
            place.address_components.forEach((component: {
              types?: string[];
              long_name?: string;
            }) => {
              const types = component.types || [];
              if (types.includes('locality')) {
                city = component.long_name || '';
              }
              if (types.includes('country')) {
                country = component.long_name || '';
              }
            });
          }

          // Appeler le callback onPlaceSelect avec toutes les informations
          if (onPlaceSelect) {
            onPlaceSelect({
              address: formattedAddress,
              latitude,
              longitude,
              city,
              country,
            });
          }

          // Appeler le callback onChange pour mettre à jour le formulaire
          if (onChange) {
            const syntheticEvent = {
              target: { value: formattedAddress },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
          }

          // Log pour le débogage
          if (latitude && longitude) {
            console.log('Adresse sélectionnée avec coordonnées GPS:', {
              address: formattedAddress,
              latitude,
              longitude,
            });
          } else {
            console.warn('Adresse sélectionnée sans coordonnées GPS:', formattedAddress);
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'autocomplete:', error);
      }

      return () => {
        if (autocompleteRef.current) {
          if (window.google?.maps?.event?.clearInstanceListeners) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
        }
      };
    }, [isLoaded, isError, onPlaceSelect, onChange]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setAddress(newValue);
      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = newValue;
      }
      isPlaceSelectedRef.current = false;
      if (onChange) {
        onChange(e);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(e.target.value);
      if (textareaRef.current) {
        textareaRef.current.value = e.target.value;
      }
      isPlaceSelectedRef.current = false;
      console.log('isPlaceSelectedRef', isPlaceSelectedRef.current);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!isPlaceSelectedRef.current && onChange) {
        const syntheticEvent = {
          target: { value: e.target.value },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Input pour Google Maps Autocomplete (positionné au-dessus du textarea) */}
          {isLoaded && !isError && (
            <input
              ref={autocompleteInputRef}
              type="text"
              placeholder="Commencez à taper une adresse..."
              className={`${tailwindClasses.input} absolute top-0 left-0 w-full h-full bg-transparent border-gray-300 focus:outline-none focus:ring-0 z-10 pointer-events-auto`}
              style={{ padding: '0.5rem', minHeight: 'auto' }}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
            />
          )}
          {/* Textarea visible pour la saisie manuelle et l'affichage */}
          <textarea
            ref={(node) => {
              textareaRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
              }
            }}
            value={address}
            onChange={handleTextareaChange}
            className={`${tailwindClasses.textarea} ${error ? 'border-red-500' : ''} ${className} ${isLoaded && !isError ? 'opacity-0 pointer-events-none' : ''}`}
            {...props}
          />
        </div>
        {isError && (
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            L'autocomplétion d'adresse n'est pas disponible. Vous pouvez saisir l'adresse manuellement.
          </p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

AddressInput.displayName = 'AddressInput';

export default AddressInput;
