
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X, Moon, Sun, Dashboard, LayoutDashboard, Map as MapIcon, Users, FileText, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', path: '/', icon: Leaf },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Report', path: '/report', icon: FileText },
  { name: 'Map', path: '/map', icon: MapIcon },
  { name: 'Community', path: '/community', icon: Users },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "py-2 px-4" : "py-6 px-4"
      )}
    >
      <div 
        className={cn(
          "max-w-7xl mx-auto rounded-2xl transition-all duration-300 border border-white/5",
          isScrolled ? "glass shadow-2xl px-6 py-2" : "bg-transparent px-6 py-2"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/40 transition-colors">
              <Leaf className="w-6 h-6 text-primary neon-text" suppressHydrationWarning />
            </div>
            <span className="text-xl font-bold font-headline tracking-tighter neon-text">
              ECOTRAX
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-white/5",
                  pathname === item.path ? "text-primary bg-primary/10" : "text-foreground/70"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full hover:bg-white/5"
            >
              {isDark ? <Sun className="w-5 h-5" suppressHydrationWarning /> : <Moon className="w-5 h-5" suppressHydrationWarning />}
            </Button>
            <Button asChild variant="default" className="rounded-full neon-glow hover:scale-105 transition-transform">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="w-5 h-5" suppressHydrationWarning /> : <Moon className="w-5 h-5" suppressHydrationWarning />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X suppressHydrationWarning /> : <Menu suppressHydrationWarning />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 glass p-6 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  pathname === item.path ? "bg-primary/20 text-primary" : "hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" suppressHydrationWarning />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            <hr className="border-white/5" />
            <Button asChild className="w-full rounded-xl gap-2">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <LogIn className="w-4 h-4" suppressHydrationWarning /> Sign In
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
