"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function LocationPermissionDialog({
  isOpen,
  onOpenChange,
  onAccept,
  onDecline,
}: LocationPermissionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-white/10">
        <DialogHeader className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <Navigation className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-headline font-bold text-center">
            Enable Location Services
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            To show you local reports and mark your location on the map, Exotrack needs access to your current location.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={onDecline}
            className="flex-1 rounded-xl text-muted-foreground hover:text-foreground"
          >
            Not Now
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 rounded-xl neon-glow bg-primary text-primary-foreground font-bold flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Allow Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
