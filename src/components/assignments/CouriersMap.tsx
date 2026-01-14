import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import type { Courier } from '../../services/CourierService';

import iconMoto from '../../assets/icon-moto.png';
import iconVoiture from '../../assets/icon-car.png';
import iconVelo from '../../assets/icon-velo.png';
import iconDefault from '../../assets/icon-moto.png'; // Par défaut, utiliser moto

interface CouriersMapProps {
  couriers: Courier[];
  assignmentCounts?: Record<string, number>;
  onCourierClick?: (courier: Courier) => void;
  selectedCourierId?: string;
  filters?: {
    vehicleType?: 'moto' | 'voiture' | 'velo' | '';
    availability?: 'all' | 'available' | 'delivering' | 'offline';
  };
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
  onCouriersUpdate?: (couriers: Courier[]) => void;
}

export default function CouriersMap({
  couriers,
  assignmentCounts = {},
  onCourierClick,
  selectedCourierId,
  filters = {},
  autoRefresh = true,
  refreshInterval = 10000, // 10 secondes par défaut
  onCouriersUpdate,
}: CouriersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());
  const { isLoaded, isError } = useGoogleMaps();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrer les livreurs selon les filtres
  const filteredCouriers = couriers.filter((courier) => {
    // Filtre par type de véhicule
    if (filters.vehicleType && courier.vehicle_type !== filters.vehicleType) {
      return false;
    }

    // Filtre par disponibilité
    if (filters.availability && filters.availability !== 'all') {
      const assignmentCount = assignmentCounts[courier.id] || 0;
      switch (filters.availability) {
        case 'available':
          if (assignmentCount > 0 || !courier.is_active) return false;
          break;
        case 'delivering':
          if (assignmentCount === 0) return false;
          break;
        case 'offline':
          if (courier.is_active) return false;
          break;
      }
    }

    // Ne montrer que les livreurs avec une position GPS
    return courier.current_location !== null && courier.current_location !== undefined;
  });

  // Retourner l'icône du marqueur selon le type de véhicule
  const getVehicleIcon = (vehicleType: string, isSelected: boolean = false) => {
    const baseSize = isSelected ? 40 : 32;

    // Sélectionner l'image selon le type de véhicule
    // Les imports d'images sont automatiquement convertis en URLs par Vite
    let iconUrl: string;
    switch (vehicleType) {
      case 'moto':
        iconUrl = iconMoto;
        break;
      case 'voiture':
        iconUrl = iconVoiture;
        break;
      case 'velo':
        iconUrl = iconVelo;
        break;
      default:
        iconUrl = iconDefault;
    }

    return {
      url: iconUrl,
      scaledSize: new (window.google.maps as any).Size(baseSize, baseSize),
      anchor: new (window.google.maps as any).Point(baseSize / 2, baseSize / 2),
    };
  };

  // Initialiser la carte
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isError || mapInstanceRef.current) {
      return;
    }

    if (!window.google?.maps?.Map) {
      return;
    }

    // Calculer le centre de la carte basé sur les positions des livreurs
    const calculateCenter = () => {
      const validCouriers = filteredCouriers.filter(
        (c) => c.current_location?.lat && c.current_location?.lng
      );

      if (validCouriers.length === 0) {
        // Centre par défaut (Abidjan, Côte d'Ivoire)
        return { lat: 5.3364, lng: -4.0267 };
      }

      const avgLat =
        validCouriers.reduce((sum, c) => sum + (c.current_location?.lat || 0), 0) /
        validCouriers.length;
      const avgLng =
        validCouriers.reduce((sum, c) => sum + (c.current_location?.lng || 0), 0) /
        validCouriers.length;

      return { lat: avgLat, lng: avgLng };
    };

    const center = calculateCenter();

    // Créer la carte
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: new (window.google.maps as any).LatLng(center.lat, center.lng),
      mapTypeId: (window.google.maps as any).MapTypeId.ROADMAP,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: false,
    });

    mapInstanceRef.current = map;

    // Ajuster le zoom pour inclure tous les livreurs
    if (filteredCouriers.length > 0) {
      const bounds = new (window.google.maps as any).LatLngBounds();
      filteredCouriers.forEach((courier) => {
        if (courier.current_location?.lat && courier.current_location?.lng) {
          bounds.extend(
            new (window.google.maps as any).LatLng(
              courier.current_location.lat,
              courier.current_location.lng
            )
          );
        }
      });
      if (filteredCouriers.length > 1) {
        map.fitBounds(bounds);
      }
    }
  }, [isLoaded, isError]);

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) {
      return;
    }

    const map = mapInstanceRef.current;

    // Supprimer les marqueurs qui n'existent plus
    markersRef.current.forEach((marker, courierId) => {
      if (!filteredCouriers.find((c) => c.id === courierId)) {
        marker.setMap(null);
        markersRef.current.delete(courierId);
        infoWindowsRef.current.get(courierId)?.close();
        infoWindowsRef.current.delete(courierId);
      }
    });

    // Créer ou mettre à jour les marqueurs
    filteredCouriers.forEach((courier) => {
      if (!courier.current_location?.lat || !courier.current_location?.lng) {
        return;
      }

      const position = new (window.google.maps as any).LatLng(
        courier.current_location.lat,
        courier.current_location.lng
      );

      const isSelected = selectedCourierId === courier.id;
      const assignmentCount = assignmentCounts[courier.id] || 0;
      const availabilityStatus =
        !courier.is_active
          ? 'Hors ligne'
          : assignmentCount > 0
          ? 'En livraison'
          : 'Disponible';

      // Créer ou mettre à jour le marqueur
      let marker = markersRef.current.get(courier.id);
      if (!marker) {
        const icon = getVehicleIcon(courier.vehicle_type, isSelected);
        marker = new (window.google.maps as any).Marker({
          position,
          map,
          icon,
          title: `${courier.user?.name || 'N/A'} - ${courier.vehicle_type}`,
          animation: isSelected ? (window.google.maps as any).Animation.BOUNCE : undefined,
        });

        markersRef.current.set(courier.id, marker);

        // Créer l'info window
        const infoWindow = new (window.google.maps as any).InfoWindow({
          content: createInfoWindowContent(courier, assignmentCount, availabilityStatus),
        });

        infoWindowsRef.current.set(courier.id, infoWindow);

        // Gérer les clics sur le marqueur
        marker.addListener('click', () => {
          // Fermer toutes les autres info windows
          infoWindowsRef.current.forEach((iw) => iw.close());
          infoWindow.open(map, marker);
          if (onCourierClick) {
            onCourierClick(courier);
          }
        });
      } else {
        // Mettre à jour la position du marqueur existant
        marker.setPosition(position);
        marker.setIcon(getVehicleIcon(courier.vehicle_type, isSelected));
        marker.setAnimation(isSelected ? (window.google.maps as any).Animation.BOUNCE : null);

        // Mettre à jour le contenu de l'info window
        const infoWindow = infoWindowsRef.current.get(courier.id);
        if (infoWindow) {
          infoWindow.setContent(
            createInfoWindowContent(courier, assignmentCount, availabilityStatus)
          );
        }
      }
    });
  }, [filteredCouriers, selectedCourierId, assignmentCounts, isLoaded, onCourierClick]);

  // Fonction pour créer le contenu de l'info window
  const createInfoWindowContent = (
    courier: Courier,
    assignmentCount: number,
    availabilityStatus: string
  ) => {
    const statusColor =
      availabilityStatus === 'Disponible'
        ? '#10B981'
        : availabilityStatus === 'En livraison'
        ? '#F59E0B'
        : '#EF4444';

    return `
      <div style="min-width: 200px; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1F2937;">
          ${courier.user?.name || 'N/A'}
        </h3>
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; padding: 4px 8px; background: #F3F4F6; border-radius: 4px; font-size: 12px; text-transform: capitalize; margin-right: 4px;">
            ${courier.vehicle_type}
          </span>
          <span style="display: inline-block; padding: 4px 8px; background: ${statusColor}; color: white; border-radius: 4px; font-size: 12px;">
            ${availabilityStatus}
          </span>
        </div>
        <div style="font-size: 14px; color: #4B5563; margin-bottom: 4px;">
          <strong>Commandes en cours:</strong> ${assignmentCount}
        </div>
        ${courier.user?.phone ? `<div style="font-size: 14px; color: #4B5563;">📞 ${courier.user.phone}</div>` : ''}
        ${courier.zones && courier.zones.length > 0
          ? `<div style="font-size: 12px; color: #6B7280; margin-top: 8px;">🗺️ ${courier.zones.map((z: any) => z.name).join(', ')}</div>`
          : ''}
      </div>
    `;
  };

  // Polling pour mettre à jour les positions en temps réel
  useEffect(() => {
    if (!autoRefresh || !onCouriersUpdate) {
      return;
    }

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        // Recharger les livreurs actifs
        const { courierService } = await import('../../services/CourierService');
        const result = await courierService.getActiveCouriers();
        if (result.data) {
          onCouriersUpdate(result.data);
        }
      } catch (error) {
        console.error('Error refreshing couriers:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onCouriersUpdate]);

  if (isError) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-red-600">Erreur lors du chargement de la carte</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />
      {isRefreshing && (
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-3 py-1 rounded shadow text-sm text-gray-600">
          🔄 Mise à jour...
        </div>
      )}
      {filteredCouriers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-75 rounded-lg">
          <p className="text-gray-600">Aucun livreur avec position GPS disponible</p>
        </div>
      )}
    </div>
  );
}
