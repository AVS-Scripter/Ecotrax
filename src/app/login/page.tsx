
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      alert("Google Sign-In is not configured. Please add your Firebase keys to .env.local");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(0,255,159,0.03)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
        <div className="glass p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 mb-4">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-headline font-bold">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Log in to your Ecotrax account to continue.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Input type="email" placeholder="name@example.com" className="bg-white/5 border-white/10 rounded-2xl h-12 pl-12" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold uppercase tracking-widest">Password</label>
                <Link href="#" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 rounded-2xl h-12 pl-12" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <Button className="w-full h-12 rounded-2xl font-bold neon-glow transition-all hover:scale-[1.02]">
              Sign In
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a2821] px-2 text-muted-foreground tracking-widest">Or continue with</span>
            </div>
          </div>

          <div>
            <Button 
              variant="outline" 
              onClick={handleGoogleSignIn}
              className="w-full rounded-2xl h-12 glass border-white/5 gap-2 hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              <Chrome className="w-4 h-4" /> Sign in with Google
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
