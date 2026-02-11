import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import { movements, items, schools } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeftRight,
  Package,
  Upload,
  X,
  CheckCircle,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 8;

const Transactions = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('delivery');
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [refNo, setRefNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItems, setSelectedItems] = useState([{ itemId: '', quantity: 1 }]);
  const [reason, setReason] = useState('');

  const schoolMovements = movements.filter(
    (m) => m.schoolId === user?.schoolId && m.type !== 'Transfer'
  );

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { itemId: '', quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  const handleSubmit = () => {
    // Mock submission
    console.log('Transaction:', {
      type: activeTab,
      refNo,
      date,
      items: selectedItems,
      reason,
    });

    setShowForm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Reset form
    setRefNo('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedItems([{ itemId: '', quantity: 1 }]);
    setReason('');
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Delivery':
        return (
          <Badge className="bg-success/20 text-success border-0">
            <Plus className="w-3 h-3 mr-1" />
            Delivery
          </Badge>
        );
      case 'Issue':
        return (
          <Badge className="bg-info/20 text-info border-0">
            <Minus className="w-3 h-3 mr-1" />
            Issue
          </Badge>
        );
      case 'Disposal':
        return (
          <Badge className="bg-destructive/20 text-destructive border-0">
            <Trash2 className="w-3 h-3 mr-1" />
            Disposal
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getFormTitle = () => {
    switch (activeTab) {
      case 'delivery':
        return 'Add Delivery (DR / Incoming)';
      case 'issue':
        return 'Issue Items (RIS)';
      case 'disposal':
        return 'Dispose / Damage Items';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Transactions" subtitle="Manage deliveries, issues, and disposals" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Success Message */}
        {showSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Transaction recorded successfully!</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Deliveries
              </TabsTrigger>
              <TabsTrigger value="issue" className="flex items-center gap-2">
                <Minus className="w-4 h-4" />
                Issues
              </TabsTrigger>
              <TabsTrigger value="disposal" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Disposals
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Button>
          </div>

          {/* Transaction History */}
          <TabsContent value="delivery" className="mt-4">
            <TransactionTable
              transactions={schoolMovements.filter((m) => m.type === 'Delivery')}
              getTypeBadge={getTypeBadge}
            />
          </TabsContent>
          <TabsContent value="issue" className="mt-4">
            <TransactionTable
              transactions={schoolMovements.filter((m) => m.type === 'Issue')}
              getTypeBadge={getTypeBadge}
            />
          </TabsContent>
          <TabsContent value="disposal" className="mt-4">
            <TransactionTable
              transactions={schoolMovements.filter((m) => m.type === 'Disposal')}
              getTypeBadge={getTypeBadge}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{getFormTitle()}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="refNo">Reference No. *</Label>
                <Input
                  id="refNo"
                  placeholder={
                    activeTab === 'delivery'
                      ? 'DR-2024-XXX'
                      : activeTab === 'issue'
                      ? 'RIS-2024-XXX'
                      : 'DIS-2024-XXX'
                  }
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Items Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items *</Label>
                <Button variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={item.itemId}
                      onValueChange={(v) => updateItem(index, 'itemId', v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.code} - {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                      }
                      className="w-24"
                      placeholder="Qty"
                    />

                    {selectedItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemRow(index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reason (required for issue and disposal) */}
            {(activeTab === 'issue' || activeTab === 'disposal') && (
              <div>
                <Label htmlFor="reason">Reason / Remarks *</Label>
                <Textarea
                  id="reason"
                  placeholder={
                    activeTab === 'issue'
                      ? 'Purpose of issuance...'
                      : 'Reason for disposal...'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {/* Attachment Upload */}
            <div>
              <Label>Attachment (Optional)</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click to upload (PDF, Image)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !refNo.trim() ||
                !selectedItems.some((i) => i.itemId) ||
                ((activeTab === 'issue' || activeTab === 'disposal') && !reason.trim())
              }
            >
              Submit Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Transaction Table Component
const TransactionTable = ({ transactions, getTypeBadge }) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, page]);
  useEffect(() => setPage(1), [transactions.length]);

  if (transactions.length === 0) {
    return (
      <div className="card-elevated p-8 text-center text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Ref. No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.refNo}</TableCell>
                <TableCell>
                  {new Date(t.date).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>{getTypeBadge(t.type)}</TableCell>
                <TableCell>
                  <span className="text-sm">
                    {t.items.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.createdBy}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={transactions.length}
          onPageChange={setPage}
          itemLabel="transactions"
        />
      )}
    </div>
  );
};

export default Transactions;
