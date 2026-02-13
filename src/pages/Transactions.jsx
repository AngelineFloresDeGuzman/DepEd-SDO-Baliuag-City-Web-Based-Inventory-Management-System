import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransfers } from '@/context/TransfersContext';
import Header from '@/components/layout/Header';
import { movements, schools } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeftRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 10;

const getTypeBadge = (type, status) => {
  if (type === 'Transfer') {
    switch (status) {
      case 'Pending - Receiving School':
        return (
          <Badge className="bg-info/20 text-info border-0">
            <Clock className="w-3 h-3 mr-1" />
            Transfer (Pending)
          </Badge>
        );
      case 'Pending - SDO Approval':
        return (
          <Badge className="bg-warning/20 text-warning border-0">
            <Clock className="w-3 h-3 mr-1" />
            Transfer (Pending SDO)
          </Badge>
        );
      case 'Approved':
        return (
          <Badge className="bg-success/20 text-success border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Transfer (Received)
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-destructive/20 text-destructive border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Transfer (Rejected)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-0">
            <ArrowLeftRight className="w-3 h-3 mr-1" />
            Transfer
          </Badge>
        );
    }
  }
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

const Transactions = () => {
  const { user } = useAuth();
  const { transfers } = useTransfers();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [page, setPage] = useState(1);

  const schoolId = user?.schoolId;

  // Build unified transaction history for this school only
  const schoolHistory = useMemo(() => {
    if (!schoolId) return [];

    const list = [];

    // Movements: Delivery, Issue, Disposal where this school is the one recorded
    movements
      .filter((m) => m.schoolId === schoolId)
      .forEach((m) => {
        list.push({
          id: m.id,
          type: m.type,
          date: m.date,
          refNo: m.refNo,
          items: m.items || [],
          reason: m.reason,
          createdBy: m.createdBy,
          createdAt: m.createdAt,
          schoolName: m.schoolName,
          targetSchoolId: m.targetSchoolId,
          targetSchoolName: m.targetSchoolName,
          status: m.status,
          source: 'movements',
        });
      });

    // Transfers: where this school is sender OR receiver
    transfers.forEach((t) => {
      if (t.schoolId === schoolId || t.targetSchoolId === schoolId) {
        list.push({
          id: t.id,
          type: 'Transfer',
          date: t.date,
          refNo: t.refNo,
          items: t.items || [],
          reason: t.reason,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          schoolName: t.schoolName,
          targetSchoolId: t.targetSchoolId,
          targetSchoolName: t.targetSchoolName,
          status: t.status,
          sourceOfFund: t.sourceOfFund,
          totalAmount: t.totalAmount,
          source: 'transfers',
        });
      }
    });

    list.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [schoolId, transfers]);

  const totalPages = Math.ceil(schoolHistory.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return schoolHistory.slice(start, start + PAGE_SIZE);
  }, [schoolHistory, page]);
  useEffect(() => setPage(1), [schoolHistory.length]);

  const schoolName = schoolId ? schools.find((s) => s.id === schoolId)?.name : '';

  // School-only page: show transaction history; admin doesn't use this page per sidebar
  return (
    <div className="min-h-screen">
      <Header
        title="Transaction History"
        subtitle={schoolName ? `Transactions for ${schoolName}` : 'Your school’s transaction history'}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="card-elevated overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Transaction History</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Deliveries, issues, disposals, and transfers involving your school. Click a row to view details.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Ref. No.</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTransaction(t)}
                  >
                    <TableCell className="font-mono text-sm">{t.refNo}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {t.date
                        ? new Date(t.date).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>{getTypeBadge(t.type, t.status)}</TableCell>
                    <TableCell>
                      {t.type === 'Transfer' ? (
                        <span className="text-sm">
                          {t.schoolName} → {t.targetSchoolName}
                          {t.items?.length ? ` · ${t.items.map((i) => `${i.quantity}× ${i.itemName}`).join(', ')}` : ''}
                        </span>
                      ) : (
                        <span className="text-sm">
                          {t.items?.map((i) => `${i.quantity}× ${i.itemName}`).join(', ')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {schoolHistory.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet.</p>
            </div>
          )}
          {schoolHistory.length > 0 && totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={schoolHistory.length}
              onPageChange={setPage}
              itemLabel="transactions"
            />
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Transaction details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Reference No.</p>
                  <p className="font-mono font-medium">{selectedTransaction.refNo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Date</p>
                  <p>
                    {selectedTransaction.date
                      ? new Date(selectedTransaction.date).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type</p>
                  {getTypeBadge(selectedTransaction.type, selectedTransaction.status)}
                </div>
                {selectedTransaction.type === 'Transfer' && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">From</p>
                      <p className="font-medium">{selectedTransaction.schoolName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">To</p>
                      <p className="font-medium">{selectedTransaction.targetSchoolName}</p>
                    </div>
                    {selectedTransaction.status && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Status</p>
                        <p className="text-sm">{selectedTransaction.status}</p>
                      </div>
                    )}
                    {typeof selectedTransaction.totalAmount === 'number' && selectedTransaction.totalAmount > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Total amount</p>
                        <p className="font-medium">
                          ₱{selectedTransaction.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {(selectedTransaction.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded bg-muted"
                    >
                      <span>{item.itemName}</span>
                      <span className="font-semibold">{item.quantity}</span>
                      {typeof item.unitPrice === 'number' && item.unitPrice > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ₱{(item.totalCost ?? item.unitPrice * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransaction.reason && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Reason / Remarks</p>
                  <p className="text-sm p-2 rounded bg-muted">{selectedTransaction.reason}</p>
                </div>
              )}

              {selectedTransaction.sourceOfFund && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Source of fund</p>
                  <p className="text-sm">{selectedTransaction.sourceOfFund}</p>
                </div>
              )}

              {selectedTransaction.createdBy && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Created by</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.createdBy}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
