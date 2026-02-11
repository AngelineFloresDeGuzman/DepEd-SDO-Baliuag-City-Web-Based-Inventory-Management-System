import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Stub: add school item modal. Replace with real implementation when needed. */
export default function AddSchoolItemModal({ open, onOpenChange, onAddItem, schoolId }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Add school item modal — add implementation here.</p>
      </DialogContent>
    </Dialog>
  );
}
