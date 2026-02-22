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
  Building2,
  CheckCircle,
  Warehouse,
  Eye,
  Clock,
  XCircle,
  ArrowLeftRight,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Zap,
  Loader2,
  Check,
  Gift,
} from 'lucide-react';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };

const ResourceHub = () => {
  const { user } = useAuth();
  const { rawInventory, updateRawEntry } = useRawInventory();
  const { getSchoolInventory } = useSchoolInventory();
  const { addTransfer, transfers, updateTransferStatus } = useTransfers();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'sdo_admin';

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Public transfer log (transparency) — view only
  const [selectedTransferView, setSelectedTransferView] = useState(null);
  
  // For mark as received dialog
  const [showMarkReceivedDialog, setShowMarkReceivedDialog] = useState(false);
  const [transferToMarkReceived, setTransferToMarkReceived] = useState(null);
  const [receivedNotes, setReceivedNotes] = useState('');
  const [processingReceived, setProcessingReceived] = useState(false);

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
      case 'Allocated':
        return (
          <Badge className="bg-primary/20 text-primary border-0">
            <Gift className="w-3 h-3 mr-1" />
            Allocated
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

  // Statistics
  const stats = useMemo(() => {
    const totalItemsAvailable = filteredRaw.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return {
      totalItemsAvailable,
      totalCompletedTransfers: transfers.filter(t => t.status === 'Received' || t.status === 'In Transit' || t.status === 'Approved').length,
      totalAllTransfers: transfers.length,
    };
  }, [filteredRaw, transfers]);

  // My Allocations - items allocated to this school by SDO
  const myAllocations = useMemo(() => {
    if (!user?.schoolId || isAdmin) return [];
    return transfers
      .filter((t) => t.targetSchoolId === user.schoolId && (t.type === 'Allocation' || t.status === 'Allocated'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transfers, user?.schoolId, isAdmin]);

  // Sample announcements
  const announcements = [
    {
      id: 1,
      icon: 'star',
      title: 'New Equipment Available',
      message: '5 Printer Epson L121 units now available from SDO warehouse',
      type: 'info',
      date: '2024-01-28',
    },
  ];

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

  // SDO Admin allocation
  const [allocateSelection, setAllocateSelection] = useState(null);
  const [allocateSchool, setAllocateSchool] = useState('');
  const [allocateQty, setAllocateQty] = useState(0);
  
  // Allocation method: 'manual' or 'bulk'
  const [allocationMethod, setAllocationMethod] = useState('manual');
  const [bulkTotalQty, setBulkTotalQty] = useState(0);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [bulkPerSchool, setBulkPerSchool] = useState(0);

  // Calculate bulk even split allocation
  const calculateBulkAllocation = () => {
    if (bulkTotalQty > 0 && selectedSchools.length > 0) {
      const perSchool = Math.floor(bulkTotalQty / selectedSchools.length);
      setBulkPerSchool(perSchool);
    } else {
      setBulkPerSchool(0);
    }
  };

  // Handle manual single school allocation
  const handleAllocateToSchool = () => {
    if (!allocateSelection || !allocateSchool || allocateQty <= 0) return;
    const rawItem = rawInventory.find((r) => r.itemId === allocateSelection.itemId || r.id === allocateSelection.id);
    if (!rawItem) return addNotification({ title: 'Allocation Failed', message: 'Selected resource not found', type: 'error', forAdmin: true });
    const qty = Number(allocateQty);
    if ((rawItem.quantity || 0) < qty) return addNotification({ title: 'Allocation Failed', message: 'Insufficient stock', type: 'error', forAdmin: true });

    updateRawEntry(rawItem.id, { quantity: Math.max(0, (rawItem.quantity || 0) - qty) });

    const allocation = {
      id: `alloc-${Date.now()}`,
      type: 'Allocation',
      schoolId: SDO_SCHOOL.id,
      schoolName: SDO_SCHOOL.name,
      targetSchoolId: allocateSchool,
      targetSchoolName: schools.find(s => s.id === allocateSchool)?.name || allocateSchool,
      status: 'Allocated',
      date: new Date().toISOString().split('T')[0],
      refNo: `AL-${String(transfers.length + 1).padStart(4, '0')}`,
      items: [{ itemId: rawItem.itemId, itemName: rawItem.name, quantity: qty }],
      source: rawItem.source || 'Central Office',
      allocationId: `AL-${Date.now()}`,
      createdBy: user?.uid,
    };
    addTransfer(allocation);
    addNotification({ title: 'Resource Allocated', message: `${qty}× ${rawItem.name} allocated to ${allocation.targetSchoolName}`, type: 'allocation', forAdmin: true, forSchoolId: allocateSchool, transferId: allocation.id });

    setAllocateSelection(null);
    setAllocateSchool('');
    setAllocateQty(0);
  };

  // Handle bulk even split allocation
  const handleBulkAllocate = () => {
    if (!allocateSelection || bulkPerSchool <= 0 || selectedSchools.length === 0) return;
    const rawItem = rawInventory.find((r) => r.itemId === allocateSelection.itemId || r.id === allocateSelection.id);
    if (!rawItem) return addNotification({ title: 'Allocation Failed', message: 'Selected resource not found', type: 'error', forAdmin: true });
    
    const totalNeeded = bulkPerSchool * selectedSchools.length;
    if ((rawItem.quantity || 0) < totalNeeded) return addNotification({ title: 'Allocation Failed', message: `Insufficient stock. Need ${totalNeeded}, have ${rawItem.quantity}`, type: 'error', forAdmin: true });

    // Update raw inventory
    updateRawEntry(rawItem.id, { quantity: Math.max(0, (rawItem.quantity || 0) - totalNeeded) });

    // Create allocations for each selected school
    selectedSchools.forEach((schoolId, index) => {
      const allocation = {
        id: `alloc-${Date.now()}-${index}`,
        type: 'Allocation',
        schoolId: SDO_SCHOOL.id,
        schoolName: SDO_SCHOOL.name,
        targetSchoolId: schoolId,
        targetSchoolName: schools.find(s => s.id === schoolId)?.name || schoolId,
        status: 'Allocated',
        date: new Date().toISOString().split('T')[0],
        refNo: `AL-${String(transfers.length + index + 1).padStart(4, '0')}`,
        items: [{ itemId: rawItem.itemId, itemName: rawItem.name, quantity: bulkPerSchool }],
        source: rawItem.source || 'Central Office',
        allocationId: `AL-${Date.now()}-${index}`,
        createdBy: user?.uid,
      };
      addTransfer(allocation);
      addNotification({ 
        title: 'Resource Allocated', 
        message: `${bulkPerSchool}× ${rawItem.name} allocated to ${allocation.targetSchoolName}`, 
        type: 'allocation', 
        forAdmin: true, 
        forSchoolId: schoolId, 
        transferId: allocation.id 
      });
    });

    // Reset form
    setAllocateSelection(null);
    setBulkTotalQty(0);
    setSelectedSchools([]);
    setBulkPerSchool(0);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Resource Sharing Hub"
        subtitle={
          isAdmin
            ? 'Manage resource allocations to schools'
            : 'View allocations assigned to your school'
        }
      />

      <div className="p-6 space-y-8 animate-fade-in">
        {/* Announcements Banner */}
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

        {/* SDO Admin Panel: Allocate Resources to Schools */}
        {isAdmin && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                SDO Allocation Editor
              </CardTitle>
              <CardDescription>
                Allocate resources to schools using manual per-school allocation or bulk even split method.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Allocation Method Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={allocationMethod === 'manual' ? 'default' : 'outline'}
                  onClick={() => setAllocationMethod('manual')}
                  className="flex-1"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Manual Allocation
                </Button>
                <Button
                  variant={allocationMethod === 'bulk' ? 'default' : 'outline'}
                  onClick={() => setAllocationMethod('bulk')}
                  className="flex-1"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Bulk Even Split
                </Button>
              </div>

              {/* Resource Selection */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Select Resource</Label>
                <Select 
                  value={allocateSelection ? allocateSelection.id : ''} 
                  onValueChange={(val) => {
                    setAllocateSelection(filteredRaw.find(r => r.id === val) || null);
                    calculateBulkAllocation();
                  }}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a resource from warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRaw.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} — {r.quantity} {r.unit} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Allocation Mode */}
              {allocationMethod === 'manual' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Select School</Label>
                    <Select value={allocateSchool} onValueChange={setAllocateSchool}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.filter(s => s.id !== 'sdo').map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Quantity to Allocate</Label>
                    <Input 
                      type="number" 
                      placeholder="Enter quantity" 
                      value={allocateQty} 
                      onChange={(e) => setAllocateQty(Number(e.target.value))}
                      className="mt-1"
                    />
                    {allocateSelection && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {allocateSelection.quantity} {allocateSelection.unit}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleAllocateToSchool}
                      disabled={!allocateSelection || !allocateSchool || allocateQty <= 0}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Allocate to School
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk Even Split Mode */}
              {allocationMethod === 'bulk' && allocateSelection && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Resource:</span>
                        <p className="font-semibold">{allocateSelection.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Available:</span>
                        <p className="font-semibold">{allocateSelection.quantity} {allocateSelection.unit}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Total Quantity to Distribute</Label>
                    <Input 
                      type="number" 
                      placeholder="Enter total quantity to distribute"
                      value={bulkTotalQty}
                      onChange={(e) => {
                        setBulkTotalQty(Number(e.target.value));
                        calculateBulkAllocation();
                      }}
                      className="mt-1"
                    />
                  </div>

                  {selectedSchools.length > 0 && bulkPerSchool > 0 && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-sm font-semibold text-success">
                        Each school will receive: {bulkPerSchool} {allocateSelection.unit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedSchools.length} schools × {bulkPerSchool} = {bulkPerSchool * selectedSchools.length} total
                      </p>
                    </div>
                  )}

                  {/* School Selection for Bulk */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Select Schools to Receive</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedSchools.length === schools.filter(s => s.id !== 'sdo').length) {
                            setSelectedSchools([]);
                          } else {
                            setSelectedSchools(schools.filter(s => s.id !== 'sdo').map(s => s.id));
                          }
                        }}
                      >
                        {selectedSchools.length === schools.filter(s => s.id !== 'sdo').length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {schools.filter(s => s.id !== 'sdo').map(school => (
                        <label
                          key={school.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            selectedSchools.includes(school.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSchools.includes(school.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSchools([...selectedSchools, school.id]);
                              } else {
                                setSelectedSchools(selectedSchools.filter(id => id !== school.id));
                              }
                              calculateBulkAllocation();
                            }}
                            className="rounded border-input"
                          />
                          <span className="text-sm truncate">{school.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleBulkAllocate}
                      disabled={!allocateSelection || bulkTotalQty <= 0 || selectedSchools.length === 0 || bulkPerSchool <= 0}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Distribute to {selectedSchools.length} Schools
                    </Button>
                  </div>
                </div>
              )}

              {allocationMethod === 'bulk' && !allocateSelection && (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a resource to begin bulk allocation</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Dashboard (School View) */}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Allocations Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '75ms' }}>
              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 transition-all duration-300 hover:shadow-lg hover:border-success/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    My Allocations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myAllocations.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Resources allocated to your school</p>
                </CardContent>
              </Card>
            </div>

            {/* Total Transfers Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
              <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20 transition-all duration-300 hover:shadow-lg hover:border-info/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-info" />
                    Total Transfers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAllTransfers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Division-wide transfers</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Admin Statistics */}
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

            <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Completed Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompletedTransfers}</div>
                <p className="text-xs text-muted-foreground mt-1">Approved, in transit, or delivered</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-info" />
                  Total Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAllTransfers}</div>
                <p className="text-xs text-muted-foreground mt-1">All division transfers</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Allocations Section (Schools Only) */}
        {!isAdmin && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/20">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">My Allocations</CardTitle>
                  <CardDescription className="mt-0.5">
                    Resources allocated to your school by SDO. These are SDO-initiated allocations — you do not need to request.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {myAllocations.length > 0 ? (
                <div className="space-y-3">
                  {myAllocations.slice(0, 10).map((alloc) => (
                    <div key={alloc.id} className="p-4 rounded-lg bg-background border border-success/30 flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{alloc.items?.map(i => i.itemName).join(', ')}</p>
                          <Badge className="bg-success/20 text-success border-0 text-xs">
                            {alloc.status === 'Allocated' ? 'Allocated' : alloc.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alloc.date && new Date(alloc.date).toLocaleDateString('en-PH')} • 
                          Quantity: {alloc.items?.reduce((sum, i) => sum + i.quantity, 0)} • 
                          Source: {alloc.source || 'SDO'}
                        </p>
                      </div>
                      <div className="ml-2">
                        {alloc.status === 'Allocated' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-success border-success/30 hover:bg-success/10 hover:text-success"
                            onClick={() => handleMarkReceivedClick(alloc)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Received
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No allocations yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SDO will allocate resources to your school when donations arrive. Check back later or contact the division office.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transfer Activity - Visible to All */}
        <Card className="border-info/30 bg-info/5 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-info/20">
                <Eye className="w-5 h-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">Transfer Activity</CardTitle>
                <CardDescription className="mt-0.5">
                  All division transfers are shown here for transparency. View only.
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

        {/* FAQ/Guidelines Section - Schools Only */}
        {!isAdmin && (
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
                  <span>How does SDO allocate resources to schools?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                  The Schools Division Office allocates resources to schools based on available supplies and fund allocations. All allocations are SDO-initiated — schools do not need to submit requests. When an allocation is made to your school, it will appear in your dashboard under My Allocations.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <span>How do I view all transfer activities?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                  Go to the "Transfer Activity" section to see all division transfers. This is a transparent view showing all allocations across schools. You can also click on "Details" to see full information about any transfer.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <span>What should I do when I receive an allocation?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                  When an allocation is made to your school, you will see it in the "My Allocations" section. Click "Mark Received" to confirm receipt. This helps the SDO track the distribution of resources.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer font-semibold flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <span>Who manages the resource allocation?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded ml-2 mt-1">
                  Only SDO Administrators can initiate resource allocations to schools. Schools can view their allocations and mark items as received, but cannot request specific items. Contact the division office if you have specific needs.
                </p>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Admin: Undistributed Supplies */}
        {isAdmin && (
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-primary" />
              Undistributed / Raw Supplies
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Items listed here are managed by the SDO. Use the allocation form above to distribute to schools.
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
                    <p className="text-xs text-muted-foreground mt-1">Use allocation form to distribute to schools.</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredRaw.length === 0 && (
              <p className="text-sm text-muted-foreground">No undistributed supplies yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Transfer Detail Dialog */}
      <Dialog open={!!selectedTransferView} onOpenChange={(open) => !open && setSelectedTransferView(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="font-display">Transfer Details</DialogTitle>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTransferView.reason && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-2 rounded bg-muted">{selectedTransferView.reason}</p>
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

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={receivedNotes}
                  onChange={(e) => setReceivedNotes(e.target.value)}
                  placeholder="Add any notes about the received items (e.g., condition, discrepancies, etc.)"
                  className="mt-1"
                />
              </div>

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
