/**
 * Calcule la distance et le temps de trajet (itinéraire routier) entre deux points
 * via l'API Google Directions — même logique que Google Maps.
 */

export interface RouteDistanceResult {
  distance_km: number;
  duration_minutes: number;
}

interface DirectionsLeg {
  distance?: { value: number };
  duration?: { value: number };
}

interface DirectionsRouteResult {
  routes?: Array<{ legs?: DirectionsLeg[] }>;
}

declare global {
  interface Window {
    google?: {
      maps: {
        DirectionsService?: new () => {
          route(
            request: { origin: unknown; destination: unknown; travelMode: unknown },
            callback: (result: unknown, status: string) => void
          ): void;
        };
        LatLng?: new (lat: number, lng: number) => unknown;
        TravelMode?: { DRIVING: string };
      };
    };
  }
}

/**
 * Distance et durée d'itinéraire entre deux points (API Directions).
 * Utilise le mode DRIVING (voiture) pour correspondre à Google Maps.
 */
export function getRouteDistanceAndDuration(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<RouteDistanceResult> {
  return new Promise((resolve, reject) => {
    const g = window.google?.maps;
    if (!g?.DirectionsService || !g.LatLng || !g.TravelMode) {
      reject(new Error('Google Maps Directions non disponible'));
      return;
    }
    const service = new g.DirectionsService();
    const originLatLng = new g.LatLng(origin.lat, origin.lng);
    const destLatLng = new g.LatLng(dest.lat, dest.lng);
    service.route(
      {
        origin: originLatLng,
        destination: destLatLng,
        travelMode: g.TravelMode.DRIVING,
      },
      (result: unknown, status: string) => {
        const res = result as DirectionsRouteResult;
        if (status !== 'OK' || !res?.routes?.[0]?.legs?.[0]) {
          reject(new Error(status === 'ZERO_RESULTS' ? 'Aucun itinéraire trouvé' : status || 'Erreur Directions'));
          return;
        }
        const leg = res.routes[0].legs[0];
        const distanceMeters = leg.distance?.value ?? 0;
        const durationSeconds = leg.duration?.value ?? 0;
        resolve({
          distance_km: Math.round((distanceMeters / 1000) * 100) / 100,
          duration_minutes: Math.round(durationSeconds / 60),
        });
      }
    );
  });
}

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Geocode une adresse pour obtenir les coordonnées (lat, lng).
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || !address?.trim()) return null;
  const res = await fetch(
    `${GEOCODE_URL}?address=${encodeURIComponent(address.trim())}&key=${key}&language=fr&region=ci`
  );
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}
