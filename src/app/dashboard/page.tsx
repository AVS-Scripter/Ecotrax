"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, AlertCircle, CheckCircle2, FileText, 
  ArrowUpRight, ArrowDownRight, Wind, Droplets, Trash2, Volume2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subscribeToGlobalStats, GlobalStats } from '@/lib/db/stats';
import { subscribeToReports, Report } from '@/lib/db/reports';
import { useAuth } from '@/components/providers/AuthProvider';

const COLORS = ['#00FF9F', '#0e915eff', '#67ffd4ff', '#77ac94d3'];

export default function Dashboard() {
  const { user, loading, communityId, isOnboarded } = useAuth();
  
  const [stats, setStats] = useState<GlobalStats>({
    totalReports: 0,
    monitoredZones: 0,
    totalUsers: 0,
    lifetimeVisits: 0,
    monthlyReports: { Jan: 0 } 
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lineData = months.map(m => ({ 
    name: m, 
    reports: stats.monthlyReports ? (stats.monthlyReports[m] || 0) : 0 
  }));
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if(!communityId) return;
    
    const unsubStats = subscribeToGlobalStats(setStats);
    const unsubReports = subscribeToReports(communityId, (data) => setReports(data.slice(0, 4)));

    return () => {
      unsubStats();
      unsubReports();
    };
  }, [communityId]);

  if (loading) {
    return <div className="pt-24 text-center">Loading...</div>;
  }

  if (!user || !isOnboarded || !communityId) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-2xl mx-auto space-y-8 text-center pt-32">
        <h1 className="text-3xl font-headline font-bold">Community Dashboard</h1>
        <p className="text-muted-foreground">Sign in and join a community to view your community's reports and activity.</p>
        {!user ? (
            <Link href="/login">
                <Button className="mt-4 neon-glow rounded-xl">Sign in to continue</Button>
            </Link>
        ) : (
            <Link href="/onboarding">
                <Button className="mt-4 neon-glow rounded-xl">Join a Community</Button>
            </Link>
        )}
      </div>
    );
  }

  const pieData = [
    { name: 'Air', value: reports.filter(r => r.issueType === 'air').length || 1 },
    { name: 'Water', value: reports.filter(r => r.issueType === 'water').length || 1 },
    { name: 'Garbage', value: reports.filter(r => r.issueType === 'garbage').length || 1 },
    { name: 'Noise', value: reports.filter(r => r.issueType === 'noise').length || 1 },
  ];

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Community Dashboard</h1>
          <p className="text-muted-foreground">Real-time metrics and historical trends across monitored zones.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Live updates enabled
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Reports", value: stats.totalReports.toLocaleString(), icon: FileText, change: "+12%", up: true },
          { title: "Active Issues", value: reports.filter(r => r.status !== 'resolved').length.toString(), icon: AlertCircle, change: "Live", up: true },
          { title: "Total Users", value: stats.totalUsers.toLocaleString(), icon: CheckCircle2, change: "+5%", up: true },
          { title: "Lifetime Visits", value: stats.lifetimeVisits.toLocaleString(), icon: TrendingUp, change: "New", up: true },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 space-y-4 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className={cn("flex items-center gap-1 text-xs font-bold", stat.up ? 'text-primary' : 'text-red-400')}>
                {stat.change} {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reports Chart */}
        <Card className="lg:col-span-2 glass border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle>Reports Frequency</CardTitle>
            <CardDescription>Monthly growth of incident reports submitted by the community.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'currentColor', opacity: 0.5, fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'currentColor', opacity: 0.5, fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                  itemStyle={{color: 'hsl(var(--primary))'}}
                />
                <Area type="monotone" dataKey="reports" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReports)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pollution Types Pie */}
        <Card className="glass border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle>Issue Types</CardTitle>
            <CardDescription>Distribution of reported environmental issues.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                  itemStyle={{color: 'currentColor'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-6 grid grid-cols-2 gap-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass border-white/5 rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Most recent environmental incidents logged globally.</CardDescription>
          </div>
          <Link href="/report">
            <Button variant="ghost" className="text-primary hover:bg-primary/10">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent reports found.</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                      {report.issueType === 'air' && <Wind className="w-5 h-5 text-blue-400" />}
                      {report.issueType === 'water' && <Droplets className="w-5 h-5 text-teal-400" />}
                      {report.issueType === 'garbage' && <Trash2 className="w-5 h-5 text-orange-400" />}
                      {report.issueType === 'noise' && <Volume2 className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div>
                      <div className="font-bold capitalize">{report.issueType} Incident</div>
                      <div className="text-xs text-muted-foreground">{report.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mb-1",
                      report.status === 'resolved' ? 'bg-primary/20 text-primary' : 
                      report.status === 'in-progress' ? 'bg-blue-400/20 text-blue-400' : 'bg-orange-400/20 text-orange-400'
                    )}>
                      {report.status}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
