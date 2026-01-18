import { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import type { Courier } from '../../services/CourierService';
import { assignmentService } from '../../services/AssignmentService';
import type { DeliveryAssignment } from '../../services/AssignmentService';
import type { Order } from '../../models/Order';

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
  const destinationMarkersRef = useRef<Map<string, any>>(new Map());
  const directionsRenderersRef = useRef<Map<string, any>>(new Map());
  const geocoderRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const { isLoaded, isError } = useGoogleMaps();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deliveringOrders, setDeliveringOrders] = useState<Map<string, { assignment: DeliveryAssignment; order: Order; destinationCoords?: { lat: number; lng: number } }>>(new Map());
  const [routeData, setRouteData] = useState<Map<string, { distance: string; duration: string }>>(new Map());

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

  // Fonction pour créer le contenu de l'info window
  const createInfoWindowContent = useCallback((
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

    // Récupérer les commandes en cours de livraison pour ce livreur
    const deliveringData = deliveringOrders.get(courier.id);
    const routeInfo = deliveringData ? routeData.get(`${courier.id}|${deliveringData.order.uuid}`) : null;

    let orderInfoHtml = '';
    if (deliveringData && deliveringData.order && deliveringData.order.status === 'delivering') {
      const order = deliveringData.order;
      const formattedAmount = order.total_amount 
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(order.total_amount)
        : 'N/A';
      
      orderInfoHtml = `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: #1F2937;">
              📦 Commande en cours de livraison
            </h4>
            <span style="display: inline-block; padding: 2px 6px; background: #F59E0B; color: white; border-radius: 4px; font-size: 10px; font-weight: bold;">
              DELIVERING
            </span>
          </div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">
            <strong>N° Commande:</strong> ${order.order_number || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">
            <strong>Statut:</strong> <span style="color: #F59E0B; font-weight: bold;">En livraison</span>
          </div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">
            <strong>Client:</strong> ${order.customer_name || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">
            <strong>Adresse de livraison:</strong> ${order.delivery_address || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">
            <strong>Montant:</strong> <span style="font-weight: bold; color: #059669;">${formattedAmount}</span>
          </div>
          ${routeInfo ? `
            <div style="margin-top: 8px; padding: 8px; background: #EFF6FF; border-radius: 4px; border-left: 3px solid #3B82F6;">
              <div style="font-size: 12px; color: #1E40AF; margin-bottom: 4px; font-weight: 600;">
                📍 Distance: ${routeInfo.distance}
              </div>
              <div style="font-size: 12px; color: #1E40AF; font-weight: 600;">
                ⏱️ Temps estimé: ${routeInfo.duration}
              </div>
            </div>
          ` : `
            <div style="margin-top: 8px; padding: 6px; background: #FEF3C7; border-radius: 4px; font-size: 11px; color: #92400E;">
              ⏳ Calcul de l'itinéraire en cours...
            </div>
          `}
        </div>
      `;
    }

    return `
      <div style="min-width: 250px; padding: 8px;">
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
        ${orderInfoHtml}
      </div>
    `;
  }, [deliveringOrders, routeData]);

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

    // Initialiser le géocodeur et le service de directions
    if ((window.google?.maps as any)?.Geocoder) {
      geocoderRef.current = new ((window.google.maps as any).Geocoder)();
    }
    if ((window.google?.maps as any)?.DirectionsService) {
      directionsServiceRef.current = new ((window.google.maps as any).DirectionsService)();
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [filteredCouriers, selectedCourierId, assignmentCounts, isLoaded, onCourierClick, deliveringOrders, routeData, createInfoWindowContent]);

  // Récupérer les commandes en cours de livraison
  useEffect(() => {
    const loadDeliveringOrders = async () => {
      try {
        // Récupérer directement les commandes avec status = 'delivering'
        const { orderService } = await import('../../services/OrderService');
        const ordersResult = await orderService.getAll({ status: 'delivering', per_page: 100 });
        
        const deliveringMap = new Map();
        
        // Pour chaque commande en livraison, récupérer son assignment pour obtenir le courier
        if (ordersResult.data && ordersResult.data.length > 0) {
          for (const order of ordersResult.data) {
            try {
              const assignmentResult = await assignmentService.getByOrder(order.uuid);
              if (assignmentResult.data && assignmentResult.data.length > 0) {
                // Prendre la première assignment active
                const assignment = assignmentResult.data.find((a: DeliveryAssignment) => 
                  a.assignment_status !== 'completed' && a.assignment_status !== 'canceled'
                ) || assignmentResult.data[0];
                
                if (assignment && assignment.courier_uuid) {
                  // Conserver les coordonnées déjà géocodées si elles existent
                  const existingData = deliveringOrders.get(assignment.courier_uuid);
                  deliveringMap.set(assignment.courier_uuid, {
                    assignment,
                    order: order,
                    destinationCoords: existingData?.destinationCoords,
                  });
                }
              }
            } catch {
              // Ignorer les erreurs pour les commandes sans assignment
              console.debug('No assignment found for order:', order.uuid);
            }
          }
        }
        
        setDeliveringOrders(deliveringMap);
      } catch (error) {
        console.error('Error loading delivering orders:', error);
      }
    };

    if (isLoaded) {
      loadDeliveringOrders();
    }
  }, [isLoaded]);

  // Géocoder les adresses de livraison
  useEffect(() => {
    if (!isLoaded || !geocoderRef.current || deliveringOrders.size === 0) {
      return;
    }

    const geocodeAddresses = async () => {
      const updatedOrders = new Map(deliveringOrders);

      for (const [courierId, data] of updatedOrders.entries()) {
        if (data.destinationCoords) {
          continue; // Déjà géocodé
        }

        if (data.order.delivery_address) {
          geocoderRef.current.geocode(
            { address: data.order.delivery_address },
            (results: any[], status: string) => {
              if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                updatedOrders.set(courierId, {
                  ...data,
                  destinationCoords: {
                    lat: location.lat(),
                    lng: location.lng(),
                  },
                });
                setDeliveringOrders(new Map(updatedOrders));
              }
            }
          );
        }
      }
    };

    geocodeAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, deliveringOrders.size]);

  // Fonction pour calculer l'itinéraire
  const calculateRoute = useCallback(
    (courier: Courier, data: { assignment: DeliveryAssignment; order: Order; destinationCoords?: { lat: number; lng: number } }, key: string, renderer: any) => {
      if (!directionsServiceRef.current || !courier.current_location || !data.destinationCoords) {
        return;
      }

      const request = {
        origin: new ((window.google.maps as any).LatLng)(
          courier.current_location.lat,
          courier.current_location.lng
        ),
        destination: new ((window.google.maps as any).LatLng)(
          data.destinationCoords.lat,
          data.destinationCoords.lng
        ),
        travelMode: ((window.google.maps as any).TravelMode).DRIVING,
      };

      directionsServiceRef.current.route(request, (result: any, status: string) => {
        if (status === 'OK' && result) {
          renderer.setDirections(result);

          // Extraire la distance et la durée
          const route = result.routes[0];
          if (route && route.legs && route.legs[0]) {
            const leg = route.legs[0];
            setRouteData((prev) => {
              const updated = new Map(prev);
              updated.set(key, {
                distance: leg.distance.text,
                duration: leg.duration.text,
              });
              return updated;
            });
          }
        } else {
          console.error('Directions request failed:', status);
        }
      });
    },
    []
  );

  // Calculer et afficher les itinéraires
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !directionsServiceRef.current || deliveringOrders.size === 0) {
      return;
    }

    const map = mapInstanceRef.current;

    // Supprimer les itinéraires qui n'existent plus
    directionsRenderersRef.current.forEach((renderer, key) => {
      const [courierId, orderId] = key.split('|');
      const orderData = deliveringOrders.get(courierId);
      if (!orderData || orderData.order.uuid !== orderId) {
        renderer.setMap(null);
        directionsRenderersRef.current.delete(key);
        destinationMarkersRef.current.get(key)?.setMap(null);
        destinationMarkersRef.current.delete(key);
      }
    });

    // Calculer les itinéraires pour chaque commande en cours de livraison
    deliveringOrders.forEach((data, courierId) => {
      const courier = couriers.find((c) => c.id === courierId);
      if (!courier || !courier.current_location || !data.destinationCoords) {
        return;
      }

      const key = `${courierId}|${data.order.uuid}`;

      // Vérifier si l'itinéraire existe déjà
      if (directionsRenderersRef.current.has(key)) {
        // Mettre à jour l'itinéraire existant si la position du livreur a changé
        const renderer = directionsRenderersRef.current.get(key);
        calculateRoute(courier, data, key, renderer);
        return;
      }

      // Créer un nouveau renderer
      const renderer = new ((window.google.maps as any).DirectionsRenderer)({
        map,
        suppressMarkers: true, // On gère nos propres marqueurs
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });

      directionsRenderersRef.current.set(key, renderer);

      // Créer le marqueur de destination
      const destinationMarker = new ((window.google.maps as any).Marker)({
        position: new ((window.google.maps as any).LatLng)(
          data.destinationCoords.lat,
          data.destinationCoords.lng
        ),
        map,
        icon: {
          path: ((window.google.maps as any).SymbolPath).CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: `Destination: ${data.order.delivery_address}`,
      });

      destinationMarkersRef.current.set(key, destinationMarker);

      // Calculer l'itinéraire
      calculateRoute(courier, data, key, renderer);
    });
  }, [isLoaded, deliveringOrders, couriers, calculateRoute]);


  // Polling pour mettre à jour les positions en temps réel et recalculer les itinéraires
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

        // Recharger les commandes en cours de livraison
        const { orderService } = await import('../../services/OrderService');
        const ordersResult = await orderService.getAll({ status: 'delivering', per_page: 100 });
        
        const deliveringMap = new Map();
        
        // Pour chaque commande en livraison, récupérer son assignment pour obtenir le courier
        if (ordersResult.data && ordersResult.data.length > 0) {
          for (const order of ordersResult.data) {
            try {
              const assignmentResult = await assignmentService.getByOrder(order.uuid);
              if (assignmentResult.data && assignmentResult.data.length > 0) {
                const assignment = assignmentResult.data.find((a: DeliveryAssignment) => 
                  a.assignment_status !== 'completed' && a.assignment_status !== 'canceled'
                ) || assignmentResult.data[0];
                
                if (assignment && assignment.courier_uuid) {
                  // Conserver les coordonnées déjà géocodées
                  const existingData = deliveringOrders.get(assignment.courier_uuid);
                  deliveringMap.set(assignment.courier_uuid, {
                    assignment,
                    order: order,
                    destinationCoords: existingData?.destinationCoords,
                  });
                }
              }
            } catch {
              console.debug('No assignment found for order:', order.uuid);
            }
          }
        }
        
        setDeliveringOrders(deliveringMap);

        // Recalculer les itinéraires pour les positions mises à jour
        if (directionsServiceRef.current && mapInstanceRef.current && deliveringOrders.size > 0) {
          deliveringOrders.forEach((data, courierId) => {
            const courier = result.data?.find((c: Courier) => c.id === courierId);
            if (courier && courier.current_location && data.destinationCoords) {
              const key = `${courierId}|${data.order.uuid}`;
              const renderer = directionsRenderersRef.current.get(key);
              if (renderer) {
                calculateRoute(courier, data, key, renderer);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error refreshing couriers:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
