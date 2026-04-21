"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Wind, Droplets, Trash2, Volume2, 
  Calendar, CheckCircle2, AlertCircle, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getReportByRef, createReportUpdate } from '@/lib/reports';
import type { ReportWithProfile } from '@/lib/database.types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import { getReports } from '@/lib/reports';

export async function generateStaticParams() {
  const reports = await getReports({ limit: 100 });
  return reports.map((report) => ({
    ref: report.reference_code,
  }));
}

export default function ReportDetailPage({ params }: { params: { ref: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<ReportWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await getReportByRef(params.ref);
        setReport(data);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [params.ref]);

  if (loading) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="text-muted-foreground font-bold tracking-widest uppercase">Loading Report</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center space-y-6">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold font-headline text-center">Report Not Found</h1>
        <p className="text-muted-foreground text-center">The report you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/report')} variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
        </Button>
      </div>
    );
  }

  const isResolved = report.status === 'resolved' || report.status === 'Resolved';
  const displayStatus = isResolved ? 'Resolved' : 'Reported';

  const handleUpdate = async (type: 'verified' | 'resolved') => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to interact with reports.', variant: 'destructive' });
      return;
    }
    setUpdating(true);
    try {
      await createReportUpdate(user.id, report.id, type);
      toast({ title: 'Update recorded', description: 'Thank you for updating the status of this report.' });
      const updatedData = await getReportByRef(params.ref);
      setReport(updatedData);
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'air': return <Wind className="w-6 h-6 text-blue-400" />;
      case 'water': return <Droplets className="w-6 h-6 text-teal-400" />;
      case 'garbage': return <Trash2 className="w-6 h-6 text-orange-400" />;
      case 'noise': return <Volume2 className="w-6 h-6 text-purple-400" />;
      default: return <AlertCircle className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-6 max-w-4xl mx-auto min-h-screen">
      <Button onClick={() => router.back()} variant="ghost" className="mb-6 rounded-xl hover:bg-white/5">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500" />
        
        <div className="p-6 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                  {getCategoryIcon(report.category)}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                    #{report.category}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold font-headline leading-tight">
                    {report.title}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {report.location_text}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(report.created_at).toLocaleDateString()}
                </span>
                <span className="font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5 tracking-wider">
                  REF: {report.reference_code}
                </span>
              </div>
            </div>

            <div className={cn(
              "px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap self-start border flex items-center gap-2",
              isResolved 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                : "bg-orange-500/10 text-orange-400 border-orange-500/30"
            )}>
              {isResolved && <CheckCircle2 className="w-4 h-4" />}
              {displayStatus}
            </div>
          </div>

          {report.images && report.images.length > 0 && (report.images as any[])[0]?.image_url && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
              <img 
                src={(report.images as any[])[0].image_url} 
                alt={report.title} 
                className="w-full h-[300px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Description</h3>
              <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5">
                {report.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verification Count</div>
                <div className="text-2xl font-bold font-headline">{report.verification_count || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Community members confirmed this</div>
              </div>
              
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Original Reporter</div>
                <div className="text-lg font-bold mt-1 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                    {report.profiles?.username?.[0] || '?'}
                  </div>
                  {report.profiles?.username || 'Anonymous'}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mt-8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-center text-muted-foreground mb-6">Community Action</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => handleUpdate('verified')} 
                disabled={updating || isResolved}
                className="w-full sm:w-auto rounded-xl px-8 py-6 h-auto glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Still Happening
              </Button>
              <Button 
                onClick={() => handleUpdate('resolved')} 
                variant="outline"
                disabled={updating || isResolved}
                className="w-full sm:w-auto rounded-xl px-8 py-6 h-auto glass border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all font-bold"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Looks Resolved
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
