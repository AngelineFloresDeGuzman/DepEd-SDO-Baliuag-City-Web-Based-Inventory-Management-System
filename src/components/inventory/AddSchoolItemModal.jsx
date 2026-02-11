import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { items } from '@/data/mockData';

export default function AddSchoolItemModal({ open, onOpenChange, onAddItem, schoolId }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemType, setItemType] = useState('');

  const handleSubmit = () => {
    if (!selectedItemId || !itemType || quantity < 1) return;
    
    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    if (onAddItem) {
      onAddItem({
        ...item,
        quantity,
        type: itemType,
      });
    }

    setSelectedItemId('');
    setQuantity(1);
    setItemType('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Item *</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type *</Label>
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consumable">Consumable</SelectItem>
                <SelectItem value="Semi-Expendable">Semi-Expendable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity *</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedItemId || !itemType || quantity < 1}
          >
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
