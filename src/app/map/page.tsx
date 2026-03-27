"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, MapPin, Wind, Droplets, Trash2, Volume2, 
  Maximize2, ZoomIn, ZoomOut, Layers, AlertCircle, Info, Locate 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock data with "real" coordinates (normalized 0-100 for our mock map)
const mockMarkers = [
  { id: 1, type: 'air', x: 30, y: 40, title: 'Air Pollution Near Industrial Park', desc: 'Soot observed from main chimneys.', distance: 2.4, importance: 1 },
  { id: 2, type: 'water', x: 55, y: 25, title: 'Water Contamination', desc: 'Discolored water flowing into the river.', distance: 5.1, importance: 2 },
  { id: 3, type: 'garbage', x: 70, y: 60, title: 'Illegal Dumping Site', desc: 'Large pile of electronic waste found.', distance: 8.9, importance: 1 },
  { id: 4, type: 'noise', x: 20, y: 75, title: 'Excessive Construction Noise', desc: 'Drilling active past midnight.', distance: 1.2, importance: 3 },
  { id: 5, type: 'air', x: 45, y: 45, title: 'Smog accumulation', desc: 'Heavy smog in valley area.', distance: 12.0, importance: 3 },
  { id: 6, type: 'water', x: 60, y: 80, title: 'Oil Spill', desc: 'Small spill detected at dock.', distance: 4.5, importance: 1 },
  { id: 7, type: 'garbage', x: 10, y: 15, title: 'Overflowing Bins', desc: 'Public bins hasn\'t been emptied in 1 week.', distance: 15.2, importance: 4 },
  { id: 8, type: 'noise', x: 85, y: 10, title: 'Loud Party', desc: 'Unregulated noise in residential zone.', distance: 6.8, importance: 5 },
];

export default function MapPage() {
  const [selectedMarker, setSelectedMarker] = useState<typeof mockMarkers[0] | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [userLocation, setUserLocation] = useState<{x: number, y: number} | null>(null);

  // Simulate finding user location
  const handleLocate = () => {
    setUserLocation({ x: 50, y: 50 }); // Center of our mock world
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  // Filter markers based on 10km radius and zoom level
  // importance: 1 = critical (show always), 5 = minor (only show when zoomed in)
  const filteredMarkers = useMemo(() => {
    return mockMarkers.filter(marker => {
      // Filter by type
      const typeMatch = activeFilter === 'all' || marker.type === activeFilter;
      
      // Filter by 10km radius (simulated by distance property)
      const distanceMatch = marker.distance <= 10;
      
      // Filter by zoom density (simulated importance logic)
      // Lower zoom shows only critical items. Higher zoom shows more detail.
      const importanceMatch = zoom > (marker.importance * 0.5);

      return typeMatch && distanceMatch && importanceMatch;
    });
  }, [activeFilter, zoom]);

  return (
    <div className="h-[100vh] pt-20 flex relative">
      {/* Sidebar Overlay */}
      <div className="absolute top-24 left-6 z-10 w-80 space-y-4">
        <div className="glass p-4 rounded-2xl border border-white/5 space-y-4 shadow-2xl">
          <div className="relative">
            <Input placeholder="Search location..." className="bg-white/5 border-white/10 rounded-xl pl-10 h-11" />
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
            onClick={handleLocate}
          >
            <Locate className="w-3 h-3 text-primary" />
            {userLocation ? "Location Set" : "Find Reports Near Me"}
          </Button>
          
          <div className="text-[10px] text-muted-foreground uppercase tracking-tighter px-1 flex justify-between">
            <span>Filtering within 10km radius</span>
            <span>Zoom: {zoom.toFixed(1)}x</span>
          </div>
        </div>

        {selectedMarker && (
          <div className="glass p-6 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  {selectedMarker.type === 'air' && <Wind className="w-5 h-5 text-blue-400" />}
                  {selectedMarker.type === 'water' && <Droplets className="w-5 h-5 text-teal-400" />}
                  {selectedMarker.type === 'garbage' && <Trash2 className="w-5 h-5 text-orange-400" />}
                  {selectedMarker.type === 'noise' && <Volume2 className="w-5 h-5 text-purple-400" />}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{selectedMarker.type}</div>
                  <div className="font-bold line-clamp-1">{selectedMarker.title}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMarker(null)} className="h-6 w-6">&times;</Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {selectedMarker.desc}
              <br />
              <span className="text-primary font-bold mt-2 block text-xs">Distance: {selectedMarker.distance}km</span>
            </p>
            <div className="flex gap-2">
              <Button variant="default" className="flex-1 rounded-xl h-9 text-xs">View Details</Button>
              <Button variant="outline" className="rounded-xl h-9 px-3"><Info className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Map Area (Mock) */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {/* Mock Map Texture */}
        <div className="absolute inset-0 bg-[#0c1410] bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2068&auto=format&fit=crop')] opacity-30 bg-center bg-cover mix-blend-overlay transition-transform duration-500" style={{ transform: `scale(${zoom})` }} />
        <div className="absolute inset-0 bg-grid-white" />
        
        {/* User Location Marker */}
        {userLocation && (
          <div 
            className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${userLocation.x}%`, top: `${userLocation.y}%` }}
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/20 rounded-full animate-ping" />
              <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-2xl" />
            </div>
          </div>
        )}

        {/* Markers */}
        {filteredMarkers.map(m => (
          <button
            key={m.id}
            className={cn(
              "absolute z-20 group transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125",
              selectedMarker?.id === m.id ? "scale-150" : "scale-100"
            )}
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            onClick={() => setSelectedMarker(m)}
          >
            <div className="relative">
              <div className={cn(
                "absolute -inset-2 rounded-full blur-md opacity-60 animate-pulse",
                m.type === 'air' ? 'bg-blue-400' : 
                m.type === 'water' ? 'bg-teal-400' : 
                m.type === 'garbage' ? 'bg-orange-400' : 'bg-purple-400'
              )} />
              <div className={cn(
                "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-2xl transition-colors",
                selectedMarker?.id === m.id ? 'bg-white text-background' : 'bg-background'
              )}>
                {m.type === 'air' && <Wind className="w-4 h-4" />}
                {m.type === 'water' && <Droplets className="w-4 h-4" />}
                {m.type === 'garbage' && <Trash2 className="w-4 h-4" />}
                {m.type === 'noise' && <Volume2 className="w-4 h-4" />}
              </div>
            </div>
          </button>
        ))}

        {/* Floating Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
          <Button variant="outline" size="icon" className="glass rounded-xl shadow-xl"><Layers className="w-4 h-4" /></Button>
          <div className="flex flex-col glass rounded-xl overflow-hidden border border-white/10 shadow-xl">
            <Button variant="ghost" size="icon" className="rounded-none border-b border-white/5" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="rounded-none" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
          </div>
          <Button variant="outline" size="icon" className="glass rounded-xl shadow-xl"><Maximize2 className="w-4 h-4" /></Button>
        </div>

        {/* Coordinates readout */}
        <div className="absolute bottom-6 left-6 glass px-3 py-1.5 rounded-full text-[10px] font-mono tracking-tighter text-muted-foreground z-10">
          LAT: 40.7128° N | LONG: 74.0060° W | ZOOM: {zoom.toFixed(1)}x
        </div>
      </div>
    </div>
  );
}
