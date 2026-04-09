import React, { useState } from 'react';
import { User as FirebaseUser, updateProfile, updateEmail, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, AlertTriangle, X } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);

      // Update Name Process
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
        try {
          await updateDoc(userRef, { name });
        } catch(e) {
          console.warn("DB update skipped", e);
        }
      }

      // Update Email Process
      if (email !== user.email && email.length > 0) {
        await updateEmail(user, email);
        try {
          await updateDoc(userRef, { email });
        } catch(e) {
          console.warn("DB update skipped", e);
        }
      }

      // Update Password Process
      if (password.length >= 6) {
        await updatePassword(user, password);
      } else if (password.length > 0 && password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      toast({
        title: "Profile Updated",
        description: "Your settings have been saved securely."
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast({
          title: "Security Verification Required",
          description: "Please log out and log back in before making sensitive changes.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Update Failed",
          description: error.message || "An error occurred.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone!")) {
      try {
        const userRef = doc(db, 'users', user.uid);
        try {
          await deleteDoc(userRef);
        } catch(e) {}
        await deleteUser(user);
        toast({
          title: "Account Deleted",
          description: "We're sorry to see you go. Thanks for trying Ecotrax."
        });
        onClose();
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          toast({
            title: "Security Verification Required",
            description: "Please log out and log back in to permanently delete your account.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Action Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-white/10 animate-in zoom-in-90 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">User Hub</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Display Name</label>
            <div className="relative">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="bg-white/5 border-white/10 rounded-xl h-12 pl-11" required />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Account Email</label>
            <div className="relative">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="bg-white/5 border-white/10 rounded-xl h-12 pl-11" required />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">New Password</label>
            <div className="relative">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" className="bg-white/5 border-white/10 rounded-xl h-12 pl-11" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold neon-glow transition-all">
              {loading ? 'Saving Settings...' : 'Update Variables'}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground">
              Permanently obliterate your Ecotrax identity. This erases associated data securely.
            </p>
            <Button onClick={handleDeleteAccount} variant="destructive" className="w-full rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors border border-destructive/30 border-dashed">
              Delete Account
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
