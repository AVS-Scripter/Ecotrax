"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Filter, MapPin, Wind, Droplets, Trash2, Volume2, 
  Maximize2, ZoomIn, ZoomOut, Layers, AlertCircle, Info, Locate, Navigation 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow,
  useMap,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { supabase } from '@/lib/supabase';
import { LocationPermissionDialog } from '@/components/map/LocationPermissionDialog';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const map = useMap();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const hasCenteredOnUser = useRef(false);
  
  const MAP_ID = "exotrack_map_v1";

  // Fetch reports from Supabase
  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!error && data) {
        setReports(data);
      }
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

  // Check initial permission status or show modal
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          handleLocate(true); // Silent locate if already granted
        } else if (result.state === 'prompt') {
          setTimeout(() => setIsLocationModalOpen(true), 1200);
        }
      });
    } else {
      setTimeout(() => setIsLocationModalOpen(true), 1200);
    }
  }, []);

  const handleLocate = useCallback((isInitial = false) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          setIsLocationModalOpen(false);
          
          // Only auto-pan to user if it's the first time or they manually clicked locate
          if (!isInitial || !hasCenteredOnUser.current) {
            // We use a helper to pan the map if it's already loaded
            // Since useMap might be null here, we can't use it directly in handleLocate easily
            // Instead, we rely on the useEffect below to handle the initial pan
            hasCenteredOnUser.current = true;
          }
        },
        (error) => {
          if (!isInitial) {
            console.error("Error getting location:", error);
            toast({
              title: "Location Access Denied",
              description: "We couldn't get your location. Please check your browser settings.",
              variant: "destructive",
            });
          }
        }
      );
    }
  }, [toast]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => 
      activeFilter === 'all' || report.issue_type === activeFilter
    );
  }, [reports, activeFilter]);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="h-[100vh] pt-20 flex relative overflow-hidden bg-[#0c1410]">
        
        {/* Sidebar Overlay */}
        <div className="absolute top-24 left-6 z-10 w-80 space-y-4 pointer-events-none">
          <div className="glass p-4 rounded-2xl border border-white/5 space-y-4 shadow-2xl pointer-events-auto">
            <div className="relative">
              <Input placeholder="Search reports..." className="bg-white/5 border-white/10 rounded-xl pl-10 h-11" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['all', 'air', 'water', 'garbage', 'noise'].map(f => (
                <Badge 
                  key={f}
                  variant={activeFilter === f ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer capitalize px-3 py-1 rounded-full text-[10px] tracking-widest",
                    activeFilter === f ? "neon-glow" : "border-white/10 hover:bg-white/5"
                  )}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </Badge>
              ))}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-[10px] tracking-widest uppercase gap-2 h-9 rounded-xl border-white/10 hover:bg-white/5"
              onClick={() => handleLocate(false)}
            >
              <Locate className="w-3 h-3 text-primary" />
              {userLocation ? "Re-center on Me" : "Find Reports Near Me"}
            </Button>
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
                <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)} className="h-6 w-6">&times;</Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {selectedReport.description}
                <br />
                <span className="text-primary font-bold mt-2 block text-xs">Location: {selectedReport.location}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="default" className="flex-1 rounded-xl h-9 text-xs">View Full Details</Button>
                <Button variant="outline" className="rounded-xl h-9 px-3"><Info className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <Map
            defaultCenter={userLocation || { lat: 0, lng: 0 }}
            defaultZoom={userLocation ? 13 : 3}
            mapId={MAP_ID}
            disableDefaultUI={true}
            className="w-full h-full"
            gestureHandling={'greedy'}
            styles={darkMapStyles}
          >
            <MapHandler userLocation={userLocation} />

            {/* User Location Marker - Slightly Larger */}
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="relative">
                  <div className="absolute -inset-6 bg-primary/20 rounded-full animate-ping" />
                  <div className="w-8 h-8 bg-primary rounded-full border-2 border-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110">
                    <Navigation className="w-4 h-4 text-white fill-current transform -rotate-45" />
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
                  "p-2 rounded-xl border-2 border-white shadow-xl transition-all duration-300 hover:scale-110",
                  selectedReport?.id === report.id ? "scale-125 bg-white text-background" : "bg-background/80 backdrop-blur-md"
                )}>
                  {report.issue_type === 'air' && <Wind className="w-4 h-4 text-blue-400" />}
                  {report.issue_type === 'water' && <Droplets className="w-4 h-4 text-teal-400" />}
                  {report.issue_type === 'garbage' && <Trash2 className="w-4 h-4 text-orange-400" />}
                  {report.issue_type === 'noise' && <Volume2 className="w-4 h-4 text-purple-400" />}
                </div>
              </AdvancedMarker>
            ))}

            <MapControls onLocate={() => handleLocate(false)} />
          </Map>
        </div>

        {/* Permission Dialog */}
        <LocationPermissionDialog 
          isOpen={isLocationModalOpen}
          onOpenChange={setIsLocationModalOpen}
          onAccept={() => handleLocate(false)}
          onDecline={() => setIsLocationModalOpen(false)}
        />
      </div>
    </APIProvider>
  );
}

/**
 * Component to handle map interactions like panning
 */
function MapHandler({ userLocation }: { userLocation: {lat: number, lng: number} | null }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (map && userLocation && !hasCentered.current) {
      map.setCenter(userLocation);
      map.setZoom(13);
      hasCentered.current = true;
    }
  }, [map, userLocation]);

  return null;
}

function MapControls({ onLocate }: { onLocate: () => void }) {
  const map = useMap();
  
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10 pointer-events-auto">
      <Button 
        variant="outline" 
        size="icon" 
        className="glass rounded-xl shadow-xl hover:bg-white/10"
        onClick={() => map?.setZoom((map.getZoom() || 10) + 1)}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="glass rounded-xl shadow-xl hover:bg-white/10"
        onClick={() => map?.setZoom((map.getZoom() || 10) - 1)}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="glass rounded-xl shadow-xl hover:bg-white/10"
        onClick={onLocate}
      >
        <Locate className="w-4 h-4 text-primary" />
      </Button>
    </div>
  );
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0c1410" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c1410" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#05130d" }] },
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
