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
import { useRouter } from 'next/navigation';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { createReport, getReports, uploadReportImage, getReportByRef } from '@/lib/reports';
import { useSearchParams, usePathname } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Share2, 
  Search, ZoomIn, ZoomOut, Locate, Navigation,
  Smartphone, Map as MapIcon, ChevronRight
} from 'lucide-react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap,
  MapMouseEvent
} from '@vis.gl/react-google-maps';
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
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'saving' | 'uploading' | 'finalizing'>('idle');

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const reportQuery = searchParams.get('report');
  const [activeReport, setActiveReport] = useState<ReportWithProfile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      description: "",
    },
  });

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          form.setValue("location", `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
          toast({ title: 'Location captured' });
        },
        () => {
          toast({ title: 'Location access denied', variant: 'destructive' });
        }
      );
    }
  };

  // Fetch reports on mount and when filters change
  useEffect(() => {
    fetchReports();
  }, [selectedFilter, setSelectedCategory]);

  // Handle URL-based report detail modal
  useEffect(() => {
    if (reportQuery) {
      loadReportDetail(reportQuery);
    } else {
      setActiveReport(null);
    }
  }, [reportQuery]);

  async function loadReportDetail(ref: string) {
    setLoadingDetail(true);
    try {
      // Find in existing reports first for instant UI
      const existing = reports.find(r => r.reference_code === ref || r.id === ref);
      if (existing) {
        setActiveReport(existing);
      } else {
        const data = await getReportByRef(ref);
        setActiveReport(data);
      }
    } catch (err) {
      console.error('Failed to load report detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }

  const openReport = (report: ReportWithProfile) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('report', report.reference_code);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeReport = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('report');
    router.push(`${pathname}?${params.toString()}`);
  };

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

  const compressImage = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height *= maxDim / width;
              width = maxDim;
            } else {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to submit a report.', variant: 'destructive' });
      return;
    }

    if (!userCoords) {
      toast({ title: 'Location Required', description: 'Please select a location.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('saving');
    
    // Close modal optimistically
    setIsModalOpen(false);
    toast({ title: 'Submitting report...', description: 'Your report is being processed in the background.' });

    try {
      // 1. Create the report first (faster UI response)
      const report = await createReport(user.id, {
        title: values.title,
        description: values.description,
        category: values.issueType as ReportCategory,
        location_text: values.location,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        geolocation_source: 'picker',
      });

      // 2. Upload image in background if exists
      if (imageFile) {
        setSubmissionStatus('uploading');
        try {
          const compressed = await compressImage(imageFile);
          const finalFile = new File([compressed], imageFile.name, { type: 'image/jpeg' });
          const img = await uploadReportImage(user.id, finalFile);
          
          setSubmissionStatus('finalizing');
          // Update the report with the image URL
          await updateReport(report.id, { images: [img] });
        } catch (err) {
          console.error('Image upload failed:', err);
        }
      }

      toast({
        title: 'Report Published',
        description: 'Your report is now live!',
      });

      form.reset();
      setPreview(null);
      setImageFile(null);
      fetchReports(); // Refresh list in background
    } catch (err: any) {
      toast({ 
        title: 'Submission failed', 
        description: err.message || 'Something went wrong.',
        variant: 'destructive' 
      });
      // Re-open if failed? Maybe just show error.
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus('idle');
    }
  }

  const handleUpdateReport = async (type: 'verified' | 'resolved') => {
    if (!user || !activeReport) return;
    setLoadingDetail(true);
    try {
      await createReportUpdate(user.id, activeReport.id, type);
      toast({ title: 'Update recorded', description: 'Thank you for your contribution!' });
      loadReportDetail(activeReport.reference_code);
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingDetail(false);
    }
  };

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
          <p className="text-muted-foreground">Welcome to the reports page. Here you will be able to see the report made by users.</p>
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
              No reports found
            </div>
          ) : (
            reports.map((report) => {
              const catInfo = categoryDisplayMap[report.category] || { label: `#${report.category}`, color: 'text-muted-foreground' };
              return (
                <article key={report.id} onClick={() => openReport(report)} className="cursor-pointer glass p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between hover:border-primary/20 transition-all">
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
                      <div className="flex gap-2">
                        <FormControl>
                          <Input readOnly placeholder="Select location on map..." className="bg-white/5 border-white/10 rounded-xl h-11 flex-1 cursor-pointer" onClick={() => setIsLocationPickerOpen(true)} {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" className="h-11 rounded-xl px-3 border-white/10 text-primary hover:bg-primary/10 transition-colors" onClick={() => setIsLocationPickerOpen(true)}>
                          <MapIcon className="w-5 h-5 mr-2" />
                          Pick
                        </Button>
                      </div>
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
                  <FormLabel className="text-sm font-semibold">Upload Evidence</FormLabel>
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

      {/* Location Picker Modal */}
      {isLocationPickerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col h-[80vh] md:h-[600px] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-bold font-headline">Select Location</h3>
                <p className="text-xs text-muted-foreground">Drop a pin exactly where the issue is occurring</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsLocationPickerOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 relative bg-[#0c1410]">
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <Map
                  defaultCenter={userCoords || { lat: 20, lng: 77 }} 
                  defaultZoom={15}
                  mapId="location_picker_map"
                  disableDefaultUI={true}
                  className="w-full h-full"
                  onClick={(e: MapMouseEvent) => {
                    if (e.detail.latLng) {
                      setTempCoords(e.detail.latLng);
                    }
                  }}
                >
                  {tempCoords && (
                    <AdvancedMarker 
                      position={tempCoords} 
                      draggable={true}
                      onDragEnd={(e) => {
                        if (e.latLng) setTempCoords(e.latLng);
                      }}
                    >
                      <div className="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce-short">
                        <MapPin className="w-5 h-5 text-white fill-current" />
                      </div>
                    </AdvancedMarker>
                  )}
                </Map>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                          setTempCoords(coords);
                        });
                      }
                    }}
                  >
                    <Locate className="w-4 h-4 mr-2" /> Current Location
                  </Button>
                </div>
              </APIProvider>
              
              {!tempCoords && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-sm font-semibold text-white animate-pulse">
                    Tap the map to place a mark
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl border-white/10" onClick={() => setIsLocationPickerOpen(false)}>
                Cancel
              </Button>
              <Button 
                disabled={!tempCoords}
                className="flex-[2] h-12 rounded-2xl font-bold neon-glow"
                onClick={() => {
                  if (tempCoords) {
                    setUserCoords(tempCoords);
                    form.setValue("location", `Lat: ${tempCoords.lat.toFixed(6)}, Lng: ${tempCoords.lng.toFixed(6)}`);
                    setIsLocationPickerOpen(false);
                    toast({ title: 'Location confirmed' });
                  }
                }}
              >
                Confirm Location
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={closeReport}>
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 animate-in slide-in-from-bottom-8 duration-500" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 md:h-80 w-full">
              {activeReport.images && (activeReport.images as any[]).length > 0 ? (
                <img src={(activeReport.images as any[])[0].image_url} alt={activeReport.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                  <MapIcon className="w-16 h-16 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={closeReport} 
                className="absolute top-6 right-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-8 md:p-10 -mt-12 relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  activeReport.status === 'Resolved' || activeReport.status === 'resolved'
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {activeReport.status === 'Resolved' || activeReport.status === 'resolved' ? 'RESOLVED' : 'REPORTED'}
                </span>
                <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-primary">
                  #{activeReport.category}
                </span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground uppercase tracking-tighter bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  REF: {activeReport.reference_code}
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold font-headline mb-6 leading-tight whitespace-pre-wrap">{activeReport.title}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Description</h4>
                    <p className="text-foreground/80 leading-relaxed text-lg">{activeReport.description}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Location</div>
                        <div className="text-sm font-semibold">{activeReport.location_text}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date Reported</div>
                        <div className="text-sm font-semibold">{new Date(activeReport.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="glass p-6 rounded-[2rem] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Community Impact</h4>
                         <span className="text-2xl font-bold font-headline text-primary">+{activeReport.verification_count || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">This report has been verified by community members as still active.</p>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleUpdateReport('verified')}
                          disabled={loadingDetail || activeReport.status === 'Resolved'}
                          className="flex-1 rounded-xl h-12 bg-white/5 border border-white/10 hover:bg-primary hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
                        >
                          Verify
                        </Button>
                        <Button 
                          onClick={() => handleUpdateReport('resolved')}
                          disabled={loadingDetail || activeReport.status === 'Resolved'}
                          className="flex-1 rounded-xl h-12 bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
                        >
                          Resolve
                        </Button>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {activeReport.profiles?.username?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Submitted By</div>
                        <div className="font-bold">{activeReport.profiles?.username || 'Anonymous User'}</div>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center pt-4">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors text-xs font-bold uppercase tracking-[0.2em]" onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: activeReport.title, url: window.location.href });
                  }
                }}>
                  <Share2 className="w-4 h-4 mr-2" /> Share Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
