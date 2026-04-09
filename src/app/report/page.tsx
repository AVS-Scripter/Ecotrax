
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Upload, MapPin, Loader2, Leaf, 
  Wind, Droplets, Trash2, Volume2 
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
import { createReport, subscribeToReports, Report } from '@/lib/db/reports';
import { auth } from '@/lib/firebase';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  issueType: z.string({ required_error: "Please select an issue type" }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Please provide a valid location"),
});

export default function ReportPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in-progress' | 'completed' | 'incomplete'>('all');
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToReports((data) => {
      setReports(data);
    }, selectedFilter);

    return () => unsubscribe();
  }, [selectedFilter]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createReport({
        userId: auth?.currentUser?.uid,
        name: values.name,
        issueType: values.issueType,
        description: values.description,
        location: values.location,
        image: preview,
        status: 'un-resolved',
      });

      toast({
        title: 'Incident Reported',
        description: 'Your report has been submitted to the database. Thank you for your contribution!',
      });
      
      form.reset();
      setPreview(null);
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'There was an error saving your report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusClass = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/30 text-emerald-200';
    if (status === 'in-progress') return 'bg-blue-500/30 text-blue-100';
    return 'bg-orange-500/30 text-orange-100';
  };

  return (
    <div className="pt-24 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline">Reports Dashboard</h1>
          <p className="text-muted-foreground">Review and manage submitted reports from the community.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Reports" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="un-resolved">Un-resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsModalOpen(true)} variant="default" className="rounded-full px-4 py-2 neon-glow">
            + New Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {reports.length === 0 ? (
          <div className="glass p-6 rounded-3xl border border-white/10 text-center col-span-full py-12">
            <p className="text-muted-foreground">No reports found for this filter.</p>
          </div>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="glass p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold truncate pr-2">{report.name}</h3>
                <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap', statusClass(report.status))}>
                  {report.status}
                </span>
              </div>
              <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">#{report.issueType}</div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{report.description}</p>
              
              <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{report.location || 'Unknown Location'}</span>
              </div>

              {report.image && (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 aspect-video">
                  <img src={report.image} alt={`Report ${report.id}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                <span>{report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                <span>Ref: {report.id?.slice(0, 8)}</span>
              </div>
            </article>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 animate-in zoom-in-90 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Report an Issue</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="bg-white/5 border-white/10 rounded-xl py-3" {...field} />
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
                        <FormLabel>Issue Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl py-3">
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
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address or landmark" className="bg-white/5 border-white/10 rounded-xl py-3" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the issue in detail..." className="bg-white/5 border-white/10 rounded-xl min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Upload Evidence</FormLabel>
                  {!preview ? (
                    <label className="border-2 border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-4 p-3 rounded-2xl border border-white/10 bg-white/5">
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-white/10">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">Image Attached</p>
                        <p className="text-xs text-muted-foreground">Evidence ready for submission</p>
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setPreview(null)} className="rounded-xl">
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full rounded-xl py-3 neon-glow" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
