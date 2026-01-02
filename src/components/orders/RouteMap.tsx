import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

interface RouteMapProps {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  polyline: string;
  distanceKm: number;
  durationMinutes: number;
  steps?: Array<{
    instruction: string;
    distance: string;
    duration: string;
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
  }>;
}

export default function RouteMap({
  origin,
  destination,
  polyline,
  distanceKm,
  durationMinutes,
  steps = [],
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const { isLoaded, isError } = useGoogleMaps();
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || isError) {
      return;
    }

    if (mapInstanceRef.current) {
      return; // Déjà initialisé
    }

    try {
      if (!window.google?.maps?.Map) {
        return;
      }

      // Créer la carte
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: new window.google.maps.LatLng(origin.lat, origin.lng),
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      });

      mapInstanceRef.current = map;

      // Créer les marqueurs pour l'origine et la destination
      if (window.google.maps.Marker) {
        // Marqueur origine (vert)
        const originMarker = new window.google.maps.Marker({
          position: new window.google.maps.LatLng(origin.lat, origin.lng),
          map: map,
          title: 'Point de départ',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        // Info window pour l'origine
        const originInfoWindow = new window.google.maps.InfoWindow({
          content: `<div class="p-2"><strong>Point de départ</strong><br/>${origin.address}</div>`,
        });
        originMarker.addListener('click', () => {
          originInfoWindow.open(map, originMarker);
        });

        originMarkerRef.current = originMarker;

        // Marqueur destination (rouge)
        const destinationMarker = new window.google.maps.Marker({
          position: new window.google.maps.LatLng(destination.lat, destination.lng),
          map: map,
          title: 'Destination',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#F44336',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        // Info window pour la destination
        const destinationInfoWindow = new window.google.maps.InfoWindow({
          content: `<div class="p-2"><strong>Destination</strong><br/>${destination.address}</div>`,
        });
        destinationMarker.addListener('click', () => {
          destinationInfoWindow.open(map, destinationMarker);
        });

        destinationMarkerRef.current = destinationMarker;
      }

      // Afficher le polyline de l'itinéraire
      if (polyline) {
        try {
          // Décoder le polyline et afficher l'itinéraire
          // Utiliser geometry.encoding si disponible, sinon utiliser une fonction de décodage simple
          let decodedPath: any[] = [];
          
          if (window.google.maps.geometry?.encoding) {
            decodedPath = window.google.maps.geometry.encoding.decodePath(polyline);
          } else {
            // Décodage simple du polyline (algorithme Google)
            let index = 0;
            let lat = 0;
            let lng = 0;
            
            while (index < polyline.length) {
              let b;
              let shift = 0;
              let result = 0;
              do {
                b = polyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
              } while (b >= 0x20);
              const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
              lat += dlat;

              shift = 0;
              result = 0;
              do {
                b = polyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
              } while (b >= 0x20);
              const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
              lng += dlng;

              decodedPath.push(new window.google.maps.LatLng(lat * 1e-5, lng * 1e-5));
            }
          }
          
          if (decodedPath.length > 0) {
            const routePolyline = new window.google.maps.Polyline({
              path: decodedPath,
              geodesic: true,
              strokeColor: '#4285F4',
              strokeOpacity: 1.0,
              strokeWeight: 4,
            });

            routePolyline.setMap(map);

            // Ajuster la vue pour afficher tout l'itinéraire
            if (window.google.maps.LatLngBounds) {
              const bounds = new window.google.maps.LatLngBounds();
              decodedPath.forEach((point) => {
                bounds.extend(point);
              });
              // Ajouter aussi les marqueurs dans les bounds
              bounds.extend(new window.google.maps.LatLng(origin.lat, origin.lng));
              bounds.extend(new window.google.maps.LatLng(destination.lat, destination.lng));
              map.fitBounds(bounds);
            }
          }
        } catch (error) {
          console.error('Erreur lors de l\'affichage du polyline:', error);
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }

    return () => {
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
        originMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, isError, origin, destination, polyline]);

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        Erreur lors du chargement de Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
        Chargement de la carte...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informations de l'itinéraire */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {distanceKm.toFixed(2)} km
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Durée estimée</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {durationMinutes} min
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Itinéraire routier
          </p>
        </div>
      </div>

      {/* Carte */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Étapes de l'itinéraire (optionnel) */}
      {steps.length > 0 && (
        <div>
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            {showSteps ? 'Masquer' : 'Afficher'} les étapes de l'itinéraire ({steps.length})
          </button>
          {showSteps && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{step.instruction}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.distance} • {step.duration}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

