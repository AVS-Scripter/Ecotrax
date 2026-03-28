
"use client";

import React from 'react';
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

const lineData = [
  { name: 'Jan', reports: 400 },
  { name: 'Feb', reports: 300 },
  { name: 'Mar', reports: 600 },
  { name: 'Apr', reports: 800 },
  { name: 'May', reports: 500 },
  { name: 'Jun', reports: 900 },
];

const pieData = [
  { name: 'Air', value: 400 },
  { name: 'Water', value: 300 },
  { name: 'Garbage', value: 300 },
  { name: 'Noise', value: 200 },
];

const COLORS = ['#00FF9F', '#5AD8A7', '#1E4D40', '#42B883'];

const recentReports = [
  { id: 1, type: 'Air', location: 'Brooklyn, NY', status: 'Pending', date: '2h ago' },
  { id: 2, type: 'Water', location: 'Portland, OR', status: 'Resolved', date: '5h ago' },
  { id: 3, type: 'Garbage', location: 'Austin, TX', status: 'Resolved', date: '1d ago' },
  { id: 4, type: 'Noise', location: 'London, UK', status: 'In Progress', date: '2d ago' },
];

export default function Dashboard() {
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
          { title: "Total Reports", value: "1,248", icon: FileText, change: "+12%", up: true },
          { title: "Active Issues", value: "482", icon: AlertCircle, change: "-5%", up: false },
          { title: "Resolved", value: "766", icon: CheckCircle2, change: "+18%", up: true },
          { title: "Avg Resolution", value: "4.2d", icon: TrendingUp, change: "-1d", up: true },
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
                <span className="text-muted-foreground">{d.name} ({Math.round(d.value/1200*100)}%)</span>
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
          <Button variant="ghost" className="text-primary hover:bg-primary/10">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                    {report.type === 'Air' && <Wind className="w-5 h-5 text-blue-400" />}
                    {report.type === 'Water' && <Droplets className="w-5 h-5 text-teal-400" />}
                    {report.type === 'Garbage' && <Trash2 className="w-5 h-5 text-orange-400" />}
                    {report.type === 'Noise' && <Volume2 className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <div className="font-bold">{report.type} Incident</div>
                    <div className="text-xs text-muted-foreground">{report.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium inline-block mb-1",
                    report.status === 'Resolved' ? 'bg-primary/20 text-primary' : 
                    report.status === 'Pending' ? 'bg-orange-400/20 text-orange-400' : 'bg-blue-400/20 text-blue-400'
                  )}>
                    {report.status}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{report.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
