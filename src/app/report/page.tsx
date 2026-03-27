
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      console.log(values);
      toast({
        title: "Incident Reported",
        description: "Your report has been submitted for review. Thank you for your contribution!",
      });
      setIsSubmitting(false);
      form.reset();
      setPreview(null);
    }, 2000);
  }

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

  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Report an Issue</h1>
        <p className="text-muted-foreground">Help us identify environmental problems in your local community.</p>
      </div>

      <div className="glass p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Leaf className="w-64 h-64 text-primary" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="bg-white/5 border-white/10 rounded-xl py-6" {...field} />
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
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl py-6">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass">
                        <SelectItem value="air"><div className="flex items-center gap-2"><Wind className="w-4 h-4 text-blue-400" /> Air Pollution</div></SelectItem>
                        <SelectItem value="water"><div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-teal-400" /> Water Quality</div></SelectItem>
                        <SelectItem value="garbage"><div className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-orange-400" /> Garbage / Waste</div></SelectItem>
                        <SelectItem value="noise"><div className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-purple-400" /> Noise Pollution</div></SelectItem>
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
                    <div className="relative">
                      <Input placeholder="Enter address or landmark" className="bg-white/5 border-white/10 rounded-xl py-6 pl-12" {...field} />
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Button type="button" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary">Get GPS</Button>
                    </div>
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
                    <Textarea 
                      placeholder="Describe the issue in detail..." 
                      className="bg-white/5 border-white/10 rounded-xl min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Upload Evidence</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-all">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {preview && (
                  <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full w-6 h-6" 
                      onClick={() => setPreview(null)}
                    >
                      &times;
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-xl py-6 text-lg neon-glow transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Report...
                </>
              ) : "Submit Report"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
