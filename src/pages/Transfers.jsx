import React, { useState, useMemo, useEffect } from 'react';
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
import { ArrowLeftRight, CheckCircle, XCircle, Clock, Eye, Building2, Send, Trash2 } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };
const PAGE_SIZE = 10;
const destinationSchools = schools.filter((s) => s.id !== 'sdo');

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

  const transfers = allTransfers;

  // Open specific transfer when navigated from notification click
  useEffect(() => {
    const openTransferId = location.state?.openTransferId;
    if (!openTransferId || allTransfers.length === 0) return;
    const transfer = allTransfers.find((t) => t.id === openTransferId);
    if (transfer) {
      setSelectedTransfer(transfer);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openTransferId, allTransfers, navigate, location.pathname]);

  // Prototype: create transfer (admin)
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [newTransferItemId, setNewTransferItemId] = useState('');
  const [newTransferQuantity, setNewTransferQuantity] = useState(1);
  const [newTransferDestinationId, setNewTransferDestinationId] = useState('');
  const [newTransferSourceOfFund, setNewTransferSourceOfFund] = useState('');
  const [newTransferNote, setNewTransferNote] = useState('');
  const [newTransferSuccess, setNewTransferSuccess] = useState(false);

  const resetNewTransferForm = () => {
    setNewTransferItemId('');
    setNewTransferQuantity(1);
    setNewTransferDestinationId('');
    setNewTransferSourceOfFund('');
    setNewTransferNote('');
  };

  // Aggregate SDO warehouse stock by item to derive available quantity and average unit price
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

  const filteredTransfers = transfers.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    if (isAdmin) {
      return matchesStatus;
    }

    // School user: show transfers involving their school
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

  const handleNewTransferSubmit = () => {
    const item = items.find((i) => i.id === newTransferItemId);
    const stats = newTransferItemId ? warehouseStatsByItemId[newTransferItemId] : null;
    const destination = destinationSchools.find((s) => s.id === newTransferDestinationId);
    const availableQty = stats?.totalQuantity || 0;
    if (!item || !destination || newTransferQuantity < 1 || newTransferQuantity > availableQty) {
      return;
    }

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
      title: 'Transfer created',
      message: `SDO created transfer ${refNo}: ${newTransferQuantity}× ${item.name} → ${destination.name}.`,
      type: 'transfer',
      forAdmin: true,
      transferId: transfer.id,
    });
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

  const canCurrentUserActOnTransfer = (transfer) => {
    if (!transfer || isAdmin || !user || user.role !== 'school_user') return false;
    // Only allow receiving school to act on SDO-initiated transfers that are pending at receiver
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
      (typeof item.unitPrice === 'number' && item.unitPrice >= 0
        ? item.unitPrice
        : stats?.unitPrice) || 0;
    const totalCost =
      (typeof item.totalCost === 'number' && item.totalCost >= 0
        ? item.totalCost
        : Number((unitPrice * item.quantity).toFixed(2))) || 0;

    // Deduct from SDO warehouse (raw inventory) based on this itemId
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

    // Add to receiving school's inventory so it appears in Inventory tab
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
      message: `${transfer.targetSchoolName || 'Receiving school'} marked transfer ${
        transfer.refNo
      } as received (${item.quantity}× ${item.itemName}).`,
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
    // Only allow deleting SDO-initiated, in-memory transfers (id with mov-tr-)
    return transfer.schoolId === SDO_SCHOOL.id && typeof transfer.id === 'string' && transfer.id.startsWith('mov-tr-');
  };

  const handleDeleteTransfer = () => {
    if (!selectedTransfer) return;
    if (!canAdminDeleteTransfer(selectedTransfer)) {
      setSelectedTransfer(null);
      return;
    }
    removeTransfer(selectedTransfer.id);
    setSelectedTransfer(null);
  };

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

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Success message */}
        {newTransferSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">
              Transfer created. It should now appear in the history list.
            </p>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending - Receiving School">
                  Pending - Receiver
                </SelectItem>
                <SelectItem value="Pending - SDO Approval">Pending - SDO</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <Button onClick={() => setShowNewTransferModal(true)}>
              <Send className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          )}
        </div>

        {/* Transfer History */}
        <div className="card-elevated p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">
            Transfer History
          </h3>
          <p className="text-sm text-muted-foreground">
            View the history of all transfers between schools. This page is read-only.
          </p>
        </div>

        {/* Transfers Table (History) */}
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
                {paginatedTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono text-sm">
                      {transfer.refNo}
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
                          onClick={() => setSelectedTransfer(transfer)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Transfer Detail Dialog */}
      <Dialog
        open={!!selectedTransfer}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransfer(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="font-display">Transfer Details</DialogTitle>
            </DialogHeader>
          </div>

          {selectedTransfer && (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
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
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Status</p>
                {getStatusBadge(selectedTransfer.status)}
              </div>

              {typeof selectedTransfer.totalAmount === 'number' && selectedTransfer.totalAmount > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Total Transfer Amount
                  </p>
                  <p className="text-sm font-semibold">
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
                      className="flex justify-between items-center p-2 rounded bg-muted"
                    >
                      <div className="flex flex-col">
                        <span>{item.itemName}</span>
                        {item.itemCode && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.itemCode}
                          </span>
                        )}
                      </div>
                      <div className="text-right space-y-1">
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
                            Total:{' '}
                            ₱
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
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm p-2 rounded bg-muted">
                    {selectedTransfer.reason}
                  </p>
                </div>
              )}

              {selectedTransfer.rejectionReason && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm p-2 rounded bg-destructive/10 text-destructive">
                    {selectedTransfer.rejectionReason}
                  </p>
                </div>
              )}

              {canCurrentUserActOnTransfer(selectedTransfer) && (
                <div className="flex justify-end border-t border-border pt-3 mt-2">
                  <Button onClick={handleMarkAsReceivedFromDialog}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Received
                  </Button>
                </div>
              )}

              {canAdminDeleteTransfer(selectedTransfer) && (
                <div className="flex justify-end border-t border-border pt-3 mt-2">
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

      {/* New Transfer Modal (Admin prototype) */}
      <Dialog
        open={showNewTransferModal}
        onOpenChange={(open) => {
          setShowNewTransferModal(open);
          if (!open) {
            resetNewTransferForm();
          }
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
              <Select value={newTransferItemId} onValueChange={setNewTransferItemId}>
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
                          {i.code} — {i.name}{' '}
                          {stats
                            ? ` (Available: ${stats.totalQuantity} ${i.unit})`
                            : ''}
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
                  <p className="text-sm">
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
                  value={newTransferQuantity}
                  onChange={(e) =>
                    setNewTransferQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="mt-1"
                />
                {selectedWarehouseStats && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Max: {selectedWarehouseStats.totalQuantity} {selectedItemMeta?.unit}
                  </p>
                )}
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
              <Label>Note</Label>
              <Textarea
                placeholder="Optional note..."
                value={newTransferNote}
                onChange={(e) => setNewTransferNote(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
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
                (selectedWarehouseStats &&
                  newTransferQuantity > selectedWarehouseStats.totalQuantity)
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
