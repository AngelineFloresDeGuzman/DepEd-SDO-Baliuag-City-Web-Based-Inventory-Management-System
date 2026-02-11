import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransfers } from '@/context/TransfersContext';
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
import { ArrowLeftRight, CheckCircle, XCircle, Clock, Eye, Building2, Send } from 'lucide-react';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };
const destinationSchools = schools.filter((s) => s.id !== 'sdo');

const Transfers = () => {
  const { user } = useAuth();
  const { transfers: allTransfers, addTransfer } = useTransfers();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'sdo_admin';

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const transfers = allTransfers;

  // Prototype: create transfer (admin)
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [newTransferItemId, setNewTransferItemId] = useState('');
  const [newTransferQuantity, setNewTransferQuantity] = useState(1);
  const [newTransferDestinationId, setNewTransferDestinationId] = useState('');
  const [newTransferSourceOfFund, setNewTransferSourceOfFund] = useState('');
  const [newTransferNote, setNewTransferNote] = useState('');
  const [newTransferSuccess, setNewTransferSuccess] = useState(false);

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
    const destination = destinationSchools.find((s) => s.id === newTransferDestinationId);
    if (!item || !destination || newTransferQuantity < 1) return;

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
      items: [{ itemId: item.id, itemName: item.name, quantity: newTransferQuantity }],
      reason: newTransferNote.trim() || 'Transfer from SDO warehouse.',
      sourceOfFund: newTransferSourceOfFund,
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
    setNewTransferItemId('');
    setNewTransferQuantity(1);
    setNewTransferDestinationId('');
    setNewTransferSourceOfFund('');
    setNewTransferNote('');
    setNewTransferSuccess(true);
    setTimeout(() => setNewTransferSuccess(false), 3000);
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
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransfer(transfer)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
        </div>
      </div>

      {/* Transfer Detail Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Transfer Details</DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reference No.</p>
                  <p className="font-mono font-medium">{selectedTransfer.refNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{new Date(selectedTransfer.date).toLocaleDateString('en-PH')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{selectedTransfer.schoolName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{selectedTransfer.targetSchoolName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                {getStatusBadge(selectedTransfer.status)}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {selectedTransfer.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded bg-muted"
                    >
                      <span>{item.itemName}</span>
                      <span className="font-semibold">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransfer.reason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm p-2 rounded bg-muted">
                    {selectedTransfer.reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Transfer Modal (Admin prototype) */}
      <Dialog open={showNewTransferModal} onOpenChange={setShowNewTransferModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Create Transfer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Fill this up and submit to add a transfer entry to the history list.
          </p>

          <div className="space-y-4">
            <div>
              <Label>Item *</Label>
              <Select value={newTransferItemId} onValueChange={setNewTransferItemId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.code} — {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTransferModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleNewTransferSubmit}
              disabled={!newTransferItemId || !newTransferDestinationId || !newTransferSourceOfFund || newTransferQuantity < 1}
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
