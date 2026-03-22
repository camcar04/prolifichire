import { useState, useCallback, useEffect } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  supported: boolean;
  permissionState: PermissionState | null;
  requestPosition: () => void;
}

export function useGeolocation(autoRequest = false): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  // Track permission state
  useEffect(() => {
    if (!supported) return;
    navigator.permissions?.query({ name: "geolocation" }).then((result) => {
      setPermissionState(result.state);
      result.onchange = () => setPermissionState(result.state);
    }).catch(() => { /* permissions API not available */ });
  }, [supported]);

  const requestPosition = useCallback(() => {
    if (!supported) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
        setPermissionState("granted");
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied");
            setPermissionState("denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable");
            break;
          case err.TIMEOUT:
            setError("Location request timed out");
            break;
          default:
            setError("Could not get location");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [supported]);

  useEffect(() => {
    if (autoRequest && supported && !position) {
      requestPosition();
    }
  }, [autoRequest, supported]);

  return { position, error, loading, supported, permissionState, requestPosition };
}
