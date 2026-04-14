"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface WeatherData {
  city: string;
  temp: number;
  humidity: number;
  precipitation: number;
  rainChance: number;
  aqi: number;
  condition: number;
}

interface LocationContextType {
  coordinates: { lat: number; lng: number } | null;
  weather: WeatherData | null;
  loading: boolean;
  lastUpdated: number | null;
  syncLocation: (forceRefresh?: boolean) => Promise<{ lat: number; lng: number } | null>;
  syncWeather: (lat: number, lng: number, forceRefresh?: boolean) => Promise<void>;
}

const CACHE_KEY = "exotrack_location_cache";
const WEATHER_CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const LOCATION_CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        
        // Hydrate coordinates if not expired
        if (now - parsed.timestamp < LOCATION_CACHE_MAX_AGE) {
          setCoordinates(parsed.coordinates);
        }

        // Hydrate weather if not expired
        if (now - parsed.timestamp < WEATHER_CACHE_MAX_AGE) {
          setWeather(parsed.weather);
          setLastUpdated(parsed.timestamp);
        }
      } catch (e) {
        console.error("Failed to parse location cache:", e);
      }
    }
  }, []);

  // Persistence helper
  const saveToCache = useCallback((coords: any, weatherData: any, timestamp: number) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      coordinates: coords,
      weather: weatherData,
      timestamp
    }));
  }, []);

  const syncLocation = useCallback(async (forceRefresh = false): Promise<{ lat: number; lng: number } | null> => {
    // Return cached if fresh and not forcing
    if (!forceRefresh && coordinates) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < LOCATION_CACHE_MAX_AGE) {
          return coordinates;
        }
      }
    }

    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoordinates(coords);
          // Only resolve coords here, weather is synced separately
          resolve(coords);
        },
        (error) => {
          console.error("Geolocation failed:", error);
          resolve(null);
        }
      );
    });
  }, [coordinates]);

  const syncWeather = useCallback(async (lat: number, lng: number, forceRefresh = false) => {
    // Return cached if fresh and not forcing
    if (!forceRefresh && weather && lastUpdated) {
      if (Date.now() - lastUpdated < WEATHER_CACHE_MAX_AGE) {
        return;
      }
    }

    setLoading(true);
    try {
      const [weatherRes, aqiRes, geoRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&hourly=precipitation_probability`),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi`),
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      ]);

      const weatherData = await weatherRes.json();
      const aqiData = await aqiRes.json();
      const geoData = await geoRes.json();

      const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || "Current Area";
      
      const newWeather: WeatherData = {
        city,
        temp: Math.round(weatherData.current.temperature_2m),
        humidity: weatherData.current.relative_humidity_2m,
        precipitation: weatherData.current.precipitation,
        rainChance: weatherData.hourly.precipitation_probability[0],
        aqi: Math.round(aqiData.current.european_aqi),
        condition: weatherData.current.weather_code
      };

      const now = Date.now();
      setWeather(newWeather);
      setLastUpdated(now);
      saveToCache({ lat, lng }, newWeather, now);
      
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [weather, lastUpdated, saveToCache]);

  return (
    <LocationContext.Provider value={{ 
      coordinates, 
      weather, 
      loading, 
      lastUpdated, 
      syncLocation, 
      syncWeather 
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
