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
import { Html5Qrcode } from 'html5-qrcode';

const BARCODE_SCANNER_ID = 'barcode-reader';

export default function BarcodeScannerDialog({ open, onOpenChange, onAddWithItem, items = [] }) {
  const scannerRef = useRef(null);
  const [scannedCode, setScannedCode] = useState('');
  const [matchedItem, setMatchedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [dateReceived, setDateReceived] = useState(() => new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Government Procurement');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      const s = scannerRef.current;
      if (s) {
        s.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }
    setScannedCode('');
    setMatchedItem(null);
    setQuantity(1);
    setUnitPrice('');
    setDateReceived(new Date().toISOString().split('T')[0]);
    setSource('Government Procurement');
    setError('');
    setLoading(true);
    let cancelled = false;
    const html5Qr = new Html5Qrcode(BARCODE_SCANNER_ID);
    html5Qr
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (cancelled) return;
          setScannedCode(decodedText);
          const item = items.find((i) => i.code === decodedText.trim() || i.id === decodedText.trim());
          setMatchedItem(item || null);
          html5Qr.stop().catch(() => {});
          scannerRef.current = null;
        },
        () => {}
      )
      .then(() => {
        if (!cancelled) scannerRef.current = html5Qr;
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not start camera. Check permissions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      html5Qr.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [open, items]);

  const handleAdd = () => {
    const item = matchedItem || items.find((i) => i.code === scannedCode) || items[0];
    if (!item) {
      setError('Select or scan an item first.');
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
      source: source || 'Government Procurement',
    });
    onOpenChange(false);
  };

  const handleClose = (isOpen) => {
    if (!isOpen && scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Scanner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div id={BARCODE_SCANNER_ID} className="w-full rounded-md overflow-hidden bg-muted min-h-[200px]" />
          {loading && <p className="text-sm text-muted-foreground">Starting camera…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {(scannedCode || matchedItem) && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/50">
              <p className="text-sm font-medium">
                {matchedItem ? `Matched: ${matchedItem.name} (${matchedItem.code})` : `Scanned: ${scannedCode}`}
              </p>
              {!matchedItem && scannedCode && (
                <p className="text-xs text-muted-foreground">No item matched this code. You can still add with the first item or scan again.</p>
              )}
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
                    placeholder="e.g. Government Procurement"
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
          {(scannedCode || matchedItem) && (
            <Button onClick={handleAdd} disabled={!unitPrice || parseFloat(unitPrice) <= 0}>
              Add to inventory
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
