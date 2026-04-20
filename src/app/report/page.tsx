"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Upload, MapPin, Loader2, Leaf, 
  Wind, Droplets, Trash2, Volume2, X, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { createReport, getReports, uploadReportImage } from '@/lib/reports';
import type { ReportWithProfile, ReportCategory } from '@/lib/database.types';

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  issueType: z.string({ required_error: "Please select an issue type" }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Please provide a valid location"),
});

const categoryDisplayMap: Record<string, { label: string; color: string }> = {
  air: { label: '#AIR', color: 'text-blue-400' },
  water: { label: '#WATER', color: 'text-teal-400' },
  garbage: { label: '#GARBAGE', color: 'text-orange-400' },
  noise: { label: '#NOISE', color: 'text-purple-400' },
};

export default function ReportPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Reported' | 'Resolved'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ReportCategory>('all');
  const [reports, setReports] = useState<ReportWithProfile[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      description: "",
    },
  });

  // Fetch reports on mount and when filters change
  useEffect(() => {
    fetchReports();
  }, [selectedFilter, selectedCategory]);

  // Get user location for auto-tagging
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // Silently skip if denied
      );
    }
  }, []);

  async function fetchReports() {
    setLoadingReports(true);
    try {
      const filters: any = {};
      if (selectedFilter !== 'all') filters.status = selectedFilter;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      const data = await getReports(filters);
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to submit a report.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let images: any[] = [];

      // Upload image if provided
      if (imageFile) {
        try {
          const img = await uploadReportImage(user.id, imageFile);
          images = [img];
        } catch {
          // If storage upload fails (bucket might not exist), continue without image
          console.warn('Image upload failed, continuing without image');
        }
      }

      // Use browser coords if available, otherwise use fallback
      const lat = userCoords?.lat || 26.2183;
      const lng = userCoords?.lng || 78.1828;

      await createReport(user.id, {
        title: values.title,
        description: values.description,
        category: values.issueType as ReportCategory,
        location_text: values.location,
        latitude: lat,
        longitude: lng,
        geolocation_source: userCoords ? 'browser' : 'fallback',
        images,
      });

      toast({
        title: 'Report Submitted',
        description: 'Your report has been submitted successfully. Thank you for your contribution!',
      });

      form.reset();
      setPreview(null);
      setImageFile(null);
      setIsModalOpen(false);
      fetchReports();
    } catch (err: any) {
      toast({ 
        title: 'Submission failed', 
        description: err.message || 'Something went wrong.',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'Resolved' || status === 'resolved') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  };

  const statusLabel = (status: string) => {
    if (status === 'Resolved' || status === 'resolved') return 'RESOLVED';
    return 'UNRESOLVED';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline">Reports</h1>
          <p className="text-muted-foreground">Welcome to the reports page. Here you will be able to see the report made by community members.</p>
        </div>

        <Button 
          onClick={() => {
            if (!user) {
              toast({ title: 'Sign in required', description: 'Please sign in to create a report.', variant: 'destructive' });
              return;
            }
            setIsModalOpen(true);
          }} 
          variant="default" 
          className="rounded-full px-6 py-2 neon-glow shrink-0"
        >
          + New Report
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'air', 'water', 'garbage', 'noise'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground neon-glow"
                : "glass border border-white/10 text-muted-foreground hover:bg-white/5"
            )}
          >
            {cat === 'all' ? 'All' : `#${cat}`}
          </button>
        ))}
        
        <div className="ml-auto">
          <Select value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)}>
            <SelectTrigger className="w-36 h-8 text-xs rounded-full glass border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Reported">Unresolved</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports Grid */}
      {loadingReports ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass p-6 rounded-3xl border border-white/10 animate-pulse h-56" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {reports.length === 0 ? (
            <div className="glass p-6 rounded-3xl border border-white/10 text-center col-span-full">
              No reports found. Be the first to report an issue!
            </div>
          ) : (
            reports.map((report) => {
              const catInfo = categoryDisplayMap[report.category] || { label: `#${report.category}`, color: 'text-muted-foreground' };
              return (
                <article key={report.id} className="glass p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between hover:border-primary/20 transition-all">
                  <div>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-lg font-bold leading-tight line-clamp-1">{report.title}</h3>
                      <span className={cn('px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap', statusBadge(report.status))}>
                        {statusLabel(report.status)}
                      </span>
                    </div>
                    <div className={cn("text-xs font-bold uppercase tracking-wider mb-2", catInfo.color)}>
                      {catInfo.label}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {report.description}
                    </p>
                  </div>

                  {/* Image preview if available */}
                  {report.images && report.images.length > 0 && (report.images as any[])[0]?.image_url && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
                      <img src={(report.images as any[])[0].image_url} alt={report.title} className="w-full h-32 object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{report.location_text}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(report.created_at)}</span>
                    <span className="font-mono tracking-tight">REF: {report.reference_code}</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Create Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 animate-in zoom-in-90" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline">Create Report</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Report Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Pollution near park" className="bg-white/5 border-white/10 rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Issue Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass">
                          <SelectItem value="air">Air Pollution</SelectItem>
                          <SelectItem value="water">Water Quality</SelectItem>
                          <SelectItem value="garbage">Garbage / Waste</SelectItem>
                          <SelectItem value="noise">Noise Pollution</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Street Park" className="bg-white/5 border-white/10 rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the issue in detail..." className="bg-white/5 border-white/10 rounded-xl min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel className="text-sm font-semibold">Upload Evidence (optional)</FormLabel>
                  <label className="border-2 border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {preview && (
                    <div className="flex justify-center pt-2">
                      <div className="relative rounded-xl overflow-hidden h-32 w-full max-w-[200px] border border-white/10 group">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" className="rounded-full h-8 w-8" onClick={() => { setPreview(null); setImageFile(null); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full rounded-xl h-11 neon-glow font-bold" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span>
                  ) : 'Add Report'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
