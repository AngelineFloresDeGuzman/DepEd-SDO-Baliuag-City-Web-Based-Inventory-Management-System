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
  Calendar as CalendarIcon,
  Banknote,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Printer,
  FileText,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import CameraScanDialog from '@/components/inventory/CameraScanDialog';
import BarcodeScannerDialog from '@/components/inventory/BarcodeScannerDialog';
import AddSchoolItemModal from '@/components/inventory/AddSchoolItemModal';
import StockCardReport from '@/components/inventory/StockCardReport';
import { TablePagination } from '@/components/ui/table-pagination';
import html2pdf from 'html2pdf.js';

const INV_PAGE_SIZE = 10;

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
  const [lastDeductionUpdate, setLastDeductionUpdate] = useState({});
  const [invPage, setInvPage] = useState(1);
  const [rawInvPage, setRawInvPage] = useState(1);
  const [showReportModal, setShowReportModal] = useState(false);

  // Date filter state
  const [dateFilterType, setDateFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null); // 'start' | 'end' | null
  const dateRangeRef = useRef(null);
  const reportRef = useRef(null);

  // Close date range panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
        // Always close when clicking outside
        setIsDateRangeOpen(false);
        setActiveDateField(null);
      }
    };

    if (isDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDateRangeOpen, startDate, endDate]);

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
  const [selectedRawItem, setSelectedRawItem] = useState(null);
  const [addRawItemId, setAddRawItemId] = useState('');
  const [addRawQty, setAddRawQty] = useState(1);
  const [addRawUnitPrice, setAddRawUnitPrice] = useState('');
  const [addRawDate, setAddRawDate] = useState(new Date().toISOString().split('T')[0]);
  const [addRawSource, setAddRawSource] = useState('Maintenance and Other Operating Expenses (MOOE)');

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

  const toISODateString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateStringToLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateDisplay = (value) => {
    if (!value) return '';
    const date = parseDateStringToLocalDate(value);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
      const start = parseDateStringToLocalDate(startDate);
      const end = parseDateStringToLocalDate(endDate);
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

  const invTotalPages = Math.ceil(filteredInventory.length / INV_PAGE_SIZE) || 1;
  const paginatedInventory = useMemo(() => {
    const start = (invPage - 1) * INV_PAGE_SIZE;
    return filteredInventory.slice(start, start + INV_PAGE_SIZE);
  }, [filteredInventory, invPage]);

  const rawInvTotalPages = Math.ceil(rawInventory.length / INV_PAGE_SIZE) || 1;
  const paginatedRawInventory = useMemo(() => {
    const start = (rawInvPage - 1) * INV_PAGE_SIZE;
    return rawInventory.slice(start, start + INV_PAGE_SIZE);
  }, [rawInventory, rawInvPage]);

  useEffect(() => {
    setInvPage(1);
  }, [filteredInventory.length, searchQuery, categoryFilter, typeFilter, dateFilterType, startDate, endDate, selectedSchool]);
  useEffect(() => { setRawInvPage(1); }, [rawInventory.length]);

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

  const getFiltersSummary = () => {
    const parts = [];
    if (searchQuery) parts.push(`Search: "${searchQuery}"`);
    if (selectedSchool !== 'all') {
      const school = schools.find((s) => s.id === selectedSchool);
      parts.push(`School: ${school?.name || selectedSchool}`);
    }
    if (categoryFilter !== 'all') parts.push(`Category: ${categoryFilter}`);
    if (typeFilter !== 'all') parts.push(`Type: ${typeFilter}`);
    if (dateFilterType === 'yearly') parts.push('Date: This Year');
    else if (dateFilterType === 'monthly') parts.push('Date: This Month');
    else if (dateFilterType === 'range' && startDate && endDate) {
      parts.push(`Date: ${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'No filters applied (showing all)';
  };

  const getPdfOptions = () => ({
    margin: [5, 12.7, 12.7, 12.7],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  });

  const handlePrintReport = async () => {
    if (!reportRef.current || filteredInventory.length === 0) return;
    const el = reportRef.current;
    const opt = { ...getPdfOptions(), filename: null };
    try {
      const blob = await html2pdf().set(opt).from(el).outputPdf('blob');
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        setTimeout(() => {
          win.print();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 500);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Stock-Card-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Print failed:', err);
    }
  };

  const handleExportPdf = async () => {
    if (!reportRef.current || filteredInventory.length === 0) return;
    const el = reportRef.current;
    const opt = {
      ...getPdfOptions(),
      filename: `Stock-Card-Report-${new Date().toISOString().slice(0, 10)}.pdf`,
    };
    try {
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    }
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
                        <TableHead>Type</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-center">Deducted</TableHead>
                        <TableHead className="text-center">Balance</TableHead>
                        <TableHead className="whitespace-nowrap">Date Acquired</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRawInventory.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedRawItem(row)}
                        >
                          <TableCell className="font-mono text-sm">{row.code}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-sm">{row.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {items.find((i) => i.id === row.itemId)?.type || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.unit}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-center">
                            {Math.max(0, (row.initialQuantity ?? row.quantity) - row.quantity)}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {row.quantity}
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
                {rawInventory.length > 0 && rawInvTotalPages > 1 && (
                  <TablePagination
                    currentPage={rawInvPage}
                    totalPages={rawInvTotalPages}
                    totalItems={rawInventory.length}
                    onPageChange={setRawInvPage}
                    itemLabel="items"
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions Bar */}
        <div className="flex flex-row flex-nowrap items-center gap-3 overflow-x-auto">
            {/* Search */}
            <div className="relative shrink-0">
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
              <Select
                value={dateFilterType}
                onValueChange={(value) => {
                  setDateFilterType(value);
                  if (value !== 'range') {
                    setIsDateRangeOpen(false);
                    setActiveDateField(null);
                    setStartDate('');
                    setEndDate('');
                  } else {
                    setIsDateRangeOpen(true);
                    // When switching into Custom Range, default focus to "From"
                    setActiveDateField('start');
                  }
                }}
                onOpenChange={(open) => {
                  // When the select dropdown closes while Custom Range is active,
                  // show the custom range panel so the user can (re)edit dates.
                  if (!open && dateFilterType === 'range') {
                    setIsDateRangeOpen(true);
                    setActiveDateField((prev) => prev || 'start');
                  }
                }}
              >
                <SelectTrigger
                  className="w-44 md:w-52"
                  onClick={() => {
                    if (dateFilterType === 'range') {
                      setIsDateRangeOpen(true);
                      // Re-open for editing; keep existing dates but focus "From" by default
                      setActiveDateField((prev) => prev || 'start');
                    }
                  }}
                >
                  {dateFilterType === 'range' && startDate && endDate ? (
                    <span className="text-sm">
                      {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                    </span>
                  ) : (
                    <SelectValue placeholder="Date Filter" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="range">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Float Panel */}
              {dateFilterType === 'range' && isDateRangeOpen && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">From</Label>
                      <button
                        type="button"
                        className="input-field flex items-center justify-between text-sm"
                        id="start-date"
                        onClick={() =>
                          setActiveDateField((prev) => (prev === 'start' ? null : 'start'))
                        }
                      >
                        <span>
                          {startDate ? formatDateDisplay(startDate) : 'Select date'}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
                      </button>

                      {activeDateField === 'start' && (
                        <div className="mt-2 rounded-lg border border-border bg-card">
                          <Calendar
                            mode="single"
                            selected={startDate ? parseDateStringToLocalDate(startDate) : undefined}
                            disabled={
                              endDate ? { after: parseDateStringToLocalDate(endDate) } : undefined
                            }
                            onSelect={(date) => {
                              if (!date) return;
                              const iso = toISODateString(date);
                              setStartDate(iso);
                              const endLocal = endDate ? parseDateStringToLocalDate(endDate) : null;
                              // If "To" is empty or before the new "From", align it with "From"
                              if (!endLocal || endLocal < date) {
                                setEndDate(iso);
                              }
                              setActiveDateField('end');
                            }}
                            initialFocus
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">To</Label>
                      <button
                        type="button"
                        className="input-field flex items-center justify-between text-sm"
                        id="end-date"
                        onClick={() =>
                          setActiveDateField((prev) => (prev === 'end' ? null : 'end'))
                        }
                      >
                        <span>
                          {endDate ? formatDateDisplay(endDate) : 'Select date'}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
                      </button>

                      {activeDateField === 'end' && (
                        <div className="mt-2 rounded-lg border border-border bg-card">
                          <Calendar
                            mode="single"
                            selected={endDate ? parseDateStringToLocalDate(endDate) : undefined}
                            disabled={
                              startDate ? { before: parseDateStringToLocalDate(startDate) } : undefined
                            }
                            onSelect={(date) => {
                              if (!date) return;
                              const iso = toISODateString(date);
                              setEndDate(iso);
                              setActiveDateField(null);
                              setIsDateRangeOpen(false);
                            }}
                            initialFocus
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          <Button size="sm" className="h-9 shrink-0 bg-yellow-400 hover:bg-yellow-500 text-black" onClick={() => setShowReportModal(true)}>
            <Eye className="w-4 h-4 mr-2" />
            View Report
          </Button>
            {!isAdmin && (
              <Button size="sm" className="h-9 shrink-0" onClick={() => setShowAddSchoolItemModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}
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
                  <TableHead className="whitespace-nowrap">Date Acquired</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInventory.map((item, index) => (
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
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        max={item.quantity}
                        value={itemDeductions[`${item.schoolId}-${item.id}`] || 0}
                        disabled={!item.source}
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
                          setLastDeductionUpdate((prev) => ({
                            ...prev,
                            [`${item.schoolId}-${item.id}`]: new Date().toISOString(),
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
                    <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                      {item.source || '—'}
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

          {filteredInventory.length > 0 && invTotalPages > 1 && (
            <TablePagination
              currentPage={invPage}
              totalPages={invTotalPages}
              totalItems={filteredInventory.length}
              onPageChange={setInvPage}
              itemLabel="items"
            />
          )}
        </div>
      </div>

      {/* Add Newly Purchased Dialog - fields align with Inventory table & Item Details modal */}
      <Dialog open={showAddRawDialog} onOpenChange={setShowAddRawDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add Newly Purchased Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Record government-funded supplies before distribution. Fields match Inventory table and details modal.
          </p>
          <div className="space-y-4">
            <div>
              <Label className="font-semibold">Item *</Label>
              <Select value={addRawItemId} onValueChange={setAddRawItemId}>
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
            {addRawItemId && (() => {
              const sel = items.find((i) => i.id === addRawItemId);
              if (!sel) return null;
              return (
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Code</p>
                    <p className="text-sm font-mono">{sel.code}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Item Name</p>
                    <p className="text-sm">{sel.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Category</p>
                    <p className="text-sm">{sel.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Type</p>
                    <Badge variant="outline" className="text-xs">{sel.type}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Unit</p>
                    <p className="text-sm">{sel.unit}</p>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={addRawQty}
                  onChange={(e) => setAddRawQty(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-semibold">Unit Price (₱) *</Label>
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
            <div>
              <Label className="font-semibold">Total Cost (₱)</Label>
              <div className="mt-1 flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Banknote className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  ₱{addRawTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div>
              <Label className="font-semibold">Date Acquired</Label>
              <Input
                type="date"
                value={addRawDate}
                onChange={(e) => setAddRawDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Source</Label>
              <Input
                placeholder="e.g. MOOE, LSB/LGU, Donation, Others"
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

      {/* SDO Warehouse Item Detail Dialog */}
      <Dialog open={!!selectedRawItem} onOpenChange={() => setSelectedRawItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Warehouse Item Details</DialogTitle>
          </DialogHeader>
          {selectedRawItem && (
            <div className="space-y-4">
              <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Item Code</p>
                  <p className="text-sm font-mono">{selectedRawItem.code}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Item Name</p>
                  <p className="text-sm">{selectedRawItem.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Category</p>
                  <p className="text-sm">{selectedRawItem.category}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type</p>
                  <Badge variant="outline" className="text-xs">
                    {items.find((i) => i.id === selectedRawItem.itemId)?.type || '—'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Unit</p>
                  <p className="text-sm">{selectedRawItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Quantity</p>
                  <p className="text-sm">{selectedRawItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Deducted</p>
                  <p className="text-sm">
                    {Math.max(
                      0,
                      (selectedRawItem.initialQuantity ?? selectedRawItem.quantity) -
                        selectedRawItem.quantity
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Balance</p>
                  <p className="text-sm">{selectedRawItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Unit Price</p>
                  <p className="text-sm">
                    {selectedRawItem.unitPrice != null
                      ? `₱${Number(selectedRawItem.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Total Cost</p>
                  <p className="text-sm">
                    {selectedRawItem.totalCost != null
                      ? `₱${Number(selectedRawItem.totalCost).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Date Acquired</p>
                  <p className="text-sm">
                    {selectedRawItem.dateReceived
                      ? new Date(selectedRawItem.dateReceived).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Source</p>
                  <p className="text-sm">{selectedRawItem.source || '—'}</p>
                </div>
              </div>
            </div>
          )}
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
                  <p className="text-sm font-semibold text-muted-foreground">Item Code</p>
                  <p className="text-sm font-mono">{selectedItem.code}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Item Name</p>
                  <p className="text-sm">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Category</p>
                  <p className="text-sm">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type</p>
                  <Badge variant="outline" className="text-xs">{selectedItem.type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Unit</p>
                  <p className="text-sm">{selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Quantity</p>
                  <p className="text-sm">{selectedItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Unit Price</p>
                  <p className="text-sm">
                    {selectedItem.unitPrice != null
                      ? `₱${Number(selectedItem.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Total Cost</p>
                  <p className="text-sm">
                    {selectedItem.totalCost != null
                      ? `₱${Number(selectedItem.totalCost).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      : selectedItem.unitPrice != null && selectedItem.quantity != null
                        ? `₱${Number(selectedItem.unitPrice * selectedItem.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Deducted</p>
                  <p className="text-sm">{itemDeductions[`${selectedItem.schoolId}-${selectedItem.id}`] || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Balance</p>
                  <p className="text-sm">{selectedItem.quantity - (itemDeductions[`${selectedItem.schoolId}-${selectedItem.id}`] || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Date Acquired</p>
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
                  <p className="text-sm font-semibold text-muted-foreground">Source</p>
                  <p className="text-sm">{selectedItem.source || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {new Date(
                      lastDeductionUpdate[`${selectedItem.schoolId}-${selectedItem.id}`] || selectedItem.lastUpdated
                    ).toLocaleDateString('en-PH', {
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

      {/* Inventory Report Modal - Stock Card format */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:max-w-none print:max-h-none print:border-0 print:shadow-none print:p-0">
          <div className="overflow-y-auto flex-1 print:overflow-visible bg-white text-black p-0">
            <div ref={reportRef} className="inventory-report-print min-h-0">
              {filteredInventory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No items to report with the current filters.
                </div>
              ) : (
                <StockCardReport
                items={filteredInventory}
                schoolId={selectedSchool === 'all' ? null : selectedSchool}
                isAdmin={isAdmin}
                filtersSummary={getFiltersSummary()}
              />
            )}
            </div>
          </div>
          <DialogFooter className="print:hidden flex-shrink-0">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              onClick={handleExportPdf}
              disabled={filteredInventory.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={handlePrintReport} disabled={filteredInventory.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </DialogFooter>
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
