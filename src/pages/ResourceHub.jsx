import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRawInventory } from '@/context/RawInventoryContext';
import { useSurplus } from '@/context/SurplusContext';
import { useTransfers } from '@/context/TransfersContext';
import { useNotifications } from '@/context/NotificationsContext';
import Header from '@/components/layout/Header';
import { schools, items } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Search,
  Package,
  ArrowRight,
  Building2,
  CheckCircle,
  Warehouse,
  ClipboardList,
  Eye,
  Clock,
  XCircle,
  ArrowLeftRight,
} from 'lucide-react';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };

const ResourceHub = () => {
  const { user } = useAuth();
  const { rawInventory } = useRawInventory();
  const { surplusItems } = useSurplus();
  const { addTransfer, transfers } = useTransfers();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'sdo_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [requestSource, setRequestSource] = useState(null); // 'raw' | 'surplus'
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestReason, setRequestReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Public transfer log (transparency) — view only
  const [selectedTransferView, setSelectedTransferView] = useState(null);

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

  const allTransfersSorted = useMemo(
    () =>
      [...transfers].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }),
    [transfers]
  );

  const categories = useMemo(
    () => [...new Set([...rawInventory.map((r) => r.category), ...surplusItems.map((s) => s.category)])],
    [rawInventory, surplusItems]
  );

  const filteredRaw = useMemo(
    () =>
      rawInventory.filter((r) => {
        const matchSearch =
          r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
        return matchSearch && matchCat;
      }),
    [rawInventory, searchQuery, categoryFilter]
  );

  const pendingRequests = useMemo(
    () => transfers.filter((t) => t.schoolId === 'sdo' && t.status?.includes('Pending')),
    [transfers]
  );

  const handleRequestSubmit = () => {
    if (!selectedItem || !user?.schoolId) return;
    const mySchool = schools.find((s) => s.id === user.schoolId);
    if (!mySchool) return;

    const isRaw = requestSource === 'raw';
    const fromId = isRaw ? SDO_SCHOOL.id : selectedItem.schoolId;
    const fromName = isRaw ? SDO_SCHOOL.name : selectedItem.schoolName;
    const itemName = isRaw ? selectedItem.name : selectedItem.itemName;
    const itemId = isRaw ? selectedItem.itemId : selectedItem.itemId;
    const maxQty = isRaw ? selectedItem.quantity : selectedItem.surplusQuantity;
    const qty = Math.min(Math.max(1, requestQuantity), maxQty || 999);

    const refNo = `TR-2024-${String(transfers.length + 1).padStart(3, '0')}`;
    const transfer = {
      id: `mov-tr-${Date.now()}`,
      type: 'Transfer',
      schoolId: fromId,
      schoolName: fromName,
      targetSchoolId: user.schoolId,
      targetSchoolName: mySchool.name,
      status: 'Pending - SDO Approval',
      date: new Date().toISOString().split('T')[0],
      refNo,
      items: [{ itemId, itemName, quantity: qty }],
      reason: requestReason.trim() || 'Resource Hub request',
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    };
    addTransfer(transfer);
    addNotification({
      title: 'New transfer request',
      message: `${mySchool.name} requested ${qty}× ${itemName} from ${fromName}.`,
      type: 'request',
      forAdmin: true,
      transferId: transfer.id,
    });
    setSelectedItem(null);
    setRequestSource(null);
    setRequestQuantity(1);
    setRequestReason('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const openRequestDialog = (item, source) => {
    setSelectedItem(item);
    setRequestSource(source);
    setRequestQuantity(1);
    setRequestReason('');
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Resource Sharing Hub"
        subtitle={
          isAdmin
            ? 'All undistributed supplies are auto-posted here for schools to request'
            : 'View transfer activity and request supplies from the SDO warehouse'
        }
      />

      <div className="p-6 space-y-8 animate-fade-in">
        {/* Success messages */}
        {showSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Request submitted. It is logged in the Transfers tab. Admin will be notified and will accept or reject.</p>
          </div>
        )}
        {/* ========== SCHOOL VIEW: Clear two-section layout ========== */}
        {!isAdmin && (
          <>
            {/* Section 1 — VIEW: Transfer activity (visible in all school resource hubs) */}
            <Card className="border-info/30 bg-info/5 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-info/20">
                    <Eye className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">View — Transfer activity</CardTitle>
                    <CardDescription className="mt-0.5">
                      All division transfers are shown here for transparency. View only — no actions. Same list for every school.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60 sticky top-0 z-10">
                        <tr>
                          <th className="text-left p-3 font-semibold">Ref. No.</th>
                          <th className="text-left p-3 font-semibold whitespace-nowrap">Date</th>
                          <th className="text-left p-3 font-semibold">From</th>
                          <th className="text-left p-3 font-semibold">To</th>
                          <th className="text-left p-3 font-semibold">Items</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                          <th className="text-right p-3 font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransfersSorted.map((t) => (
                          <tr key={t.id} className="border-t border-border hover:bg-muted/40">
                            <td className="p-3 font-mono text-xs sm:text-sm">{t.refNo}</td>
                            <td className="p-3 whitespace-nowrap">
                              {t.date
                                ? new Date(t.date).toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[140px] sm:max-w-[200px]">{t.schoolName}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[140px] sm:max-w-[200px]">{t.targetSchoolName}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {t.items?.length
                                ? t.items.map((i, idx) => (
                                    <span key={idx}>
                                      {i.quantity}× {i.itemName}
                                      {idx < t.items.length - 1 ? '; ' : ''}
                                    </span>
                                  ))
                                : '—'}
                            </td>
                            <td className="p-3">{getStatusBadge(t.status)}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => setSelectedTransferView(t)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {allTransfersSorted.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">No transfers yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Section 2 — REQUEST: Available supplies from SDO */}
            <Card className="border-primary/30 bg-primary/5 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Request — Supplies for your school</CardTitle>
                    <CardDescription className="mt-0.5">
                      Request items from the SDO warehouse. Your request goes to Transfers for approval.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* Search and filter for request section */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SDO warehouse — requestable */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-primary" />
                    Available from SDO warehouse
                  </h4>
                  {filteredRaw.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredRaw.map((row) => (
                        <Card
                          key={row.id}
                          className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer border-2"
                          onClick={() => openRequestDialog(row, 'raw')}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <CardTitle className="text-base leading-tight">{row.name}</CardTitle>
                                <CardDescription className="mt-1">{row.code} • {row.category}</CardDescription>
                              </div>
                              <Badge className="bg-primary/20 text-primary border-0 shrink-0">SDO</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-3">
                              Available: <strong className="text-foreground">{row.quantity}</strong> {row.unit}
                            </p>
                            <Button className="w-full" variant="default" size="sm">
                              Request transfer
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 rounded-lg bg-muted/30 px-4">
                      No items available from SDO warehouse at the moment. Check back later or contact the division office.
                    </p>
                  )}
          </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ========== ADMIN VIEW ========== */}
        {isAdmin && (
          <>
            {/* Public Transfer Activity — same as schools, for admin */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  Transfer activity (transparency)
                </CardTitle>
                <CardDescription>
                  All transfers are listed here for transparency. Includes pending, approved, and rejected. View details only — no actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-semibold">Ref. No.</th>
                          <th className="text-left p-3 font-semibold whitespace-nowrap">Date</th>
                          <th className="text-left p-3 font-semibold">From</th>
                          <th className="text-left p-3 font-semibold">To</th>
                          <th className="text-left p-3 font-semibold">Items</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                          <th className="text-right p-3 font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransfersSorted.map((t) => (
                          <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                            <td className="p-3 font-mono">{t.refNo}</td>
                            <td className="p-3 whitespace-nowrap">
                              {t.date
                                ? new Date(t.date).toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[180px]">{t.schoolName}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[180px]">{t.targetSchoolName}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {t.items?.length
                                ? t.items.map((i, idx) => (
                                    <span key={idx}>
                                      {i.quantity}× {i.itemName}
                                      {idx < t.items.length - 1 ? '; ' : ''}
                                    </span>
                                  ))
                                : '—'}
                            </td>
                            <td className="p-3">{getStatusBadge(t.status)}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => setSelectedTransferView(t)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {allTransfersSorted.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">No transfers yet.</p>
                )}
              </CardContent>
            </Card>

            {pendingRequests.length > 0 && (
          <Card className="border-info/30 bg-info/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="w-5 h-5 text-info" />
                Pending requests ({pendingRequests.length})
              </CardTitle>
              <CardDescription>Accept or reject in the Transfers tab. Both you and the requesting school will get a notification.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {pendingRequests.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex justify-between items-center p-2 rounded bg-background">
                    <span>{t.targetSchoolName} — {t.items?.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}</span>
                    <Badge variant="outline" className="text-xs">{t.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

            {/* Admin: All undistributed supplies */}
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-primary" />
                Undistributed / raw supplies (auto-posted)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Same list as Inventory → SDO Warehouse. All items here are visible to schools so they can request transfers. No manual posting needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                    placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRaw.map((row) => (
                <Card key={row.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{row.name}</CardTitle>
                    <CardDescription>{row.code} • {row.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Quantity: <strong>{row.quantity}</strong> {row.unit}</p>
                    <p className="text-xs text-muted-foreground mt-1">Schools see this in the hub and can request it.</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredRaw.length === 0 && (
              <p className="text-sm text-muted-foreground">No undistributed supplies yet. Add items in Inventory → SDO Warehouse; they will appear here automatically.</p>
            )}
          </div>
          </>
        )}
      </div>

      {/* Request Transfer Dialog */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(o) => { if (!o) setSelectedItem(null); setRequestSource(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Transfer</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">{requestSource === 'raw' ? selectedItem.name : selectedItem.itemName}</p>
                <p className="text-sm text-muted-foreground">
                  From: {requestSource === 'raw' ? SDO_SCHOOL.name : selectedItem.schoolName}
                </p>
                <p className="text-sm text-success font-medium mt-1">
                  Available: {requestSource === 'raw' ? selectedItem.quantity : selectedItem.surplusQuantity} units
                </p>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  max={requestSource === 'raw' ? selectedItem.quantity : selectedItem.surplusQuantity}
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(parseInt(e.target.value, 10) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reason / Note *</Label>
                <Textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Why does your school need this?"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
            <Button
              onClick={handleRequestSubmit}
              disabled={!requestReason.trim() || requestQuantity < 1}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Public transfer detail (view only — transparency) */}
      <Dialog open={!!selectedTransferView} onOpenChange={(open) => !open && setSelectedTransferView(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex-shrink-0">
          <DialogHeader>
              <DialogTitle className="font-display">Transfer details</DialogTitle>
              <p className="text-sm text-muted-foreground">View only — for transparency.</p>
          </DialogHeader>
          </div>
          {selectedTransferView && (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Reference No.</p>
                  <p className="font-mono font-medium">{selectedTransferView.refNo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Date</p>
                  <p>
                    {selectedTransferView.date
                      ? new Date(selectedTransferView.date).toLocaleDateString('en-PH')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">From</p>
                  <p className="font-medium">{selectedTransferView.schoolName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">To</p>
                  <p className="font-medium">{selectedTransferView.targetSchoolName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Status</p>
                {getStatusBadge(selectedTransferView.status)}
              </div>
              {typeof selectedTransferView.totalAmount === 'number' && selectedTransferView.totalAmount > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Total transfer amount</p>
                  <p className="font-semibold">
                    ₱
                    {selectedTransferView.totalAmount.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
            <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {selectedTransferView.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded bg-muted"
                    >
                      <div className="flex flex-col">
                        <span>{item.itemName}</span>
                        {item.itemCode && (
                          <span className="text-xs text-muted-foreground font-mono">{item.itemCode}</span>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <span className="block font-semibold">{item.quantity}</span>
                        {typeof item.unitPrice === 'number' && item.unitPrice > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                            / {item.unit || 'unit'}
                          </span>
                        )}
                        {(typeof item.totalCost === 'number' ||
                          (typeof item.unitPrice === 'number' && item.unitPrice > 0)) && (
                          <span className="block text-xs font-semibold">
                            Total: ₱
                            {(item.totalCost ?? (item.unitPrice * item.quantity)).toLocaleString('en-PH', {
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
              {selectedTransferView.reason && (
            <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm p-2 rounded bg-muted">{selectedTransferView.reason}</p>
            </div>
              )}
              {selectedTransferView.rejectionReason && (
            <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Rejection reason</p>
                  <p className="text-sm p-2 rounded bg-destructive/10 text-destructive">
                    {selectedTransferView.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourceHub;
