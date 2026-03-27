
"use client";

import React, { useState } from 'react';
import { 
  Search, Filter, MapPin, Wind, Droplets, Trash2, Volume2, 
  Maximize2, ZoomIn, ZoomOut, Layers, AlertCircle, Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const mockMarkers = [
  { id: 1, type: 'air', x: '30%', y: '40%', title: 'Air Pollution Near Industrial Park', desc: 'Soot observed from main chimneys.' },
  { id: 2, type: 'water', x: '55%', y: '25%', title: 'Water Contamination', desc: 'Discolored water flowing into the river.' },
  { id: 3, type: 'garbage', x: '70%', y: '60%', title: 'Illegal Dumping Site', desc: 'Large pile of electronic waste found.' },
  { id: 4, type: 'noise', x: '20%', y: '75%', title: 'Excessive Construction Noise', desc: 'Drilling active past midnight.' },
];

export default function MapPage() {
  const [selectedMarker, setSelectedMarker] = useState<typeof mockMarkers[0] | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredMarkers = activeFilter === 'all' 
    ? mockMarkers 
    : mockMarkers.filter(m => m.type === activeFilter);

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
        <div className="absolute inset-0 bg-[#0c1410] bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2068&auto=format&fit=crop')] opacity-30 bg-center bg-cover mix-blend-overlay" />
        <div className="absolute inset-0 bg-grid-white" />
        
        {/* Markers */}
        {filteredMarkers.map(m => (
          <button
            key={m.id}
            className={cn(
              "absolute z-20 group transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125",
              selectedMarker?.id === m.id ? "scale-150" : "scale-100"
            )}
            style={{ left: m.x, top: m.y }}
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
            <Button variant="ghost" size="icon" className="rounded-none border-b border-white/5"><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="rounded-none"><ZoomOut className="w-4 h-4" /></Button>
          </div>
          <Button variant="outline" size="icon" className="glass rounded-xl shadow-xl"><Maximize2 className="w-4 h-4" /></Button>
        </div>

        {/* Coordinates readout */}
        <div className="absolute bottom-6 left-6 glass px-3 py-1.5 rounded-full text-[10px] font-mono tracking-tighter text-muted-foreground z-10">
          LAT: 40.7128° N | LONG: 74.0060° W | ALT: 12m
        </div>
      </div>
    </div>
  );
}
