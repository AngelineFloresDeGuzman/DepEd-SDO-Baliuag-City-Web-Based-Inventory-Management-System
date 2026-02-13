import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X } from 'lucide-react';
import { items, categories } from '@/data/mockData';

const AddItemPurchasedModal = ({ isOpen, onClose, onSubmit }) => {
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    category: '',
    type: '',
    unit: '',
    quantity: '',
    unitPrice: '',
    totalCost: '',
    source: 'Maintenance and Other Operating Expenses (MOOE)',
    image: null,
    imagePreview: null
  });

  const [errors, setErrors] = useState({});

  // Calculate total cost when quantity or unit price changes
  React.useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const totalCost = quantity * unitPrice;

    setFormData(prev => ({
      ...prev,
      totalCost: totalCost.toFixed(2)
    }));
  }, [formData.quantity, formData.unitPrice]);

  // Handle item selection from predefined items
  const handleItemSelect = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        category: item.category,
        type: item.type,
        unit: item.unit
      }));
      setErrors(prev => ({ ...prev, itemId: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }));
        setErrors(prev => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.itemId) newErrors.itemId = 'Please select an item';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Unit price must be greater than 0';
    }
    if (!formData.source) newErrors.source = 'Source is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;

    const submissionData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      totalCost: parseFloat(formData.totalCost),
      deducted: 0,
      balance: parseFloat(formData.totalCost),
      dateAcquired: new Date().toISOString()
    };

    onSubmit(submissionData);
    handleClose();
  };

  // Reset form and close
  const handleClose = () => {
    setFormData({
      itemId: '',
      itemCode: '',
      itemName: '',
      category: '',
      type: '',
      unit: '',
      quantity: '',
      unitPrice: '',
      totalCost: '',
      source: 'Maintenance and Other Operating Expenses (MOOE)',
      image: null,
      imagePreview: null
    });
    setErrors({});
    onClose();
  };

  const sources = [
    'Maintenance and Other Operating Expenses (MOOE)',
    'Local School Board (LSB)/Local Government Unit (LGU)',
    'Donation',
    'Others'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item Purchased</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="itemSelect">Select Item *</Label>
            <Select onValueChange={handleItemSelect} value={formData.itemId}>
              <SelectTrigger>
                <SelectValue placeholder="Search and select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemId && <p className="text-sm text-destructive">{errors.itemId}</p>}
          </div>

          {/* Item Details Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Item Code (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Category (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Item Name (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Type and Unit Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Type (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={formData.type}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Unit (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Quantity and Unit Price Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="Enter unit price"
              />
              {errors.unitPrice && <p className="text-sm text-destructive">{errors.unitPrice}</p>}
            </div>
          </div>

          {/* Total Cost (Calculated) */}
          <div className="space-y-2">
            <Label htmlFor="totalCost">Total Cost</Label>
            <Input
              id="totalCost"
              value={formData.totalCost}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))} value={formData.source}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && <p className="text-sm text-destructive">{errors.source}</p>}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4 pt-4 border-t">
          <Label>Item Image (Optional)</Label>
          <div className="flex items-center gap-4">
            {formData.imagePreview ? (
              <div className="relative">
                <img
                  src={formData.imagePreview}
                  alt="Item preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG, GIF up to 5MB
              </p>
              {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Item to SDO-PSU
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemPurchasedModal;
