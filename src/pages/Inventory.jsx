import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRawInventory } from '@/context/RawInventoryContext';
import { useSchoolInventory } from '@/context/SchoolInventoryContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { items, generateInventory, categories, schools } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  Package,
  AlertTriangle,
  Warehouse,
  Camera,
  ScanBarcode,
  Banknote,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import CameraScanDialog from '@/components/inventory/CameraScanDialog';
import BarcodeScannerDialog from '@/components/inventory/BarcodeScannerDialog';
import AddSchoolItemModal from '@/components/inventory/AddSchoolItemModal';

const Inventory = () => {
  const { user } = useAuth();
  const { rawInventory, addRawEntry } = useRawInventory();
  const { addToSchoolInventory, getSchoolInventory, updateSchoolInventory, setConditionOverride, getConditionOverride } = useSchoolInventory();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'sdo_admin';
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState(
    isAdmin ? 'all' : user?.schoolId || ''
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDeductions, setItemDeductions] = useState({});
  
  // Date filter state
  const [dateFilterType, setDateFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const dateRangeRef = useRef(null);

  // Close date range panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
        // Close if both dates are filled, keep open if only one date is filled
        if (startDate && endDate) {
          setIsDateRangeOpen(false);
        } else if (!startDate && !endDate) {
          setIsDateRangeOpen(false);
        }
      }
    };

    if (isDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDateRangeOpen, startDate, endDate]);

  // Reset filter to All Dates when panel closes with no dates selected
  useEffect(() => {
    if (!isDateRangeOpen && !startDate && !endDate && dateFilterType === 'range') {
      setDateFilterType('all');
    }
  }, [isDateRangeOpen]);

  // Read school from query params when component mounts
  useEffect(() => {
    const schoolParam = searchParams.get('school');
    if (schoolParam) {
      setSelectedSchool(schoolParam);
    }
  }, [searchParams]); // Track deductions per item

  // School: add item modal
  const [showAddSchoolItemModal, setShowAddSchoolItemModal] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // SDO Warehouse: add newly purchased / scan
  const [showAddRawDialog, setShowAddRawDialog] = useState(false);
  const [showCameraScan, setShowCameraScan] = useState(false);
  const [showBarcodeScan, setShowBarcodeScan] = useState(false);
  const [addRawItemId, setAddRawItemId] = useState('');
  const [addRawQty, setAddRawQty] = useState(1);
  const [addRawUnitPrice, setAddRawUnitPrice] = useState('');
  const [addRawDate, setAddRawDate] = useState(new Date().toISOString().split('T')[0]);
  const [addRawSource, setAddRawSource] = useState('Government Procurement');

  const addRawTotalCost = useMemo(() => {
    const qty = Math.max(1, parseInt(addRawQty, 10) || 1);
    const price = parseFloat(addRawUnitPrice) || 0;
    return qty * price;
  }, [addRawQty, addRawUnitPrice]);

  const handleAddRawSubmit = () => {
    const item = items.find((i) => i.id === addRawItemId);
    if (!item || !addRawUnitPrice || Number(addRawUnitPrice) <= 0) return;
    const qty = Math.max(1, parseInt(addRawQty, 10) || 1);
    const price = parseFloat(addRawUnitPrice);
    addRawEntry({
      itemId: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: qty,
      unitPrice: price,
      totalCost: qty * price,
      dateReceived: addRawDate,
      source: addRawSource,
    });
    addNotification({
      title: 'Warehouse stock added',
      message: `${qty}× ${item.name} added to SDO warehouse. Source: ${addRawSource}.`,
      type: 'inventory',
      forAdmin: true,
    });
    setShowAddRawDialog(false);
    setAddRawItemId('');
    setAddRawQty(1);
    setAddRawUnitPrice('');
    setAddRawDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddRawFromScan = (entry) => {
    addRawEntry(entry);
    addNotification({
      title: 'Warehouse stock added (scan)',
      message: `${entry.quantity}× ${entry.name} added to SDO warehouse via camera/barcode scan.`,
      type: 'inventory',
      forAdmin: true,
    });
  };

  const handleAddSchoolItem = (entry) => {
    if (!user?.schoolId) return;
    const schoolName = schools.find((s) => s.id === user.schoolId)?.name || 'School';
    addToSchoolInventory(user.schoolId, entry);
    addNotification({
      title: 'School inventory updated',
      message: `${schoolName} added ${entry.quantity}× ${entry.name} to their inventory.`,
      type: 'inventory',
      forAdmin: true,
    });
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
  };

  const handleConditionChange = (newCondition) => {
    if (!selectedItem) return;
    const schoolId = selectedItem.schoolId ?? selectedSchool;
    if (!schoolId || schoolId === 'all') return;
    const lastUpdated = new Date().toISOString().split('T')[0];
    const schoolName = selectedItem.schoolName || schools.find((s) => s.id === schoolId)?.name || 'School';
    const itemName = selectedItem.name || selectedItem.itemName;
    if (selectedItem.id?.startsWith('school-inv-')) {
      updateSchoolInventory(schoolId, selectedItem.id, { condition: newCondition, lastUpdated });
    } else {
      setConditionOverride(schoolId, selectedItem.id, newCondition);
    }
    addNotification({
      title: 'Item condition updated',
      message: `${schoolName}: ${itemName} set to ${newCondition}.`,
      type: 'inventory',
      forAdmin: true,
    });
    setSelectedItem((prev) => (prev ? { ...prev, condition: newCondition, lastUpdated } : null));
  };

  // Generate inventory data (base + school additions)
  const inventory = useMemo(() => {
    let baseInventory = [];
    if (selectedSchool === 'all') {
      baseInventory = schools.flatMap((school) =>
        generateInventory(school.id).map((item) => {
          const override = getConditionOverride(school.id, item.id);
          return {
            ...item,
            schoolId: school.id,
            schoolName: school.name,
            ...(override && { condition: override.condition, lastUpdated: override.lastUpdated }),
          };
        })
      );
      // Merge school additions for all schools
      const schoolAdditions = schools.flatMap((school) => {
        const additions = getSchoolInventory(school.id);
        return additions.map((add) => ({
          ...add,
          schoolId: school.id,
          schoolName: school.name,
          reorderLevel: items.find((i) => i.id === add.itemId)?.reorderLevel || 0,
        }));
      });
      return [...baseInventory, ...schoolAdditions];
    }
    const schoolName = schools.find((s) => s.id === selectedSchool)?.name || '';
    baseInventory = generateInventory(selectedSchool).map((item) => {
      const override = getConditionOverride(selectedSchool, item.id);
      return {
        ...item,
        schoolName,
        ...(override && { condition: override.condition, lastUpdated: override.lastUpdated }),
      };
    });
    // Merge additions for this school
    const additions = getSchoolInventory(selectedSchool).map((add) => ({
      ...add,
      schoolId: selectedSchool,
      schoolName,
      reorderLevel: items.find((i) => i.id === add.itemId)?.reorderLevel || 0,
    }));
    return [...baseInventory, ...additions];
  }, [selectedSchool, getSchoolInventory, getConditionOverride]);

  // Date filter logic
  const matchesDateFilter = (item) => {
    if (dateFilterType === 'all' || !item.dateAcquired) return true;
    
    const itemDate = new Date(item.dateAcquired);
    const today = new Date();

    if (dateFilterType === 'yearly') {
      return itemDate.getFullYear() === today.getFullYear();
    }
    
    if (dateFilterType === 'monthly') {
      return (
        itemDate.getFullYear() === today.getFullYear() &&
        itemDate.getMonth() === today.getMonth()
      );
    }
    
    if (dateFilterType === 'range' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    }
    
    return true;
  };

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesDate = matchesDateFilter(item);
      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });
  }, [inventory, searchQuery, categoryFilter, typeFilter, dateFilterType, startDate, endDate]);

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'Good':
        return <Badge className="bg-success/20 text-success border-0">Good</Badge>;
      case 'Damaged':
        return (
          <Badge className="bg-destructive/20 text-destructive border-0">
            Damaged
          </Badge>
        );
      case 'For Repair':
        return (
          <Badge className="bg-warning/20 text-warning border-0">For Repair</Badge>
        );
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const isLowStock = (item) => item.quantity <= item.reorderLevel;

  const getInventoryTitle = () => {
    if (!isAdmin || selectedSchool === 'all') {
      return 'Inventory';
    }
    const school = schools.find((s) => s.id === selectedSchool);
    return school ? `Inventory for ${school.name}` : 'Inventory';
  };

  return (
    <div className="min-h-screen">
      <Header
        title={getInventoryTitle()}
        subtitle={
          isAdmin
            ? 'Division-wide inventory management'
            : 'Manage your school inventory'
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Success message (school) */}
        {addSuccess && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Item added to inventory successfully!</p>
          </div>
        )}

        {/* SDO Warehouse — at top so admins can open it without scrolling */}
        {isAdmin && (
          <Collapsible defaultOpen={false} className="card-elevated overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full px-6 py-4 flex items-center justify-between text-left bg-sidebar text-sidebar-foreground hover:bg-sidebar/90 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sidebar-foreground/10">
                    <Warehouse className="w-5 h-5 text-sidebar-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-semibold text-sidebar-foreground">
                      SDO Warehouse — Property and Supply Unit
                    </h2>
                    <p className="text-sm text-sidebar-foreground/80">
                      Government-funded supplies not yet distributed to schools. Add newly purchased items, scan with camera (AI), or use barcode scanner.
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-sidebar-foreground group-data-[state=open]:hidden" />
                <ChevronUp className="w-5 h-5 text-sidebar-foreground hidden group-data-[state=open]:block" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pt-4 pb-4 space-y-4 bg-card">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowAddRawDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Newly Purchased
                  </Button>
                  <Button variant="outline" onClick={() => setShowCameraScan(true)}>
                    <Camera className="w-4 h-4 mr-2" />
                    Scan with Camera (AI)
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header">
                        <TableHead>Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price (₱)</TableHead>
                        <TableHead className="text-right">Total Cost (₱)</TableHead>
                        <TableHead>Date Received</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawInventory.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-sm">{row.code}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-sm">{row.category}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">
                            {Number(row.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className="text-success">
                              ₱{Number(row.totalCost).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.dateReceived ? new Date(row.dateReceived).toLocaleDateString('en-PH') : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                            {row.source || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {rawInventory.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No undistributed supplies. Add newly purchased items or scan to record government-funded supplies.
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* School Filter (Admin only) */}
            {isAdmin && (
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
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

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Consumable">Consumable</SelectItem>
                <SelectItem value="Asset">Asset</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter with Custom Range Dropdown */}
            <div className="relative inline-block" ref={dateRangeRef}>
              <Select value={dateFilterType} onValueChange={(value) => {
                setDateFilterType(value);
                if (value !== 'range') {
                  setIsDateRangeOpen(false);
                  setStartDate('');
                  setEndDate('');
                } else {
                  setIsDateRangeOpen(true);
                }
              }}>
                <SelectTrigger className="w-40" onClick={() => {
                  if (dateFilterType === 'range' && !isDateRangeOpen) {
                    setIsDateRangeOpen(true);
                  }
                }}>
                  <SelectValue placeholder="Date Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="range">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Float Panel */}
              {dateFilterType === 'range' && (isDateRangeOpen || startDate || endDate) && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">From</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">To</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {!isAdmin && (
              <Button onClick={() => setShowAddSchoolItemModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card">
            <Package className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{filteredInventory.length}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          <div className="stat-card border-warning/30 bg-warning/5">
            <AlertTriangle className="w-5 h-5 text-warning mb-2" />
            <p className="text-2xl font-bold">
              {filteredInventory.filter((i) => isLowStock(i)).length}
            </p>
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  {selectedSchool === 'all' && <TableHead>School</TableHead>}
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">Deducted</TableHead>
                  <TableHead className="text-center">Balance</TableHead>
                  <TableHead>Date Acquired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.slice(0, 50).map((item, index) => (
                  <TableRow
                    key={`${item.schoolId}-${item.id}-${index}`}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      isLowStock(item) ? 'bg-warning/5' : ''
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {isLowStock(item) && (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    {selectedSchool === 'all' && (
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {item.schoolName}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">{item.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.unit}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        max={item.quantity}
                        value={itemDeductions[`${item.schoolId}-${item.id}`] || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          const inputValue = e.target.value;
                          let newValue = 0;
                          
                          if (inputValue === '') {
                            newValue = 0;
                          } else {
                            const parsed = parseInt(inputValue, 10);
                            if (!isNaN(parsed)) {
                              newValue = Math.max(0, Math.min(item.quantity, parsed));
                            }
                          }
                          
                          setItemDeductions((prev) => ({
                            ...prev,
                            [`${item.schoolId}-${item.id}`]: newValue,
                          }));
                        }}
                        className="w-16 h-8 text-center"
                      />
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {item.quantity - (itemDeductions[`${item.schoolId}-${item.id}`] || 0)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.dateAcquired ? new Date(item.dateAcquired).toLocaleDateString('en-PH') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No items found matching your criteria.
            </div>
          )}

          {filteredInventory.length > 50 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              Showing 50 of {filteredInventory.length} items
            </div>
          )}
        </div>
      </div>

      {/* Add Newly Purchased Dialog */}
      <Dialog open={showAddRawDialog} onOpenChange={setShowAddRawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Newly Purchased Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Record government-funded supplies before distribution. Total cost is calculated automatically.
          </p>
          <div className="space-y-4">
            <div>
              <Label>Item *</Label>
              <Select value={addRawItemId} onValueChange={setAddRawItemId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select supply" />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={addRawQty}
                  onChange={(e) => setAddRawQty(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Unit Price (₱) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={addRawUnitPrice}
                  onChange={(e) => setAddRawUnitPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Banknote className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total cost:</span>
              <span className="font-semibold text-foreground">
                ₱{addRawTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <Label>Date Received</Label>
              <Input
                type="date"
                value={addRawDate}
                onChange={(e) => setAddRawDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Source</Label>
              <Input
                placeholder="e.g. Government Procurement"
                value={addRawSource}
                onChange={(e) => setAddRawSource(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRawDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRawSubmit}
              disabled={!addRawItemId || !addRawUnitPrice || Number(addRawUnitPrice) <= 0}
            >
              Add to Warehouse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CameraScanDialog
        open={showCameraScan}
        onOpenChange={setShowCameraScan}
        onAddWithItem={handleAddRawFromScan}
        items={items}
      />
      <BarcodeScannerDialog
        open={showBarcodeScan}
        onOpenChange={setShowBarcodeScan}
        onAddWithItem={handleAddRawFromScan}
        items={items}
      />

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Item Details</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Item Image Placeholder */}
              <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Item Code</p>
                  <p className="text-sm font-mono">{selectedItem.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Item Name</p>
                  <p className="text-sm">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-sm">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline" className="text-xs">{selectedItem.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit</p>
                  <p className="text-sm">{selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="text-sm">{selectedItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deducted</p>
                  <p className="text-sm">{itemDeductions[`${selectedItem.schoolId}-${selectedItem.id}`] || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-sm">{selectedItem.quantity - (itemDeductions[`${selectedItem.schoolId}-${selectedItem.id}`] || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Acquired</p>
                  <p className="text-sm">
                    {selectedItem.dateAcquired
                      ? new Date(selectedItem.dateAcquired).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {new Date(selectedItem.lastUpdated).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {isLowStock(selectedItem) && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <p className="text-sm text-warning">
                    This item is below reorder level. Consider restocking soon.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add School Item Modal */}
      {!isAdmin && (
        <AddSchoolItemModal
          open={showAddSchoolItemModal}
          onOpenChange={setShowAddSchoolItemModal}
          onAddItem={handleAddSchoolItem}
          schoolId={user?.schoolId}
        />
      )}
    </div>
  );
};

export default Inventory;
