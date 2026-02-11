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
  Share2,
  TrendingUp,
  Package,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle,
  Warehouse,
  Plus,
  ClipboardList,
} from 'lucide-react';

const SDO_SCHOOL = { id: 'sdo', name: 'Schools Division Office of City of Baliuag' };

const ResourceHub = () => {
  const { user } = useAuth();
  const { rawInventory } = useRawInventory();
  const { surplusItems, addSurplus } = useSurplus();
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

  // Post excess (school)
  const [showPostExcess, setShowPostExcess] = useState(false);
  const [postItemId, setPostItemId] = useState('');
  const [postQuantity, setPostQuantity] = useState(1);
  const [postCondition, setPostCondition] = useState('Good');
  const [postSuccess, setPostSuccess] = useState(false);

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

  const handlePostExcessSubmit = () => {
    const item = items.find((i) => i.id === postItemId);
    const school = schools.find((s) => s.id === user?.schoolId);
    if (!item || !school || postQuantity < 1) return;
    addSurplus({
      schoolId: school.id,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      surplusQuantity: postQuantity,
      condition: postCondition,
    });
    addNotification({
      title: 'Surplus posted',
      message: `${school.name} posted ${postQuantity}× ${item.name} (${postCondition}) to Resource Hub.`,
      type: 'surplus',
      forAdmin: true,
    });
    setShowPostExcess(false);
    setPostItemId('');
    setPostQuantity(1);
    setPostCondition('Good');
    setPostSuccess(true);
    setTimeout(() => setPostSuccess(false), 3000);
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
            : 'Request from SDO or other schools • Post your excess'
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Feature Highlight */}
        <div className="card-elevated p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">
                Resource Sharing Hub
              </h2>
              <p className="text-muted-foreground mt-1">
                {isAdmin
                  ? 'All undistributed/raw supplies from the SDO Warehouse (Inventory tab) are automatically listed here. Schools can request them; approve or reject in the Transfers tab. Notifications are sent when you decide.'
                  : 'All available supplies from the admin office (SDO Warehouse) are listed below. Request what your school needs, or from other schools’ surplus. You can also post your excess. Requests are logged in Transfers for admin approval.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-success/20 text-success border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Reduces Procurement Costs
                </Badge>
                <Badge className="bg-info/20 text-info border-0">
                  <Share2 className="w-3 h-3 mr-1" />
                  Division-wide Visibility
                </Badge>
                <Badge className="bg-primary/20 text-primary border-0">
                  <Package className="w-3 h-3 mr-1" />
                  Requests in Transfers
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Success messages */}
        {showSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Request submitted. It is logged in the Transfers tab. Admin will be notified and will accept or reject.</p>
          </div>
        )}
        {postSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Excess supply posted. Other schools can now request it.</p>
          </div>
        )}

        {/* Admin: Pending requests */}
        {isAdmin && pendingRequests.length > 0 && (
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

        {/* School: Post excess */}
        {!isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setShowPostExcess(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Post excess supplies
            </Button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items or schools..."
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

        {/* Admin: All undistributed supplies (auto-posted from SDO Warehouse) */}
        {isAdmin && (
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-primary" />
              Undistributed / raw supplies (auto-posted)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Same list as Inventory → SDO Warehouse. All items here are visible to schools so they can request transfers. No manual posting needed.
            </p>
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
        )}

        {/* School: All available supplies from admin office (auto-posted) */}
        {!isAdmin && filteredRaw.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-primary" />
              Available from admin office (SDO)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              All undistributed supplies at the division office are listed here. Request what your school needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRaw.map((row) => (
                <Card
                  key={row.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openRequestDialog(row, 'raw')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{row.name}</CardTitle>
                        <CardDescription>{row.category}</CardDescription>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-0">SDO</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Available: <strong>{row.quantity}</strong> {row.unit}</p>
                    <Button className="w-full mt-3" variant="outline" size="sm">
                      Request transfer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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

      {/* Post excess Dialog */}
      <Dialog open={showPostExcess} onOpenChange={setShowPostExcess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post excess supplies</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Other schools can request these items. Requests appear in Transfers for admin approval.</p>
          <div className="space-y-4">
            <div>
              <Label>Item *</Label>
              <Select value={postItemId} onValueChange={setPostItemId}>
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
            <div>
              <Label>Excess quantity *</Label>
              <Input
                type="number"
                min={1}
                value={postQuantity}
                onChange={(e) => setPostQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={postCondition} onValueChange={setPostCondition}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="For Repair">For Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostExcess(false)}>Cancel</Button>
            <Button onClick={handlePostExcessSubmit} disabled={!postItemId}>
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourceHub;
