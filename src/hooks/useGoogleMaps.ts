import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    google: {
      maps: {
        Map?: new (element: HTMLElement, options?: any) => any;
        places?: {
          Autocomplete?: new (input: HTMLInputElement, options?: any) => any;
        };
        drawing?: {
          DrawingManager?: new (options?: any) => any;
          OverlayType?: {
            POLYGON?: string;
          };
        };
      };
    };
  }
}

/**
 * Hook pour charger et vérifier la disponibilité de Google Maps JavaScript API
 * CENTRALISE LE CHARGEMENT UNIQUE DE GOOGLE MAPS DANS TOUTE L'APPLICATION
 * 
 * @returns { isLoaded: boolean, isError: boolean }
 * - isLoaded: true si l'API est complètement chargée et prête à l'emploi
 * - isError: true si une erreur s'est produite lors du chargement
 */
export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const loadingStateRef = useRef<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Fonction pour vérifier si Google Maps est complètement chargé
    // Vérifie Autocomplete (places) et DrawingManager (drawing)
    const checkGoogleMapsLoaded = (): boolean => {
      return !!(
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        window.google.maps.places.Autocomplete &&
        window.google.maps.drawing &&
        window.google.maps.drawing.DrawingManager &&
        typeof window.google.maps.Map === 'function'
      );
    };

    // Si déjà chargé, retourner immédiatement
    if (checkGoogleMapsLoaded()) {
      setTimeout(() => {
        setIsLoaded(true);
        loadingStateRef.current = 'loaded';
        scriptLoadedRef.current = true;
      }, 0);
      return;
    }

    // Si déjà en erreur, ne pas réessayer
    if (loadingStateRef.current === 'error') {
      return;
    }

    // Si déjà en cours de chargement, attendre
    if (loadingStateRef.current === 'loading') {
      const checkInterval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
          setIsLoaded(true);
          loadingStateRef.current = 'loaded';
          scriptLoadedRef.current = true;
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!checkGoogleMapsLoaded()) {
          setIsError(true);
          loadingStateRef.current = 'error';
          console.error('Timeout lors de l\'attente du chargement de Google Maps');
        }
      }, 15000);

      return () => {
        clearInterval(checkInterval);
      };
    }

    // Récupérer la clé API depuis les variables d'environnement
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY n\'est pas définie');
      setTimeout(() => {
        setIsError(true);
        loadingStateRef.current = 'error';
      }, 0);
      return;
    }

    // Vérifier si le script est déjà présent dans le DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
    
    if (existingScript) {
      // Le script existe déjà, attendre qu'il se charge
      loadingStateRef.current = 'loading';
      
      // Polling pour vérifier quand l'API sera disponible
      const checkInterval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
          setIsLoaded(true);
          loadingStateRef.current = 'loaded';
          scriptLoadedRef.current = true;
          clearInterval(checkInterval);
        }
      }, 100);

      // Timeout après 15 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!checkGoogleMapsLoaded()) {
          setIsError(true);
          loadingStateRef.current = 'error';
          console.error('Timeout lors de l\'attente du chargement de Google Maps');
        }
      }, 15000);

      return () => {
        clearInterval(checkInterval);
      };
    }

    // Créer et charger le script Google Maps UNE SEULE FOIS
    // IMPORTANT : Charger les bibliothèques 'places' ET 'drawing' en une seule fois
    // Cela évite l'erreur "included multiple times"
    loadingStateRef.current = 'loading';
    scriptLoadedRef.current = true;
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places,drawing&language=fr&region=CI`;
    
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Polling pour vérifier quand l'API sera disponible
      // Important : attendre que Autocomplete ET DrawingManager soient disponibles
      const checkInterval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
          setIsLoaded(true);
          loadingStateRef.current = 'loaded';
          clearInterval(checkInterval);
        }
      }, 100);

      // Timeout après 15 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!checkGoogleMapsLoaded()) {
          setIsError(true);
          loadingStateRef.current = 'error';
          console.error('Timeout lors de l\'initialisation de Google Maps. Autocomplete ou DrawingManager non disponible.');
        }
      }, 15000);
    };

    script.onerror = () => {
      setIsError(true);
      loadingStateRef.current = 'error';
      scriptLoadedRef.current = false;
      console.error('Erreur lors du chargement du script Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Nettoyage : ne pas supprimer le script car il peut être utilisé par d'autres composants
    };
  }, []);

  return { isLoaded, isError };
};
