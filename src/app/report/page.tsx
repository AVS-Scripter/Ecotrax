
"use client";

import React, { useState } from 'react';
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in-progress' | 'completed' | 'incomplete' | 'reported'>('all');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  const [reports, setReports] = useState<Array<{
    id: number;
    name: string;
    issueType: string;
    description: string;
    location: string;
    image: string | null;
    status: 'in-progress' | 'completed' | 'incomplete';
  }>>([
    {
      id: 1,
      name: 'Jane Alvarez',
      issueType: 'air',
      description: 'Smoke from nearby construction site causing irritation.',
      location: 'Downtown Avenue 12',
      image: null,
      status: 'in-progress',
    },
    {
      id: 2,
      name: 'Ravi Kumar',
      issueType: 'garbage',
      description: 'Overflowing bins with food waste attracting pests.',
      location: 'Maple Park',
      image: null,
      status: 'incomplete',
    },
  ]);

  const [nextReportId, setNextReportId] = useState(3);

  const filteredReports = reports.filter((report) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'reported') return report.status !== 'completed';
    return report.status === selectedFilter;
  });

  const handleStatusChange = (id: number, status: 'in-progress' | 'completed' | 'incomplete') => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setTimeout(() => {
      const newReport = {
        id: nextReportId,
        name: values.name,
        issueType: values.issueType,
        description: values.description,
        location: values.location,
        image: preview,
        status: 'in-progress' as const,
      };
      setReports((prev) => [newReport, ...prev]);
      setNextReportId((id) => id + 1);
      toast({
        title: 'Incident Reported',
        description: 'Your report has been submitted for review. Thank you for your contribution!',
      });
      setIsSubmitting(false);
      form.reset();
      setPreview(null);
      setIsModalOpen(false);
    }, 1200);
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
          <p className="text-muted-foreground">Review and manage submitted reports.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="#all" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">#all</SelectItem>
              <SelectItem value="in-progress">#in-progress</SelectItem>
              <SelectItem value="completed">#completed</SelectItem>
              <SelectItem value="incomplete">#incomplete</SelectItem>
              <SelectItem value="reported">#reported</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsModalOpen(true)} variant="default" className="rounded-full px-4 py-2 neon-glow">
            + New Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {filteredReports.length === 0 ? (
          <div className="glass p-6 rounded-3xl border border-white/10 text-center">No reports found for this filter.</div>
        ) : (
          filteredReports.map((report) => (
            <article key={report.id} className="glass p-6 rounded-3xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{report.name}</h3>
                <span className={cn('px-3 py-1 rounded-full text-xs font-bold', statusClass(report.status))}>#{report.status}</span>
              </div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">#{report.issueType}</div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{report.description}</p>
              <p className="text-sm">
                <span className="font-medium">Location:</span> {report.location || 'Unknown'}
              </p>
              {report.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                  <img src={report.image} alt={`Report ${report.id}`} className="w-full h-40 object-cover" />
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Select value={report.status} onValueChange={(value) => handleStatusChange(report.id, value as any)}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </article>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 animate-in zoom-in-90" onClick={(e) => e.stopPropagation()}>
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
                  <label className="border-2 border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {preview && (
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full" onClick={() => setPreview(null)}>
                        ×
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
