import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTransfers } from '@/context/TransfersContext';
import { useRawInventory } from '@/context/RawInventoryContext';
import { useSchoolInventory } from '@/context/SchoolInventoryContext';
import { useNotifications } from '@/context/NotificationsContext';
import Header from '@/components/layout/Header';
import { schools, items } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building2,
  Send,
  Trash2,
  QrCode,
  FileText,
  BarChart2,
  MessageSquare,
  Bell,
  AlertTriangle,
  TrendingUp,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  Package,
  ArrowUpRight,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };
const PAGE_SIZE = 10;
const destinationSchools = schools.filter((s) => s.id !== 'sdo');

// ─── Helper: Generate QR-code placeholder SVG data URL ───────────────────────
const makeQrDataUrl = (text) => {
  const size = 120;
  const cells = 10;
  const cell = size / cells;
  let rects = '';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const seed = (text.charCodeAt((r * cells + c) % text.length) + r * 31 + c * 17) % 3;
      if (seed === 0) {
        rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="#1a1a1a"/>`;
      }
    }
  }
  const fp = (x, y) =>
    `<rect x="${x}" y="${y}" width="${cell * 3}" height="${cell * 3}" fill="#1a1a1a" rx="1"/>
     <rect x="${x + cell}" y="${y + cell}" width="${cell}" height="${cell}" fill="white"/>`;
  rects += fp(0, 0) + fp((cells - 3) * cell, 0) + fp(0, (cells - 3) * cell);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// ─── QR Code Modal ────────────────────────────────────────────────────────────
const QrModal = ({ transfer, onClose }) => {
  if (!transfer) return null;
  const qrUrl = makeQrDataUrl(transfer.refNo);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader>
          <DialogTitle className="font-display">Transfer QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-xs text-muted-foreground">
            Scan to verify transfer on delivery
          </p>
          <img src={qrUrl} alt="QR Code" className="w-32 h-32 border rounded" />
          <p className="font-mono text-sm font-semibold">{transfer.refNo}</p>
          <p className="text-xs text-muted-foreground">
            {transfer.schoolName} → {transfer.targetSchoolName}
          </p>
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Analytics Panel ──────────────────────────────────────────────────────────
const AnalyticsPanel = ({ transfers }) => {
  const approved = transfers.filter((t) => t.status === 'Approved').length;
  const pending = transfers.filter((t) =>
    t.status.startsWith('Pending')
  ).length;
  const rejected = transfers.filter((t) => t.status === 'Rejected').length;
  const total = transfers.length;

  const itemCount = {};
  transfers.forEach((t) => {
    t.items.forEach((it) => {
      itemCount[it.itemName] = (itemCount[it.itemName] || 0) + (it.quantity || 1);
    });
  });
  const topItems = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const pairCount = {};
  transfers.forEach((t) => {
    const key = `${t.schoolName} → ${t.targetSchoolName}`;
    pairCount[key] = (pairCount[key] || 0) + 1;
  });
  const topPair = Object.entries(pairCount).sort((a, b) => b[1] - a[1])[0];

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="card-elevated p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Transfer Analytics</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Approved', value: approved, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Pending', value: pending, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Rejected', value: rejected, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-lg p-3 ${bg} flex flex-col items-center`}>
            <span className={`text-2xl font-bold font-display ${color}`}>{value}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
            <span className={`text-xs font-medium ${color}`}>{pct(value)}%</span>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Status Distribution</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {approved > 0 && (
              <div
                className="bg-success rounded-full transition-all"
                style={{ width: `${pct(approved)}%` }}
              />
            )}
            {pending > 0 && (
              <div
                className="bg-warning rounded-full transition-all"
                style={{ width: `${pct(pending)}%` }}
              />
            )}
            {rejected > 0 && (
              <div
                className="bg-destructive rounded-full transition-all"
                style={{ width: `${pct(rejected)}%` }}
              />
            )}
          </div>
        </div>
      )}

      {topItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Most Transferred Items</p>
          <div className="space-y-1.5">
            {topItems.map(([name, qty]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{name}</span>
                </div>
                <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                  {qty} units
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {topPair && (
        <div className="rounded-lg border border-border p-3 bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Most Active Route
          </p>
          <div className="flex items-center gap-1.5 text-sm">
            <ArrowUpRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{topPair[0]}</span>
            <Badge className="bg-primary/10 text-primary border-0 ml-auto flex-shrink-0">
              {topPair[1]}x
            </Badge>
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No transfer data to display yet.
        </p>
      )}
    </div>
  );
};

// ─── Comment Thread ───────────────────────────────────────────────────────────
const CommentThread = ({ transferId, user }) => {
  const storageKey = `transfer_comments_${transferId}`;
  const [comments, setComments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const saveComments = (updated) => {
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handlePost = () => {
    if (!draft.trim()) return;
    const comment = {
      id: Date.now(),
      author: user?.name || user?.email || 'Unknown',
      role: user?.role === 'sdo_admin' ? 'SDO Admin' : 'School User',
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, comment];
    saveComments(updated);
    setDraft('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-muted-foreground">
          Comments ({comments.length})
        </p>
      </div>

      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">
          No comments yet. Be the first to add one.
        </p>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-muted p-2.5 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">{c.author}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {c.role}
              </Badge>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date(c.createdAt).toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-xs">{c.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Input
          className="text-sm h-8 flex-1"
          placeholder="Add a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
        />
        <Button size="sm" className="h-8 px-3" onClick={handlePost} disabled={!draft.trim()}>
          Post
        </Button>
      </div>
    </div>
  );
};

// ─── Printable Transfer Slip ──────────────────────────────────────────────────
const printTransferSlip = (transfer) => {
  if (!transfer) return;
  const items = transfer.items
    .map(
      (it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${it.itemCode || ''}</td>
        <td>${it.itemName}</td>
        <td>${it.quantity}</td>
        <td>${it.unit || ''}</td>
        <td>₱${(it.unitPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td>₱${(it.totalCost ?? (it.unitPrice || 0) * it.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Transfer Slip — ${transfer.refNo}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; color: #111; }
    h2 { font-size: 16px; margin-bottom: 4px; }
    .subtitle { color: #555; font-size: 11px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .field label { font-size: 10px; text-transform: uppercase; color: #888; display: block; }
    .field p { font-weight: 600; margin: 2px 0 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: 700; font-size: 11px; }
    .total { margin-top: 12px; text-align: right; font-weight: 700; }
    .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; }
    .sig-block { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 11px; }
  </style>
</head>
<body>
  <h2>MEMORANDUM OF TRANSFER</h2>
  <p class="subtitle">Schools Division Office — City of Baliuag</p>
  <div class="grid">
    <div class="field"><label>Reference No.</label><p>${transfer.refNo}</p></div>
    <div class="field"><label>Date</label><p>${new Date(transfer.date).toLocaleDateString('en-PH')}</p></div>
    <div class="field"><label>From</label><p>${transfer.schoolName}</p></div>
    <div class="field"><label>To</label><p>${transfer.targetSchoolName}</p></div>
    <div class="field"><label>Status</label><p>${transfer.status}</p></div>
    <div class="field"><label>Source of Fund</label><p>${transfer.sourceOfFund || '—'}</p></div>
  </div>
  ${transfer.reason ? `<p><strong>Remarks:</strong> ${transfer.reason}</p>` : ''}
  <table>
    <thead><tr><th>#</th><th>Code</th><th>Item Name</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <p class="total">Grand Total: ₱${(transfer.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
  <div class="sig">
    <div class="sig-block">Prepared By</div>
    <div class="sig-block">Received By</div>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
};

// ─── Overdue Alert Banner ─────────────────────────────────────────────────────
const OverdueAlerts = ({ transfers, isAdmin }) => {
  const SLA_DAYS = 7;
  const today = new Date();
  const overdue = transfers.filter((t) => {
    if (!t.status.startsWith('Pending')) return false;
    const diff = (today - new Date(t.date)) / (1000 * 60 * 60 * 24);
    return diff > SLA_DAYS;
  });

  if (overdue.length === 0) return null;

  return (
    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-warning font-semibold text-sm">
          {overdue.length} overdue transfer{overdue.length > 1 ? 's' : ''} (past {SLA_DAYS}-day SLA)
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {overdue.map((t) => t.refNo).join(', ')} — action required
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Transfers = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { transfers: allTransfers, addTransfer, updateTransferStatus, removeTransfer } = useTransfers();
  const { rawInventory, updateRawEntry } = useRawInventory();
  const { addToSchoolInventory } = useSchoolInventory();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'sdo_admin';

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const transfers = allTransfers;

  // Open specific transfer from notification
  useEffect(() => {
    const openTransferId = location.state?.openTransferId;
    if (!openTransferId || allTransfers.length === 0) return;
    const transfer = allTransfers.find((t) => t.id === openTransferId);
    if (transfer) {
      setSelectedTransfer(transfer);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openTransferId, allTransfers, navigate, location.pathname]);

  // ── New Transfer state ──
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [newTransferItemId, setNewTransferItemId] = useState('');
  const [newTransferQuantity, setNewTransferQuantity] = useState(1);
  const [newTransferDestinationId, setNewTransferDestinationId] = useState('');
  const [newTransferSourceOfFund, setNewTransferSourceOfFund] = useState('');
  const [newTransferNote, setNewTransferNote] = useState('');
  const [newTransferSuccess, setNewTransferSuccess] = useState(false);

  // ── Rejection reason state (inside detail dialog) ──
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const resetNewTransferForm = () => {
    setNewTransferItemId('');
    setNewTransferQuantity(1);
    setNewTransferDestinationId('');
    setNewTransferSourceOfFund('');
    setNewTransferNote('');
  };

  // ── Warehouse stats ──
  const warehouseStatsByItemId = useMemo(() => {
    const map = {};
    rawInventory.forEach((entry) => {
      const key = entry.itemId;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          itemId: entry.itemId,
          code: entry.code,
          name: entry.name,
          category: entry.category,
          unit: entry.unit,
          totalQuantity: 0,
          totalValue: 0,
          primarySource: entry.source || '',
        };
      }
      const qty = entry.quantity || 0;
      const value =
        entry.totalCost != null
          ? entry.totalCost
          : qty * (entry.unitPrice != null ? entry.unitPrice : 0);
      map[key].totalQuantity += qty;
      map[key].totalValue += value;
      if (!map[key].primarySource && entry.source) {
        map[key].primarySource = entry.source;
      }
    });
    Object.values(map).forEach((stats) => {
      stats.unitPrice =
        stats.totalQuantity > 0 ? Number((stats.totalValue / stats.totalQuantity).toFixed(2)) : 0;
    });
    return map;
  }, [rawInventory]);

  const selectedWarehouseStats = newTransferItemId
    ? warehouseStatsByItemId[newTransferItemId] || null
    : null;
  const selectedItemMeta = newTransferItemId
    ? items.find((i) => i.id === newTransferItemId) || null
    : null;
  const computedUnitPrice = selectedWarehouseStats?.unitPrice || 0;
  const computedTransferTotal =
    computedUnitPrice && newTransferQuantity > 0
      ? Number((computedUnitPrice * newTransferQuantity).toFixed(2))
      : 0;

  // ── Quantity validation ──
  const maxAvailableQty = selectedWarehouseStats?.totalQuantity ?? Infinity;
  const isQtyOverLimit = selectedWarehouseStats != null && newTransferQuantity > maxAvailableQty;

  // ── Filtered + Paginated ──
  const filteredTransfers = transfers.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    if (isAdmin) return matchesStatus;
    return (
      matchesStatus &&
      (t.schoolId === user?.schoolId || t.targetSchoolId === user?.schoolId)
    );
  });

  const [transferPage, setTransferPage] = useState(1);
  const transferTotalPages = Math.ceil(filteredTransfers.length / PAGE_SIZE) || 1;
  const paginatedTransfers = useMemo(() => {
    const start = (transferPage - 1) * PAGE_SIZE;
    return filteredTransfers.slice(start, start + PAGE_SIZE);
  }, [filteredTransfers, transferPage]);
  useEffect(() => {
    setTransferPage(1);
  }, [filteredTransfers.length, statusFilter]);

  // ── Status badge ──
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending - Receiving School':
        return (
          <Badge className="bg-info/20 text-info border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending - Receiver
          </Badge>
        );
      case 'Pending - SDO Approval':
        return (
          <Badge className="bg-warning/20 text-warning border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending - SDO
          </Badge>
        );
      case 'Approved':
        return (
          <Badge className="bg-success/20 text-success border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-destructive/20 text-destructive border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ── Helpers ──
  const canCurrentUserActOnTransfer = (transfer) => {
    if (!transfer || isAdmin || !user || user.role !== 'school_user') return false;
    return (
      transfer.status === 'Pending - Receiving School' &&
      transfer.schoolId === SDO_SCHOOL.id &&
      transfer.targetSchoolId === user.schoolId
    );
  };

  const applyTransferToReceivingInventory = (transfer) => {
    if (!transfer || !user?.schoolId) return;
    if (!canCurrentUserActOnTransfer(transfer)) return;
    const item = transfer.items?.[0];
    if (!item) return;
    const itemMeta = items.find((i) => i.id === item.itemId) || null;
    const stats = warehouseStatsByItemId[item.itemId] || null;
    const unitPrice =
      (typeof item.unitPrice === 'number' && item.unitPrice >= 0 ? item.unitPrice : stats?.unitPrice) || 0;
    const totalCost =
      (typeof item.totalCost === 'number' && item.totalCost >= 0
        ? item.totalCost
        : Number((unitPrice * item.quantity).toFixed(2))) || 0;
    let remainingToDeduct = item.quantity;
    rawInventory.forEach((entry) => {
      if (remainingToDeduct <= 0) return;
      if (entry.itemId !== item.itemId) return;
      const available = entry.quantity || 0;
      if (available <= 0) return;
      const deduct = Math.min(available, remainingToDeduct);
      updateRawEntry(entry.id, { quantity: available - deduct });
      remainingToDeduct -= deduct;
    });
    addToSchoolInventory(user.schoolId, {
      itemId: item.itemId,
      code: itemMeta?.code || item.itemCode || '',
      name: item.itemName,
      category: itemMeta?.category || '',
      unit: itemMeta?.unit || item.unit || '',
      type: itemMeta?.type || 'Consumable',
      quantity: item.quantity,
      unitPrice,
      totalCost,
      source: transfer.sourceOfFund || stats?.primarySource || '',
      dateAcquired: new Date().toISOString().split('T')[0],
    });
    updateTransferStatus(transfer.id, 'Approved', {
      decisionBy: user.uid,
      decidedAt: new Date().toISOString(),
    });
    addNotification({
      title: 'Transfer received',
      message: `${transfer.targetSchoolName || 'Receiving school'} marked transfer ${transfer.refNo} as received (${item.quantity}× ${item.itemName}).`,
      type: 'transfer',
      forAdmin: true,
      transferId: transfer.id,
    });
    addNotification({
      title: 'Transfer recorded in inventory',
      message: `${item.quantity}× ${item.itemName} added to your school inventory.`,
      type: 'inventory',
      forSchoolId: user.schoolId,
    });
  };

  const handleMarkAsReceivedFromDialog = () => {
    if (!selectedTransfer) return;
    applyTransferToReceivingInventory(selectedTransfer);
    setSelectedTransfer(null);
  };

  const canAdminDeleteTransfer = (transfer) => {
    if (!transfer || !isAdmin) return false;
    return transfer.schoolId === SDO_SCHOOL.id && typeof transfer.id === 'string' && transfer.id.startsWith('mov-tr-');
  };

  const handleDeleteTransfer = () => {
    if (!selectedTransfer) return;
    if (!canAdminDeleteTransfer(selectedTransfer)) { setSelectedTransfer(null); return; }
    removeTransfer(selectedTransfer.id);
    setSelectedTransfer(null);
  };

  // ── Reject transfer (admin) ──
  const handleRejectTransfer = () => {
    if (!selectedTransfer || !isAdmin) return;
    updateTransferStatus(selectedTransfer.id, 'Rejected', {
      rejectionReason: rejectReason.trim() || 'No reason provided.',
      decisionBy: user.uid,
      decidedAt: new Date().toISOString(),
    });
    addNotification({
      title: 'Transfer rejected',
      message: `Transfer ${selectedTransfer.refNo} was rejected by SDO.`,
      type: 'transfer',
      forAdmin: true,
      transferId: selectedTransfer.id,
    });
    if (selectedTransfer.targetSchoolId) {
      addNotification({
        title: 'Transfer rejected',
        message: `Transfer ${selectedTransfer.refNo} was rejected by SDO.`,
        type: 'transfer',
        forSchoolId: selectedTransfer.targetSchoolId,
        transferId: selectedTransfer.id,
      });
    }
    setSelectedTransfer(null);
    setShowRejectInput(false);
    setRejectReason('');
  };

  // ── New Transfer submit ──
  const handleNewTransferSubmit = () => {
    const item = items.find((i) => i.id === newTransferItemId);
    const stats = newTransferItemId ? warehouseStatsByItemId[newTransferItemId] : null;
    const destination = destinationSchools.find((s) => s.id === newTransferDestinationId);
    const availableQty = stats?.totalQuantity || 0;
    if (!item || !destination || newTransferQuantity < 1 || newTransferQuantity > availableQty) return;
    const year = new Date().getFullYear();
    const refNo = `TR-${year}-${String(transfers.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const transfer = {
      id: `mov-tr-${Date.now()}`,
      type: 'Transfer',
      schoolId: SDO_SCHOOL.id,
      schoolName: SDO_SCHOOL.name,
      targetSchoolId: destination.id,
      targetSchoolName: destination.name,
      status: 'Pending - Receiving School',
      date: now.toISOString().split('T')[0],
      refNo,
      items: [
        {
          itemId: item.id,
          itemName: item.name,
          itemCode: item.code,
          quantity: newTransferQuantity,
          unit: item.unit,
          unitPrice: computedUnitPrice,
          totalCost: computedTransferTotal,
        },
      ],
      reason: newTransferNote.trim() || 'Transfer from SDO warehouse.',
      sourceOfFund: newTransferSourceOfFund,
      totalAmount: computedTransferTotal,
      createdBy: user?.uid || 'admin1',
      createdAt: now.toISOString(),
    };
    addTransfer(transfer);
    addNotification({
      title: 'New transfer incoming',
      message: `SDO is transferring ${newTransferQuantity}× ${item.name} to your school. Ref: ${refNo}.`,
      type: 'transfer',
      forSchoolId: destination.id,
      transferId: transfer.id,
    });
    setShowNewTransferModal(false);
    resetNewTransferForm();
    setNewTransferSuccess(true);
    setTimeout(() => setNewTransferSuccess(false), 3000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header
        title="Transfer Management"
        subtitle={
          isAdmin
            ? 'Review and approve school-to-school transfers'
            : 'Manage your transfer requests'
        }
      />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* ── Success banner ── */}
        {newTransferSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">
              Transfer created. It should now appear in the history list.
            </p>
          </div>
        )}

        {/* ── Overdue SLA alerts ── */}
        <OverdueAlerts transfers={transfers} isAdmin={isAdmin} />

        {/* ── Filters & Actions ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending - Receiving School">Pending - Receiver</SelectItem>
                <SelectItem value="Pending - SDO Approval">Pending - SDO</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2"
              onClick={() => setShowAnalytics((v) => !v)}
            >
              <BarChart2 className="w-4 h-4" />
              Analytics
              {showAnalytics ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              )}
            </Button>
          </div>

          {isAdmin && (
            <Button onClick={() => setShowNewTransferModal(true)}>
              <Send className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          )}
        </div>

        {/* ── Analytics Panel (collapsible) ── */}
        {showAnalytics && <AnalyticsPanel transfers={filteredTransfers} />}

        {/* ── Transfer History header card ── */}
        <div className="card-elevated p-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1">Transfer History</h3>
            <p className="text-sm text-muted-foreground">
              View the history of all transfers between schools. Click a row's{' '}
              <Eye className="w-3.5 h-3.5 inline-block" /> to see full details, comments, QR code,
              and print the transfer slip.
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:flex flex-col gap-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-info" /> Pending Receiver
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-warning" /> Pending SDO
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-success" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive" /> Rejected
            </span>
          </div>
        </div>

        {/* ── Transfers Table ── */}
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Ref. No.</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransfers.map((transfer) => {
                  const daysSince = (new Date() - new Date(transfer.date)) / (1000 * 60 * 60 * 24);
                  const isOverdue = transfer.status.startsWith('Pending') && daysSince > 7;
                  return (
                    <TableRow
                      key={transfer.id}
                      className={isOverdue ? 'bg-warning/5' : undefined}
                    >
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1.5">
                          {transfer.refNo}
                          {isOverdue && (
                            <AlertTriangle className="w-3.5 h-3.5 text-warning" title="Overdue" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(transfer.date).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{transfer.schoolName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{transfer.targetSchoolName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{transfer.items.length} item(s)</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canCurrentUserActOnTransfer(transfer) && (
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => applyTransferToReceivingInventory(transfer)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Receive
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowRejectInput(false);
                              setRejectReason('');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTransfers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No transfer requests found.
            </div>
          )}
          {filteredTransfers.length > 0 && transferTotalPages > 1 && (
            <TablePagination
              currentPage={transferPage}
              totalPages={transferTotalPages}
              totalItems={filteredTransfers.length}
              onPageChange={setTransferPage}
              itemLabel="transfers"
            />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Transfer Detail Dialog
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!selectedTransfer}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransfer(null);
            setShowRejectInput(false);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="font-display">Transfer Details</DialogTitle>
            </DialogHeader>
          </div>

          {selectedTransfer && (
            <div className="space-y-5 overflow-y-auto pr-1 flex-1">

              <div className="flex flex-wrap gap-2 pb-1 border-b border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setShowQr(true)}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR Code
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => printTransferSlip(selectedTransfer)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Reference No.</p>
                  <p className="font-mono font-medium">{selectedTransfer.refNo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Date</p>
                  <p>{new Date(selectedTransfer.date).toLocaleDateString('en-PH')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">From</p>
                  <p className="font-medium">{selectedTransfer.schoolName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">To</p>
                  <p className="font-medium">{selectedTransfer.targetSchoolName}</p>
                </div>
                {selectedTransfer.sourceOfFund && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Source of Fund</p>
                    <p>{selectedTransfer.sourceOfFund}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Status</p>
                  <div className="mt-0.5">{getStatusBadge(selectedTransfer.status)}</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Status Timeline</p>
                <div className="flex items-center gap-1 text-xs">
                  {[
                    { label: 'Created', done: true },
                    { label: 'Pending Receiver', done: selectedTransfer.status !== 'Pending - Receiving School' || false },
                    {
                      label: 'Approved',
                      done: selectedTransfer.status === 'Approved',
                      rejected: selectedTransfer.status === 'Rejected',
                    },
                  ].map((step, i) => (
                    <React.Fragment key={step.label}>
                      {i > 0 && (
                        <div
                          className={`flex-1 h-px ${step.done || step.rejected ? 'bg-primary' : 'bg-border'}`}
                        />
                      )}
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                            ${step.rejected ? 'bg-destructive text-white' : step.done ? 'bg-primary text-white' : 'bg-border text-muted-foreground'}`}
                        >
                          {step.rejected ? '✕' : step.done ? '✓' : i + 1}
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap">{step.label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {typeof selectedTransfer.totalAmount === 'number' &&
                selectedTransfer.totalAmount > 0 && (
                  <div className="rounded-lg bg-muted/40 border border-border p-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Total Transfer Amount
                    </p>
                    <p className="text-base font-bold">
                      ₱
                      {selectedTransfer.totalAmount.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {selectedTransfer.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2.5 rounded bg-muted"
                    >
                      <div className="flex flex-col">
                        <span>{item.itemName}</span>
                        {item.itemCode && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.itemCode}
                          </span>
                        )}
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="block font-semibold">{item.quantity}</span>
                        {typeof item.unitPrice === 'number' && item.unitPrice > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            ₱
                            {item.unitPrice.toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            / {item.unit || 'unit'}
                          </span>
                        )}
                        {(typeof item.totalCost === 'number' ||
                          (typeof item.unitPrice === 'number' && item.unitPrice > 0)) && (
                          <span className="block text-xs font-semibold">
                            Total: ₱
                            {(
                              item.totalCost ??
                              Number((item.unitPrice * item.quantity).toFixed(2))
                            ).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransfer.reason && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Reason / Notes</p>
                  <p className="text-sm p-2.5 rounded bg-muted">{selectedTransfer.reason}</p>
                </div>
              )}

              {selectedTransfer.rejectionReason && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm p-2.5 rounded bg-destructive/10 text-destructive">
                    {selectedTransfer.rejectionReason}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <CommentThread transferId={selectedTransfer.id} user={user} />
              </div>

              {canCurrentUserActOnTransfer(selectedTransfer) && (
                <div className="flex justify-end border-t border-border pt-3">
                  <Button onClick={handleMarkAsReceivedFromDialog}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Received
                  </Button>
                </div>
              )}

              {isAdmin && selectedTransfer.status.startsWith('Pending') && (
                <div className="border-t border-border pt-3 space-y-3">
                  {!showRejectInput ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setShowRejectInput(true)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject Transfer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">Rejection Reason *</Label>
                      <Textarea
                        rows={2}
                        placeholder="Provide a reason for rejection…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowRejectInput(false);
                            setRejectReason('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={handleRejectTransfer}
                          disabled={!rejectReason.trim()}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canAdminDeleteTransfer(selectedTransfer) && (
                <div className="flex justify-end border-t border-border pt-3">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteTransfer}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove Transfer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          QR Modal
      ══════════════════════════════════════════════════════════ */}
      {showQr && selectedTransfer && (
        <QrModal transfer={selectedTransfer} onClose={() => setShowQr(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════
          New Transfer Modal
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={showNewTransferModal}
        onOpenChange={(open) => {
          setShowNewTransferModal(open);
          if (!open) resetNewTransferForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-shrink-0">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-display">Create Transfer</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Fill this up and submit to add a transfer entry to the history list.
              </p>
            </DialogHeader>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1 mt-2">
            <div>
              <Label>Item *</Label>
              <Select value={newTransferItemId} onValueChange={(val) => {
                setNewTransferItemId(val);
                setNewTransferQuantity(1); // reset qty when item changes
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((i) => warehouseStatsByItemId[i.id]?.totalQuantity > 0)
                    .map((i) => {
                      const stats = warehouseStatsByItemId[i.id];
                      return (
                        <SelectItem key={i.id} value={i.id}>
                          {i.code} — {i.name}
                          {stats ? ` (Available: ${stats.totalQuantity} ${i.unit})` : ''}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {selectedItemMeta && selectedWarehouseStats && (
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/30">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Code</p>
                  <p className="text-sm font-mono">{selectedItemMeta.code}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Item Name</p>
                  <p className="text-sm">{selectedItemMeta.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Category</p>
                  <p className="text-sm">{selectedItemMeta.category}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Type</p>
                  <Badge variant="outline" className="text-xs">
                    {selectedItemMeta.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Unit</p>
                  <p className="text-sm">{selectedItemMeta.unit}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Available in SDO</p>
                  <p className="text-sm font-semibold text-primary">
                    {selectedWarehouseStats.totalQuantity} {selectedItemMeta.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Unit Price</p>
                  <p className="text-sm">
                    ₱
                    {computedUnitPrice.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Total for Quantity</p>
                  <p className="text-sm font-semibold">
                    ₱
                    {computedTransferTotal.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedWarehouseStats?.totalQuantity ?? undefined}
                  value={newTransferQuantity}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10) || 1;
                    const max = selectedWarehouseStats?.totalQuantity ?? Infinity;
                    setNewTransferQuantity(Math.min(Math.max(1, parsed), max));
                  }}
                  className={`mt-1 ${
                    isQtyOverLimit
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {selectedWarehouseStats ? (
                  isQtyOverLimit ? (
                    <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Exceeds available stock — maximum is{' '}
                      <strong>{selectedWarehouseStats.totalQuantity}</strong>{' '}
                      {selectedItemMeta?.unit}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Available:{' '}
                      <span className="font-semibold text-foreground">
                        {selectedWarehouseStats.totalQuantity} {selectedItemMeta?.unit}
                      </span>
                    </p>
                  )
                ) : null}
              </div>
              <div>
                <Label>Destination (receiving school) *</Label>
                <Select
                  value={newTransferDestinationId}
                  onValueChange={setNewTransferDestinationId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Source Of Fund *</Label>
              <Select value={newTransferSourceOfFund} onValueChange={setNewTransferSourceOfFund}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source of fund" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOOE">MOOE</SelectItem>
                  <SelectItem value="LSB/LGU">LSB/LGU</SelectItem>
                  <SelectItem value="Donation">Donation</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea
                placeholder="Optional remarks…"
                value={newTransferNote}
                onChange={(e) => setNewTransferNote(e.target.value)}
                className="mt-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            {isQtyOverLimit && (
              <p className="text-xs text-destructive flex items-center gap-1 mr-auto">
                <AlertTriangle className="w-3.5 h-3.5" />
                Quantity exceeds available stock
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowNewTransferModal(false);
                resetNewTransferForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewTransferSubmit}
              disabled={
                !newTransferItemId ||
                !newTransferDestinationId ||
                !newTransferSourceOfFund ||
                newTransferQuantity < 1 ||
                isQtyOverLimit
              }
            >
              Submit Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transfers;