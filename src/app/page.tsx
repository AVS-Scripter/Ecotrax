
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Leaf, Shield, Map as MapIcon, Globe, 
  BarChart3, AlertTriangle, Sun, Thermometer, 
  Droplets, CloudRain, Wind 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-eco');

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
                  Report Issue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <div className="text-3xl font-bold font-headline">12.5k</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Reports</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-headline">840</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Monitored</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-headline">45.2k</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Users</div>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="relative glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 aspect-video lg:aspect-square">
              {heroImage && (
                <Image 
                  src={heroImage.imageUrl} 
                  alt={heroImage.description} 
                  fill 
                  className="object-cover opacity-80"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              {/* Enhanced Real-time Monitoring Card */}
              <div className="absolute bottom-6 left-6 right-6 glass p-6 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Downtown District</div>
                      <div className="text-xs text-muted-foreground">Partly Cloudy</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-primary">
                      <Thermometer className="w-4 h-4" /> 24°C
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Temperature</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">24 (Good)</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">AQI Level</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Droplets className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">62%</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Humidity</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <CloudRain className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">12%</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Rain Chance</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Wind className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">0.5mm</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">Precipitation</div>
                    </div>
                  </div>
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
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
