
import { Leaf, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Link href="/" className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-headline tracking-tighter">ECOTRAX</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-md">
            Empowering communities to monitor and improve environmental health through real-time data and transparency.
          </p>
          <div className="flex gap-6">
            <Github className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ecotrax. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
