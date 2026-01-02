import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

interface ZoneMapEditorProps {
  polygon: Array<{ lat: number; lng: number }>;
  onPolygonChange: (polygon: Array<{ lat: number; lng: number }>) => void;
  onPlaceSelect?: (place: {
    name: string;
    lat: number;
    lng: number;
  }) => void;
  error?: string;
}

export default function ZoneMapEditor({
  polygon,
  onPolygonChange,
  onPlaceSelect,
  error,
}: ZoneMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const polygonInstanceRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const { isLoaded, isError } = useGoogleMaps();
  const [searchPlace, setSearchPlace] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  // Vérifier que drawing est disponible (chargé via useGoogleMaps)
  const isDrawingAvailable = isLoaded && !isError && window.google?.maps?.drawing?.DrawingManager;

  // Initialiser la carte (une seule fois)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isError) {
      return;
    }

    // Éviter les initialisations multiples
    if (mapInstanceRef.current) {
      return;
    }

    // Vérifier que toutes les bibliothèques sont chargées
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps API non complètement chargée');
      return;
    }

    // Vérifier que le conteneur DOM est monté
    if (!mapRef.current) {
      return;
    }

    try {
      // Créer la carte centrée sur Abidjan, Côte d'Ivoire
      const defaultCenter = { lat: 5.3600, lng: -4.0083 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
      });

      mapInstanceRef.current = map;

      // Initialiser le gestionnaire de dessin si drawing est disponible
      if (isDrawingAvailable && window.google.maps.drawing && window.google.maps.drawing.DrawingManager) {
        // Éviter les initialisations multiples du drawing manager
        if (!drawingManagerRef.current) {
          const drawingManager = new window.google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
              position: window.google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
              fillColor: '#4285F4',
              fillOpacity: 0.3,
              strokeWeight: 2,
              strokeColor: '#4285F4',
              clickable: false,
              editable: true,
              zIndex: 1,
            },
          });

          drawingManager.setMap(map);
          drawingManagerRef.current = drawingManager;

          // Écouter la fin du dessin d'un polygone
          if (window.google.maps.event) {
            window.google.maps.event.addListener(
              drawingManager,
              'polygoncomplete',
              (polygon: any) => {
                const path = polygon.getPath();
                const points: Array<{ lat: number; lng: number }> = [];
                
                path.forEach((latLng: any) => {
                  points.push({
                    lat: latLng.lat(),
                    lng: latLng.lng(),
                  });
                });

                // Supprimer le dernier point si c'est une copie du premier (fermeture du polygone)
                if (points.length > 0 && points[0].lat === points[points.length - 1].lat && 
                    points[0].lng === points[points.length - 1].lng) {
                  points.pop();
                }

                onPolygonChange(points);
                polygonInstanceRef.current = polygon;

                // Écouter les modifications du polygone
                const updateHandler = () => {
                  const path = polygon.getPath();
                  const points: Array<{ lat: number; lng: number }> = [];
                  
                  path.forEach((latLng: any) => {
                    points.push({
                      lat: latLng.lat(),
                      lng: latLng.lng(),
                    });
                  });

                  if (points.length > 0 && points[0].lat === points[points.length - 1].lat && 
                      points[0].lng === points[points.length - 1].lng) {
                    points.pop();
                  }

                  onPolygonChange(points);
                };

                polygon.getPath().addListener('set_at', updateHandler);
                polygon.getPath().addListener('insert_at', updateHandler);
                polygon.getPath().addListener('remove_at', updateHandler);
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte Google Maps:', error);
    }

    return () => {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, isError, isDrawingAvailable, onPolygonChange]);

  // Mettre à jour le polygone affiché quand il change
  useEffect(() => {
    if (mapInstanceRef.current && polygon && polygon.length > 0) {
      // Supprimer l'ancien polygone s'il existe
      if (polygonInstanceRef.current) {
        polygonInstanceRef.current.setMap(null);
      }

      if (polygon.length < 3) {
        return;
      }

      if (!window.google?.maps?.LatLng || !window.google?.maps?.Polygon) {
        return;
      }

      // Créer le polygone
      const polygonPath = polygon.map((p) => new window.google.maps.LatLng(p.lat, p.lng));
      
      const newPolygon = new window.google.maps.Polygon({
        paths: polygonPath,
        fillColor: '#4285F4',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#4285F4',
        editable: true,
        draggable: false,
      });

      newPolygon.setMap(mapInstanceRef.current);
      polygonInstanceRef.current = newPolygon;

      // Ajuster la vue pour afficher tout le polygone
      if (window.google.maps.LatLngBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        polygon.forEach((point) => {
          bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
        });
        mapInstanceRef.current.fitBounds(bounds);
      }

      // Écouter les modifications
      const updateHandler = () => {
        const path = newPolygon.getPath();
        const points: Array<{ lat: number; lng: number }> = [];
        
        path.forEach((latLng: any) => {
          points.push({
            lat: latLng.lat(),
            lng: latLng.lng(),
          });
        });

        if (points.length > 0 && points[0].lat === points[points.length - 1].lat && 
            points[0].lng === points[points.length - 1].lng) {
          points.pop();
        }

        onPolygonChange(points);
      };

      newPolygon.getPath().addListener('set_at', updateHandler);
      newPolygon.getPath().addListener('insert_at', updateHandler);
      newPolygon.getPath().addListener('remove_at', updateHandler);
    } else if (mapInstanceRef.current && polygon && polygon.length === 0 && polygonInstanceRef.current) {
      // Si le polygone est vidé, le retirer de la carte
      polygonInstanceRef.current.setMap(null);
      polygonInstanceRef.current = null;
    }
  }, [polygon, onPolygonChange]);

  // Initialiser l'autocomplete pour la recherche de lieu (ancienne API uniquement)
  useEffect(() => {
    if (!isLoaded || !autocompleteInputRef.current || isError) {
      return;
    }

    // Attendre que la carte soit initialisée
    if (!mapInstanceRef.current) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps Places API non disponible');
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
      // Utiliser l'ancienne API Autocomplete avec types améliorés pour villes, communes, quartiers
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          // Permettre villes, communes, quartiers et autres zones géographiques
          types: ['geocode'],
          componentRestrictions: { country: 'ci' },
          // Inclure viewport pour générer automatiquement le polygone
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.geometry?.location && mapInstanceRef.current) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          // Récupérer la valeur complète du lieu sélectionné
          const placeName = place.name || place.formatted_address || '';
          
          // Mettre à jour l'état React avec la valeur complète
          if (placeName) {
            setSearchPlace(placeName);
            // S'assurer que l'input affiche aussi la valeur complète
            if (autocompleteInputRef.current) {
              autocompleteInputRef.current.value = placeName;
            }
          }

          // Centrer la carte sur le lieu sélectionné
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(13);

          // Générer automatiquement le polygone à partir du viewport ou bounds
          let generatedPolygon: Array<{ lat: number; lng: number }> = [];

          if (place.geometry.viewport) {
            // Utiliser viewport pour créer un polygone rectangulaire
            const viewport = place.geometry.viewport;
            const ne = viewport.getNorthEast();
            const sw = viewport.getSouthWest();

            // Créer un rectangle avec 4 points (coin NE, SE, SW, NW)
            generatedPolygon = [
              { lat: ne.lat(), lng: ne.lng() }, // Nord-Est
              { lat: ne.lat(), lng: sw.lng() }, // Nord-Ouest
              { lat: sw.lat(), lng: sw.lng() }, // Sud-Ouest
              { lat: sw.lat(), lng: ne.lng() }, // Sud-Est
            ];
          } else if (place.geometry.bounds) {
            // Fallback sur bounds si viewport n'est pas disponible
            const bounds = place.geometry.bounds;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            generatedPolygon = [
              { lat: ne.lat(), lng: ne.lng() },
              { lat: ne.lat(), lng: sw.lng() },
              { lat: sw.lat(), lng: sw.lng() },
              { lat: sw.lat(), lng: ne.lng() },
            ];
          } else {
            // Si ni viewport ni bounds, créer un petit carré autour du point central
            const offset = 0.01; // ~1km
            generatedPolygon = [
              { lat: lat + offset, lng: lng + offset },
              { lat: lat + offset, lng: lng - offset },
              { lat: lat - offset, lng: lng - offset },
              { lat: lat - offset, lng: lng + offset },
            ];
          }

          // Générer automatiquement le polygone
          if (generatedPolygon.length >= 3) {
            onPolygonChange(generatedPolygon);
            
            // Ajuster la vue pour afficher tout le polygone
            if (window.google.maps.LatLngBounds) {
              const bounds = new window.google.maps.LatLngBounds();
              generatedPolygon.forEach((point) => {
                bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
              });
              mapInstanceRef.current.fitBounds(bounds);
            }
          }

          if (onPlaceSelect) {
            onPlaceSelect({
              name: place.name || place.formatted_address || '',
              lat,
              lng,
            });
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event?.clearInstanceListeners) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, isError, onPlaceSelect]);


  const clearPolygon = () => {
    if (polygonInstanceRef.current) {
      polygonInstanceRef.current.setMap(null);
      polygonInstanceRef.current = null;
    }
    onPolygonChange([]);
  };

  const toggleDrawing = () => {
    if (!drawingManagerRef.current || !isDrawingAvailable) return;
    
    if (isDrawing) {
      drawingManagerRef.current.setDrawingMode(null);
      setIsDrawing(false);
    } else {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      setIsDrawing(true);
    }
  };

  if (isError) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        Erreur de chargement de Google Maps. Veuillez vérifier votre clé API.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center">
        Chargement de Google Maps...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rechercher un lieu (ville, commune, quartier) *
        </label>
        <input
          ref={autocompleteInputRef}
          type="text"
          value={searchPlace}
          onChange={(e) => setSearchPlace(e.target.value)}
          placeholder="Ex: Cocody, Abidjan, Adzopé, Yopougon..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          La zone sera générée automatiquement après sélection du lieu
        </p>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={toggleDrawing}
          className={`px-4 py-2 rounded text-sm font-medium ${
            isDrawing
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isDrawing ? 'Arrêter le dessin' : 'Dessiner un polygone'}
        </button>
        {polygon.length > 0 && (
          <button
            type="button"
            onClick={clearPolygon}
            className="px-4 py-2 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            Effacer le polygone
          </button>
        )}
      </div>

      <div
        ref={mapRef}
        className="w-full h-96 border border-gray-300 rounded"
        style={{ minHeight: '400px' }}
      />

      {polygon.length > 0 && (
        <div className="text-sm text-gray-600">
          Polygone défini avec {polygon.length} points
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="text-xs text-gray-500">
        <p>Instructions :</p>
        <ul className="list-disc list-inside mt-1">
          <li><strong>Méthode rapide :</strong> Recherchez une ville, commune ou quartier, puis sélectionnez-le. La zone sera générée automatiquement.</li>
          <li><strong>Méthode manuelle :</strong> Cliquez sur "Dessiner un polygone" pour créer ou modifier la zone manuellement</li>
          <li>Vous pouvez modifier le polygone généré en déplaçant les points</li>
          <li>Double-cliquez pour terminer le dessin manuel</li>
        </ul>
      </div>
    </div>
  );
}

