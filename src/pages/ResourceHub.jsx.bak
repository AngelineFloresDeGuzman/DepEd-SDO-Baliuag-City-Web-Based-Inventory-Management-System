import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRawInventory } from '@/context/RawInventoryContext';
import { useSchoolInventory } from '@/context/SchoolInventoryContext';
import { useTransfers } from '@/context/TransfersContext';
import { useNotifications } from '@/context/NotificationsContext';
import Header from '@/components/layout/Header';
import TransferStatusIndicator from '@/components/ui/transfer-status-indicator';
import { schools } from '@/data/mockData';
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
  TrendingUp,
  Heart,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Zap,
  History,
  Truck,
  Loader2,
  Check,
  X,
} from 'lucide-react';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };

const ResourceHub = () => {
  const { user } = useAuth();
  const { rawInventory, updateRawEntry } = useRawInventory();
  const { getSchoolInventory } = useSchoolInventory();
  const schoolInventory = user?.schoolId ? getSchoolInventory(user.schoolId) : [];
  const { addTransfer, transfers, updateTransferStatus } = useTransfers();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'sdo_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [requestSource, setRequestSource] = useState(null); // SDO warehouse source only
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestReason, setRequestReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestUrgency, setRequestUrgency] = useState('normal'); // 'normal' | 'urgent' | 'critical'
  const [viewRequestHistory, setViewRequestHistory] = useState(false);

  // Public transfer log (transparency) — view only
  const [selectedTransferView, setSelectedTransferView] = useState(null);
  
  // For approve/reject dialog
  const [showApproveRejectDialog, setShowApproveRejectDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingTransfer, setProcessingTransfer] = useState(false);

  // For mark as received dialog
  const [showMarkReceivedDialog, setShowMarkReceivedDialog] = useState(false);
  const [transferToMarkReceived, setTransferToMarkReceived] = useState(null);
  const [receivedNotes, setReceivedNotes] = useState('');
  const [processingReceived, setProcessingReceived] = useState(false);

  // For cancel request confirmation dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [transferToCancel, setTransferToCancel] = useState(null);

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
      case 'In Transit':
        return (
          <Badge className="bg-primary/20 text-primary border-0">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            In Transit
          </Badge>
        );
      case 'Transferring':
        return (
          <Badge className="bg-primary/20 text-primary border-0">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Transferring
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
      case 'Received':
        return (
          <Badge className="bg-success/20 text-success border-0">
            <Check className="w-3 h-3 mr-1" />
            Received
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
    () => [...new Set(rawInventory.map((r) => r.category))],
    [rawInventory]
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

  // ===== NEW: Statistics & Insights =====
  const stats = useMemo(() => {
    const totalItemsAvailable = filteredRaw.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const schoolRequests = transfers.filter((t) => t.targetSchoolId === user?.schoolId);
    const requestsByItem = {};
    transfers.forEach((t) => {
      t.items?.forEach((item) => {
        requestsByItem[item.itemName] = (requestsByItem[item.itemName] || 0) + item.quantity;
      });
    });
    const mostRequested = Object.entries(requestsByItem)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    return {
      totalItemsAvailable,
      totalPendingRequests: pendingRequests.length,
      schoolRequestCount: schoolRequests.length,
      mostRequested,
      totalCompletedTransfers: transfers.filter(t => t.status === 'Received' || t.status === 'In Transit' || t.status === 'Approved').length,
      totalAllTransfers: transfers.length,
    };
  }, [filteredRaw, transfers, pendingRequests, user?.schoolId]);

  // ===== NEW: Request history for schools =====
  const myRequestHistory = useMemo(() => {
    if (!user?.schoolId || isAdmin) return [];
    return transfers
      .filter((t) => t.targetSchoolId === user.schoolId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transfers, user?.schoolId, isAdmin]);



  // ===== NEW: Sample announcements (would come from a context in production) =====
  const announcements = [
    {
      id: 1,
      icon: 'star',
      title: 'New Equipment Available',
      message: '5 Printer Epson L121 units now available from SDO warehouse',
      type: 'info',
      date: '2024-01-28',
    },
    {
      id: 2,
      icon: 'alert',
      title: 'Limited Supplies',
      message: 'Office Supplies stock is running low. Place requests early!',
      type: 'warning',
      date: '2024-01-27',
    },
  ];

  const handleRequestSubmit = () => {
    if (!selectedItem || !user?.schoolId) return;
    const mySchool = schools.find((s) => s.id === user.schoolId);
    if (!mySchool) return;

    const itemName = selectedItem.name;
    const itemId = selectedItem.itemId;
    const maxQty = selectedItem.quantity;
    const qty = Math.min(Math.max(1, requestQuantity), maxQty || 999);

    const refNo = `TR-2024-${String(transfers.length + 1).padStart(3, '0')}`;
    const transfer = {
      id: `mov-tr-${Date.now()}`,
      type: 'Transfer',
      schoolId: SDO_SCHOOL.id,
      schoolName: SDO_SCHOOL.name,
      targetSchoolId: user.schoolId,
      targetSchoolName: mySchool.name,
      status: 'Pending - SDO Approval',
      date: new Date().toISOString().split('T')[0],
      refNo,
      items: [{ itemId, itemName, quantity: qty }],
      reason: requestReason.trim() || 'Resource Hub request',
      urgency: requestUrgency,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    };
    addTransfer(transfer);
    addNotification({
      title: 'New transfer request',
      message: `${mySchool.name} requested ${qty}× ${itemName} from ${SDO_SCHOOL.name}.`,
      type: 'request',
      forAdmin: true,
      transferId: transfer.id,
    });
    setSelectedItem(null);
    setRequestSource(null);
    setRequestQuantity(1);
    setRequestReason('');
    setRequestUrgency('normal');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const openRequestDialog = (item, source) => {
    setSelectedItem(item);
    setRequestSource(source);
    setRequestQuantity(1);
    setRequestReason('');
  };

  // Handle cancel request with confirmation
  const handleCancelRequest = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelRequest = () => {
    setSelectedItem(null);
    setRequestSource(null);
    setRequestQuantity(1);
    setRequestReason('');
    setRequestUrgency('normal');
    setShowCancelConfirm(false);
  };

  // Handle approve/reject actions
  const handleApproveClick = (transfer) => {
    setSelectedTransfer(transfer);
    setActionType('approve');
    setRejectionReason('');
    setShowApproveRejectDialog(true);
  };

  const handleRejectClick = (transfer) => {
    setSelectedTransfer(transfer);
    setActionType('reject');
    setRejectionReason('');
    setShowApproveRejectDialog(true);
  };

  const handleApproveRejectConfirm = () => {
    if (!selectedTransfer || !actionType) return;
    
    setProcessingTransfer(true);
    
    const newStatus = actionType === 'approve' ? 'In Transit' : 'Rejected';
    const extraUpdates = actionType === 'reject' ? { rejectionReason: rejectionReason.trim() || 'Request rejected by SDO' } : {};
    
    setTimeout(() => {
      updateTransferStatus(selectedTransfer.id, newStatus, extraUpdates);
      
      // Deduct quantity from SDO warehouse when approved
      if (actionType === 'approve' && selectedTransfer.items) {
        selectedTransfer.items.forEach((item) => {
          const rawItem = rawInventory.find((r) => r.itemId === item.itemId || r.name === item.itemName);
          if (rawItem) {
            const newQty = Math.max(0, (rawItem.quantity || 0) - item.quantity);
            updateRawEntry(rawItem.id, { quantity: newQty });
          }
        });
      }
      
      addNotification({
        title: actionType === 'approve' ? 'Transfer Approved' : 'Transfer Rejected',
        message: actionType === 'approve' 
          ? `${selectedTransfer.items?.map(i => i.itemName).join(', ')} approved for ${selectedTransfer.targetSchoolName}`
          : `Transfer request rejected for ${selectedTransfer.targetSchoolName}`,
        type: actionType === 'approve' ? 'approval' : 'rejection',
        // Notify the requesting school and the requesting user directly so they receive the update
        forAdmin: false,
        forSchoolId: selectedTransfer.targetSchoolId,
        forUserId: selectedTransfer.createdBy,
        transferId: selectedTransfer.id,
      });
      
      setProcessingTransfer(false);
      setShowApproveRejectDialog(false);
      setSelectedTransfer(null);
      setActionType(null);
      setRejectionReason('');
    }, 500);
  };

  // Handle mark as received
  const handleMarkReceivedClick = (transfer) => {
    setTransferToMarkReceived(transfer);
    setReceivedNotes('');
    setShowMarkReceivedDialog(true);
  };

  const handleMarkReceivedConfirm = () => {
    if (!transferToMarkReceived) return;
    
    setProcessingReceived(true);
    
    setTimeout(() => {
      updateTransferStatus(transferToMarkReceived.id, 'Received', {
        receivedAt: new Date().toISOString(),
        receivedNotes: receivedNotes.trim(),
      });
      
      addNotification({
        title: 'Transfer Received',
        message: `${transferToMarkReceived.items?.map(i => i.itemName).join(', ')} received by ${transferToMarkReceived.targetSchoolName}`,
        type: 'approval',
        forAdmin: true,
        transferId: transferToMarkReceived.id,
      });
      
      setProcessingReceived(false);
      setShowMarkReceivedDialog(false);
      setTransferToMarkReceived(null);
      setReceivedNotes('');
    }, 500);
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
        {/* ========== NEW: Announcements Banner (Schools Only) ========== */}
        {!isAdmin && announcements.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            {announcements.map((ann, idx) => (
              <div
                key={ann.id}
                className={`p-4 rounded-lg border flex items-center gap-3 transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left duration-500 ${
                  ann.type === 'warning'
                    ? 'bg-warning/10 border-warning/30'
                    : 'bg-info/10 border-info/30'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {ann.type === 'warning' ? (
                  <AlertCircle className={`w-5 h-5 ${ann.type === 'warning' ? 'text-warning' : 'text-info'} shrink-0`} />
                ) : (
                  <Lightbulb className="w-5 h-5 text-info shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{ann.title}</p>
                  <p className="text-sm text-muted-foreground">{ann.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success messages */}
        {showSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Request submitted. It is logged in the Transfers tab. Admin will be notified and will accept or reject.</p>
          </div>
        )}

        {/* ========== NEW: Statistics Dashboard (School View) ========== */}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Available Items Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0ms' }}>
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 transition-all duration-300 hover:shadow-lg hover:border-primary/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Available Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {rawInventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Units available from SDO</p>
                </CardContent>
              </Card>
            </div>

            {/* Approved Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '75ms' }}>
              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 transition-all duration-300 hover:shadow-lg hover:border-success/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Approved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myRequestHistory.filter(r => r.status === 'Approved' || r.status === 'In Transit' || r.status === 'Received').length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Approved & delivered</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 transition-all duration-300 hover:shadow-lg hover:border-warning/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myRequestHistory.filter(r => r.status?.includes('Pending')).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting SDO approval</p>
                </CardContent>
              </Card>
            </div>

            {/* Rejected Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '225ms' }}>
              <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 transition-all duration-300 hover:shadow-lg hover:border-destructive/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    Rejected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myRequestHistory.filter(r => r.status === 'Rejected').length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requests not approved</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ========== NEW: Admin Statistics ========== */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-primary" />
                  Available Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItemsAvailable}</div>
                <p className="text-xs text-muted-foreground mt-1">Units in warehouse</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPendingRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 transition-all duration-300 hover:shadow-lg hover:border-success/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Completed Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompletedTransfers}</div>
                <p className="text-xs text-muted-foreground mt-1">Approved, in transit, or delivered</p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* ========== NEW: Request History View (Schools Only) ========== */}
        {!isAdmin && (
          <Card className="border-info/30 bg-info/5">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-info/20">
                  <History className="w-5 h-5 text-info" />
                </div>
                <div>
                  <CardTitle className="text-lg">Your Request History</CardTitle>
                  <CardDescription className="mt-0.5">
                    Track all your transfer requests
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewRequestHistory(!viewRequestHistory)}
              >
                {viewRequestHistory ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {viewRequestHistory && (
              <CardContent className="pt-4 space-y-4">
                {myRequestHistory.length > 0 ? (
                  <>
                    {/* Active/Recent Transfer Status Indicator */}
                    {myRequestHistory[0] && (myRequestHistory[0].status?.includes('Pending') || myRequestHistory[0].status === 'In Transit' || myRequestHistory[0].status === 'Approved') && (
                      <div className="p-4 rounded-lg bg-white/50 border border-info/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-muted-foreground">Current Transfer Status</p>
                          <p className="text-xs text-muted-foreground">{myRequestHistory[0].date && new Date(myRequestHistory[0].date).toLocaleDateString('en-PH')}</p>
                        </div>
                        <p className="text-sm font-medium">
                          {myRequestHistory[0].items?.map(i => i.itemName).join(', ')}
                        </p>
                        <TransferStatusIndicator 
                          status={myRequestHistory[0].status}
                          urgency={myRequestHistory[0].urgency}
                        />
                        {myRequestHistory[0].status === 'In Transit' && (
                          <Button
                            onClick={() => handleMarkReceivedClick(myRequestHistory[0])}
                            className="w-full mt-4 bg-success/20 text-success hover:bg-success/30 border border-success/50"
                            variant="outline"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Received
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Full Request History List */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground px-1">All Requests</p>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {myRequestHistory.slice(0, 10).map((req) => (
                          <div key={req.id} className="p-3 rounded-lg bg-background border border-border flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm">{req.items?.map(i => i.itemName).join(', ')}</p>
                              <p className="text-xs text-muted-foreground">{req.date}</p>
                            </div>
                            <div className="text-right ml-2">{getStatusBadge(req.status)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No requests yet.</p>
                )}
              </CardContent>
            )}
          </Card>
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
                          <th className="text-left p-3 font-semibold">Urgency</th>
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
                            <td className="p-3">
                              {t.urgency ? (
                                <Badge className={`
                                  ${t.urgency === 'critical' ? 'bg-destructive/20 text-destructive border-0' : ''}
                                  ${t.urgency === 'urgent' ? 'bg-warning/20 text-warning border-0' : ''}
                                  ${t.urgency === 'normal' ? 'bg-primary/20 text-primary border-0' : ''}
                                `}>
                                  {t.urgency === 'critical' && <AlertCircle className="w-3 h-3 mr-1" />}
                                  {t.urgency === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                                  {t.urgency.charAt(0).toUpperCase() + t.urgency.slice(1)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
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
                      {filteredRaw.map((row, idx) => (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${(idx % 6) * 50}ms` }}>
                        <Card
                          key={row.id}
                          className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer border-2 h-full"
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
                            <Button className="w-full" variant="default" size="sm" onClick={() => openRequestDialog(row, 'raw')}>
                              Request transfer
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                        </div>
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

            {/* NEW: FAQ/Guidelines Section */}
            <Card className="border-blue/30 bg-blue/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Resource Sharing Guidelines & FAQ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>How do I request items from SDO warehouse?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    Go to the "Request — Supplies for your school" section, browse available items from the SDO warehouse, click on an item card, enter the quantity needed, select urgency level, provide a reason, then submit. Your request will be logged and sent to SDO for approval.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>Can I request multiple items at once?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    No, each request is for one item only. You need to submit separate requests for each item. However, you can submit multiple requests one after another. Each request will be processed individually by the SDO.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>What are urgency levels and why do they matter?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    When requesting, you can mark your request as <strong>Normal</strong>, <strong>Urgent</strong>, or <strong>Critical</strong>. Urgent and critical requests get priority during the approval process. Use Critical only for emergencies or essential needs.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>How long does approval take?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    Typically 1-3 business days. You can track your request status in the "View — Transfer activity" section or check "Your Request History". You will also receive notifications when your request status changes.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>What happens after my request is approved?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    Once approved by SDO, the status changes to "In Transit." The items will be delivered to your school. You can track the delivery status in the "View — Transfer activity" section.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>What if my request is rejected?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    If rejected, the status will show as "Rejected" with a red badge. The rejection reason will be shown in the transfer details. You may contact the SDO for clarification or resubmit a new request with modifications.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>How do I view all transfer activities?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    Go to the "View — Transfer activity" section to see all division transfers. This is a transparent view showing all requests across schools. You can also click on "Details" to see full information about any transfer.
                  </p>
                </details>

                <details className="group">
                  <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span>Who can approve or reject transfer requests?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                    Only SDO Administrators can approve or reject transfer requests. Schools can only submit requests and view the status. When a request is approved, it changes to "In Transit"; when rejected, it shows "Rejected" with a reason.
                  </p>
                </details>
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
              <CardDescription>Approve or reject transfer requests directly from here.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {pendingRequests.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex justify-between items-center p-3 rounded bg-background border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{t.targetSchoolName}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.items?.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 text-success border-success/30 hover:bg-success/10 hover:text-success"
                        onClick={() => handleApproveClick(t)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRejectClick(t)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
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
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  From: {SDO_SCHOOL.name}
                </p>
                <p className="text-sm text-success font-medium mt-1">
                  Available: {selectedItem.quantity} units
                </p>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedItem.quantity}
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(parseInt(e.target.value, 10) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Urgency Level</Label>
                <Select value={requestUrgency} onValueChange={setRequestUrgency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      <span className="flex items-center gap-2">Normal</span>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <span className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        Urgent
                      </span>
                    </SelectItem>
                    <SelectItem value="critical">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Critical
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Urgent requests get priority in approval</p>
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
            <Button variant="outline" onClick={handleCancelRequest}>Cancel</Button>
            <Button
              onClick={handleRequestSubmit}
              disabled={!requestReason.trim() || requestQuantity < 1}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={(open) => !open && setShowCancelConfirm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Discard Request?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to discard this request? Any information you've entered will be lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancelRequest}>
              <X className="w-4 h-4 mr-2" />
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Confirmation Dialog */}
      <Dialog open={showApproveRejectDialog} onOpenChange={(open) => !open && setShowApproveRejectDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  Approve Transfer Request
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  Reject Transfer Request
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4">
              {/* Transfer Summary */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">School:</span>
                  <span className="font-medium">{selectedTransfer.targetSchoolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Items:</span>
                  <span className="font-medium text-right">
                    {selectedTransfer.items?.map((i) => `${i.itemName} (${i.quantity})`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Urgency:</span>
                  <span className="font-medium capitalize">{selectedTransfer.urgency || 'Normal'}</span>
                </div>
              </div>

              {/* Rejection Reason (only for reject) */}
              {actionType === 'reject' && (
                <div>
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Action confirmation message */}
              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                <p className="text-sm text-info">
                  {actionType === 'approve'
                    ? 'Approving this request will change the status to "In Transit" and notify the requesting school.'
                    : 'Rejecting this request will notify the requesting school with your reason.'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleApproveRejectConfirm}
              disabled={processingTransfer || (actionType === 'reject' && !rejectionReason.trim())}
            >
              {processingTransfer ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === 'approve' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Approval
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
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
              <div className="p-4 rounded-lg bg-muted/30 border border-muted">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Transfer Status</p>
                <TransferStatusIndicator 
                  status={selectedTransferView.status} 
                  urgency={selectedTransferView.urgency}
                />
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
              
              {/* Mark as Received button for schools when transfer is in transit */}
              {!isAdmin && selectedTransferView.status === 'In Transit' && selectedTransferView.targetSchoolId === user?.schoolId && (
                <div className="pt-4 border-t border-border space-y-2">
                  <Button
                    onClick={() => handleMarkReceivedClick(selectedTransferView)}
                    className="w-full bg-success/20 text-success hover:bg-success/30 border border-success/50"
                    variant="outline"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Received
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Received Confirmation Dialog */}
      <Dialog open={showMarkReceivedDialog} onOpenChange={(open) => !open && setShowMarkReceivedDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              Confirm Receipt
            </DialogTitle>
          </DialogHeader>

          {transferToMarkReceived && (
            <div className="space-y-4">
              {/* Transfer Summary */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Items:</span>
                  <span className="font-semibold">{transferToMarkReceived.items?.map(i => i.itemName).join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quantity:</span>
                  <span className="font-semibold">{transferToMarkReceived.items?.reduce((sum, i) => sum + i.quantity, 0)} units</span>
                </div>
              </div>

              {/* Received Notes */}
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={receivedNotes}
                  onChange={(e) => setReceivedNotes(e.target.value)}
                  placeholder="Add any notes about the received items (e.g., condition, discrepancies, etc.)"
                  className="mt-1"
                />
              </div>

              {/* Confirmation message */}
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success">
                  By confirming receipt, you acknowledge that your school has received all items listed above in good condition.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkReceivedDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkReceivedConfirm}
              disabled={processingReceived}
              className="bg-success hover:bg-success/90"
            >
              {processingReceived ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Receipt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourceHub;
