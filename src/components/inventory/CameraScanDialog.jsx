import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCategoryFromPredictions, getSuggestedItemIdForCategory } from '@/lib/cameraAiMapping';

export default function CameraScanDialog({ open, onOpenChange, onAddWithItem, items = [] }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [suggestedItem, setSuggestedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [dateReceived, setDateReceived] = useState(() => new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Maintenance and Other Operating Expenses (MOOE)');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadModel = async () => {
      setLoading(true);
      setError('');
      try {
        const tf = await import('@tensorflow/tfjs');
        const mobilenet = await import('@tensorflow-models/mobilenet');
        if (cancelled) return;
        await tf.ready();
        const m = await mobilenet.load();
        if (cancelled) return;
        setModel(m);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load AI model.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadModel();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        setError(err?.message || 'Camera access denied.');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    };
  }, [open]);

  const captureAndIdentify = async () => {
    if (!model || !videoRef.current || !cameraReady) return;
    setIdentifying(true);
    setError('');
    try {
      const tf = await import('@tensorflow/tfjs');
      const predictions = await model.classify(videoRef.current);
      const category = getCategoryFromPredictions(predictions);
      const itemId = getSuggestedItemIdForCategory(category, items);
      const item = items.find((i) => i.id === itemId) || items[0];
      setSuggestedItem(item || null);
    } catch (err) {
      setError(err?.message || 'Identification failed.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleAdd = () => {
    const item = suggestedItem || items[0];
    if (!item) {
      setError('Identify an item first or ensure items list is loaded.');
      return;
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const price = parseFloat(unitPrice) || 0;
    if (!unitPrice || price <= 0) {
      setError('Enter a valid unit price.');
      return;
    }
    onAddWithItem({
      itemId: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: qty,
      unitPrice: price,
      totalCost: qty * price,
      dateReceived: dateReceived || new Date().toISOString().split('T')[0],
      source: source || 'Maintenance and Other Operating Expenses (MOOE)',
    });
    onOpenChange(false);
  };

  const handleClose = (isOpen) => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setSuggestedItem(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan with Camera (AI)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative w-full rounded-md overflow-hidden bg-muted min-h-[240px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <p className="text-sm text-muted-foreground">Loading AI model…</p>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={captureAndIdentify}
              disabled={!model || !cameraReady || identifying}
              className="flex-1"
            >
              {identifying ? 'Identifying…' : 'Capture & identify'}
            </Button>
          </div>

          {suggestedItem && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/50">
              <p className="text-sm font-medium">
                Suggested: {suggestedItem.name} ({suggestedItem.code})
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Unit price (₱)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Date received</Label>
                  <Input
                    type="date"
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Source</Label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. MOOE, LSB/LGU, Donation, Others"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          {suggestedItem && (
            <Button onClick={handleAdd} disabled={!unitPrice || parseFloat(unitPrice) <= 0}>
              Add to inventory
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
