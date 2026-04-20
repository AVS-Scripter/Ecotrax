"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Leaf, Shield, Map as MapIcon, Globe, 
  BarChart3, AlertTriangle, Sun, Thermometer, 
  Droplets, CloudRain, Wind, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { supabase } from '@/lib/supabase';
import { LocationPermissionDialog } from '@/components/map/LocationPermissionDialog';
import { useLocation } from '@/components/providers/LocationProvider';

export default function Home() {
  const { weather, loading: isSyncing, syncLocation, syncWeather } = useLocation();
  const [stats, setStats] = useState<any>({
    total_reports: 0,
    monitored_zones: 0,
    total_users: 0,
    lifetime_visits: 0,
    monthly_reports: 0
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    // Increment lifetime visits on mount via RPC
    const handleVisit = async () => {
      await supabase.rpc('increment_lifetime_visits');
    };
    handleVisit();

    const fetchStats = async () => {
      const { data } = await supabase
        .from('stats')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();
      
      if (data) setStats(data);
    };

    fetchStats();

    const channel = supabase
      .channel('global-stats')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'stats',
        filter: 'id=eq.global'
      }, (payload) => {
        setStats(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLocateAndSync = async () => {
    const coords = await syncLocation(true); // Always force fresh location when clicking sync
    if (coords) {
      await syncWeather(coords.lat, coords.lng, true);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-Gen Eco monitoring
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight tracking-tighter">
              Monitor. Report.<br />
              <span className="text-primary neon-text">Improve.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Ecotrax provides the platform to monitor environmental health, report local issues, and collaborate for a sustainable future.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/report">
                <Button size="lg" className="rounded-full px-8 gap-2 group">
                  Report Issue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" suppressHydrationWarning />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="rounded-full px-8 glass hover:bg-white/5 transition-colors">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold font-headline">{formatNumber(stats.total_reports)}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Reports</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-headline">{formatNumber(stats.lifetime_visits)}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Visits</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-headline">{formatNumber(stats.total_users)}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Users</div>
              </div>
            </div>

          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="relative h-full w-full glass rounded-3xl border border-white/10 shadow-2xl flex flex-col p-6 md:p-8 overflow-hidden min-h-[480px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Header: Location & Temperature */}
                <div className="flex items-start justify-between pb-6 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                      {isSyncing ? (
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                      ) : (
                        <Sun className={cn("w-7 h-7", weather ? "text-primary" : "text-muted-foreground/50")} suppressHydrationWarning />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-headline">{weather?.city || "nill"}</h3>
                      <p className="text-sm text-muted-foreground">{weather ? "Local Conditions" : "Awaiting Location"}</p>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <div className={cn(
                      "flex items-center gap-2 text-4xl md:text-5xl font-bold font-headline tracking-tighter transition-colors",
                      weather ? "text-foreground" : "text-muted-foreground/80"
                    )}>
                      <Thermometer className="w-8 h-8 opacity-50" suppressHydrationWarning /> {weather ? `${weather.temp}°` : "nill°"}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">Temperature</div>
                  </div>
                </div>

                {/* Main Environmental Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 flex-1">
                  {/* AQI */}
                  <div className="glass p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <BarChart3 className="w-5 h-5 text-blue-400" />
                       </div>
                       <div>
                         <div className="text-lg font-bold transition-colors">{weather?.aqi || "nill"}</div>
                         <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">AQI Level</div>
                       </div>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="glass p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <Droplets className="w-5 h-5 text-teal-400" />
                       </div>
                       <div>
                         <div className="text-lg font-bold transition-colors">{weather ? `${weather.humidity}%` : "nill"}</div>
                         <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Humidity</div>
                       </div>
                    </div>
                  </div>

                  {/* Rain Chance */}
                  <div className="glass p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <CloudRain className="w-5 h-5 text-indigo-400" />
                       </div>
                       <div>
                         <div className="text-lg font-bold transition-colors">{weather ? `${weather.rainChance}%` : "nill"}</div>
                         <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Rain Chance</div>
                       </div>
                    </div>
                  </div>

                  {/* Wind / Precipitation */}
                  <div className="glass p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <Wind className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div>
                         <div className="text-lg font-bold transition-colors">{weather ? `${weather.precipitation}mm` : "nill"}</div>
                         <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Precipitation</div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* API Initializer Button */}
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <p className="text-[11px] md:text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                     {weather ? "Live meteorological data synced from global monitoring stations." : "Enable location access to populate dashboard with Live Meteorological Data."}
                   </p>
                   <Button 
                    variant="outline" 
                    className={cn(
                      "rounded-full shrink-0 text-xs font-bold uppercase tracking-wider h-10 transition-all",
                      weather ? "bg-primary/5 text-primary border-primary/20" : "bg-primary text-black border-transparent hover:scale-105"
                    )}
                    disabled={isSyncing}
                    onClick={() => setIsLocationModalOpen(true)}
                  >
                     {isSyncing ? (
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     ) : (
                       <MapIcon className="w-4 h-4 mr-2" />
                     )}
                     {weather ? "Sync Again" : "Enable Sync"}
                   </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Platform Capabilities</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Advanced tools designed for transparency and collaborative environmental action.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Global Mapping",
              desc: "Visualize reports on an interactive map with satellite and thermal layers.",
              icon: MapIcon,
              color: "text-blue-400"
            },
            {
              title: "Instant Reporting",
              desc: "Quickly report pollution, garbage, or noise issues from your mobile device.",
              icon: AlertTriangle,
              color: "text-primary"
            },
            {
              title: "Data Insights",
              desc: "Monitor trends and see how community actions are impacting the planet.",
              icon: Globe,
              color: "text-accent"
            }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} suppressHydrationWarning />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <LocationPermissionDialog 
        isOpen={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        onAccept={handleLocateAndSync}
        onDecline={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}
