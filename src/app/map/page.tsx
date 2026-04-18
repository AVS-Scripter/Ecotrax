"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Wind, Droplets, Trash2, Volume2, 
  ZoomIn, ZoomOut, Info, Locate, Navigation 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap
} from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { LocationPermissionDialog } from '@/components/map/LocationPermissionDialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/components/providers/LocationProvider';

// Types for our reports
interface Report {
  id: string;
  name: string;
  issue_type: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
}

export default function MapPage() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <MapContent />
    </APIProvider>
  );
}

function MapContent() {
  const { toast } = useToast();
  const map = useMap();
  const { coordinates: cachedCoords, syncLocation } = useLocation();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(cachedCoords);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Sync internal location state with context
  useEffect(() => {
    if (cachedCoords) {
      setUserLocation(cachedCoords);
    }
  }, [cachedCoords]);

  // Fetch reports from Supabase
  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Hardcoded demo reports within 50m radius of given location
      const defaultCenter = { lat: 26.246363916666667, lng: 78.17409746575342 };
      const metersToLatitude = 1 / 111000; // 1 meter ≈ 0.000009 degrees latitude
      const hardcodedReports = [
        {
          id: 'demo-air-1',
          name: 'Air Quality Alert',
          issue_type: 'air',
          description: 'High pollution levels detected in the area',
          location: 'Local Area',
          latitude: defaultCenter.lat + (50 * metersToLatitude),
          longitude: defaultCenter.lng + (50 * metersToLatitude),
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          id: 'demo-noise-1',
          name: 'Excessive Noise Complaint',
          issue_type: 'noise',
          description: 'Construction noise reported during early morning hours',
          location: 'Local Area',
          latitude: defaultCenter.lat + (-50 * metersToLatitude),
          longitude: defaultCenter.lng + (50 * metersToLatitude),
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          id: 'demo-trash-1',
          name: 'Trash Accumulation',
          issue_type: 'garbage',
          description: 'Significant waste accumulation along the roadside',
          location: 'Local Area',
          latitude: defaultCenter.lat + (30 * metersToLatitude),
          longitude: defaultCenter.lng + (-80 * metersToLatitude),
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];

      let allReports = hardcodedReports;
      if (!error && data) {
        allReports = [...hardcodedReports, ...data];
      }
      setReports(allReports);
    };

    fetchReports();

    const channel = supabase
      .channel('map-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check initial permission status or show modal ONLY if no cached location
  useEffect(() => {
    if (cachedCoords) return; // Skip if we already have a location

    if ("permissions" in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          handleLocate(true);
        } else if (result.state === 'prompt') {
          setTimeout(() => setIsLocationModalOpen(true), 1200);
        }
      });
    } else {
      setTimeout(() => setIsLocationModalOpen(true), 1200);
    }
  }, [cachedCoords]);

  const handleLocate = useCallback(async (isInitial = false) => {
    // If it's the manual button click, force refresh
    // Otherwise, try to use cache if available
    const coords = await syncLocation(!isInitial);
    
    if (coords) {
      setUserLocation(coords);
      setIsLocationModalOpen(false);
      
      if (map) {
        map.panTo(coords);
        if (!isInitial) map.setZoom(14);
      }
    } else if (!isInitial) {
      toast({
        title: "Location Access Denied",
        description: "We couldn't get your location. Please check your browser settings.",
        variant: "destructive",
      });
    }
  }, [map, toast, syncLocation]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => 
      activeFilter === 'all' || report.issue_type === activeFilter
    );
  }, [reports, activeFilter]);

  return (
    <div className="h-[100vh] pt-20 flex relative overflow-hidden bg-[#0c1410]">
      {/* Sidebar Overlay */}
      <div className="absolute top-24 left-6 z-10 w-80 space-y-4 pointer-events-none">
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-5 shadow-2xl pointer-events-auto">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary ml-1">Live Feed</h2>
            <div className="relative">
              <Input placeholder="Search locations..." className="bg-white/10 border-white/20 rounded-xl pl-10 h-11 focus:ring-primary/50 text-foreground placeholder:text-foreground/50" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70 ml-1">Filter Issues</h2>
            <div className="flex flex-wrap gap-2">
              {['all', 'air', 'water', 'garbage', 'noise'].map(f => (
                <Badge 
                  key={f}
                  variant={activeFilter === f ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer capitalize px-3 py-1.5 rounded-full text-[10px] tracking-widest transition-all",
                    activeFilter === f ? "neon-glow scale-105" : "border-white/10 hover:bg-white/5 opacity-60 hover:opacity-100"
                  )}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {selectedReport && (
          <div className="glass p-6 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-left-4 duration-300 pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  {selectedReport.issue_type === 'air' && <Wind className="w-5 h-5 text-blue-400" />}
                  {selectedReport.issue_type === 'water' && <Droplets className="w-5 h-5 text-teal-400" />}
                  {selectedReport.issue_type === 'garbage' && <Trash2 className="w-5 h-5 text-orange-400" />}
                  {selectedReport.issue_type === 'noise' && <Volume2 className="w-5 h-5 text-purple-400" />}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{selectedReport.issue_type}</div>
                  <div className="font-bold line-clamp-1">{selectedReport.name}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)} className="h-6 w-6 rounded-full">&times;</Button>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              {selectedReport.description}
              <br />
              <span className="text-primary font-bold mt-2 block text-xs">Location: {selectedReport.location}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="default" className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-wider">View Full Details</Button>
              <Button variant="outline" className="rounded-xl h-10 px-3 border-white/10"><Info className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <Map
          defaultCenter={userLocation || { lat: 0, lng: 0 }}
          defaultZoom={userLocation ? 13 : 3}
          mapId="exotrack_map_v1"
          disableDefaultUI={true}
          className="w-full h-full"
          gestureHandling={'greedy'}
          styles={darkMapStyles}
        >
          {/* User Location Marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="relative">
                <div className="absolute -inset-8 bg-primary/10 rounded-full animate-pulse" />
                <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                <div className="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-[0_0_20px_rgba(var(--primary),0.5)] flex items-center justify-center transition-transform hover:scale-110">
                  <Navigation className="w-5 h-5 text-white fill-current transform -rotate-45" />
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Report Markers */}
          {filteredReports.map((report) => (
            <AdvancedMarker
              key={report.id}
              position={{ lat: report.latitude!, lng: report.longitude! }}
              onClick={() => setSelectedReport(report)}
            >
              <div className={cn(
                "p-2.5 rounded-2xl border-2 border-white/20 shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer",
                selectedReport?.id === report.id ? "scale-125 bg-white text-background neon-glow border-primary" : "bg-background/80 backdrop-blur-md"
              )}>
                {report.issue_type === 'air' && <Wind className="w-5 h-5 text-blue-400" />}
                {report.issue_type === 'water' && <Droplets className="w-5 h-5 text-teal-400" />}
                {report.issue_type === 'garbage' && <Trash2 className="w-5 h-5 text-orange-400" />}
                {report.issue_type === 'noise' && <Volume2 className="w-5 h-5 text-purple-400" />}
              </div>
            </AdvancedMarker>
          ))}
        </Map>

        {/* Map Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-10 pointer-events-auto">
          <Button 
            variant="outline" 
            size="icon" 
            className="glass w-12 h-12 rounded-2xl shadow-2xl hover:bg-white/10 border-white/10"
            onClick={() => map?.setZoom((map.getZoom() || 10) + 1)}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="glass w-12 h-12 rounded-2xl shadow-2xl hover:bg-white/10 border-white/10"
            onClick={() => map?.setZoom((map.getZoom() || 10) - 1)}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="neon-glow w-12 h-12 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105 transition-transform"
            onClick={() => handleLocate(false)}
          >
            <Locate className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Permission Dialog */}
      <LocationPermissionDialog 
        isOpen={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        onAccept={() => handleLocate(false)}
        onDecline={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0c1410" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c1410" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5d6d63" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#081a12" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2a22" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a25" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c3e34" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2823" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1f18" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];
