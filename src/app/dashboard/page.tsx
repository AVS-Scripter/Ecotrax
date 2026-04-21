"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, AlertCircle, CheckCircle2, FileText, 
  ArrowUpRight, ArrowDownRight, Wind, Droplets, Trash2, Volume2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getReportStats, getReports } from '@/lib/reports';
import { supabase } from '@/lib/supabase';
import type { ReportWithProfile } from '@/lib/database.types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const COLORS = ['#00FF9F', '#5AD8A7', '#1E4D40', '#42B883'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, reported: 0, resolved: 0 });
  const [recentReports, setRecentReports] = useState<ReportWithProfile[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [lineData, setLineData] = useState<{ name: string; reports: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsData, recent] = await Promise.all([
        getReportStats().catch(() => ({ total: 0, reported: 0, resolved: 0 })),
        getReports({ limit: 5 }).catch(() => []),
      ]);

      setStats(statsData);
      setRecentReports(recent);

      // Get category breakdown
      const categories = ['air', 'water', 'garbage', 'noise'];
      const catCounts = await Promise.all(
        categories.map(async (cat) => {
          const { count } = await supabase
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('category', cat);
          return { name: cat.charAt(0).toUpperCase() + cat.slice(1), value: count || 0 };
        })
      );
      setCategoryData(catCounts);
      // Calculate monthly report counts for the last 6 months
      const { data: allReports } = await supabase.from('reports').select('created_at').order('created_at', { ascending: false });
      if (allReports) {
        const last6Months: {name: string, year: number, month: number, reports: number}[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last6Months.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            reports: 0
          });
        }
        allReports.forEach(r => {
          const date = new Date(r.created_at);
          const block = last6Months.find(m => m.year === date.getFullYear() && m.month === date.getMonth());
          if (block) block.reports++;
        });
        setLineData(last6Months.map(b => ({ name: b.name, reports: b.reports })));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalCatValue = categoryData.reduce((s, d) => s + d.value, 0) || 1;

  // Line chart data is loaded dynamically

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Environmental Dashboard</h1>
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
          { title: "Total Reports", value: loading ? '...' : stats.total.toLocaleString(), icon: FileText, change: `${stats.total}`, up: true },
          { title: "Active Issues", value: loading ? '...' : stats.reported.toLocaleString(), icon: AlertCircle, change: `${stats.reported}`, up: false },
          { title: "Resolved", value: loading ? '...' : stats.resolved.toLocaleString(), icon: CheckCircle2, change: `${resolutionRate}%`, up: true },
          { title: "Resolution Rate", value: loading ? '...' : `${resolutionRate}%`, icon: TrendingUp, change: "live", up: true },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 space-y-4 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className={cn("flex items-center gap-1 text-xs font-bold", stat.up ? 'text-primary' : 'text-orange-400')}>
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
                  data={categoryData.length > 0 ? categoryData : [{ name: 'No data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(categoryData.length > 0 ? categoryData : [{ name: 'No data', value: 1 }]).map((entry, index) => (
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
            {categoryData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                <span className="text-muted-foreground">{d.name} ({Math.round(d.value/totalCatValue*100)}%)</span>
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
            <CardDescription>Most recent environmental incidents logged by the community.</CardDescription>
          </div>
          <Button variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => router.push('/report')}>View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)
            ) : recentReports.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No reports yet. Be the first to report an issue!</div>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer" onClick={() => router.push(`/report/${report.reference_code}`)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-white/5">
                      {report.category === 'air' && <Wind className="w-5 h-5 text-blue-400" />}
                      {report.category === 'water' && <Droplets className="w-5 h-5 text-teal-400" />}
                      {report.category === 'garbage' && <Trash2 className="w-5 h-5 text-orange-400" />}
                      {report.category === 'noise' && <Volume2 className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div>
                      <div className="font-bold line-clamp-1">{report.title}</div>
                      <div className="text-xs text-muted-foreground">{report.location_text}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mb-1",
                      report.status === 'Resolved' || report.status === 'resolved' ? 'bg-primary/20 text-primary' : 'bg-orange-400/20 text-orange-400'
                    )}>
                      {report.status === 'Resolved' || report.status === 'resolved' ? 'Resolved' : 'Reported'}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {new Date(report.created_at).toLocaleDateString()}
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
