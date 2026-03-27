
import { Leaf, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold font-headline tracking-tighter">ECOTRAX</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              Empowering communities to monitor and improve environmental health through real-time data and transparency.
            </p>
            <div className="flex gap-4">
              <Github className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><Link href="/map" className="hover:text-primary">Map View</Link></li>
              <li><Link href="/report" className="hover:text-primary">Report Issue</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/" className="hover:text-primary">Our Mission</Link></li>
              <li><Link href="/community" className="hover:text-primary">Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">Stay updated with environmental reports in your area.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full outline-none focus:border-primary transition-colors"
              />
              <button className="bg-primary text-background p-2 rounded-lg hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </button>
            </div>
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
