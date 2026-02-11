import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import SchoolsTable from '@/components/dashboard/SchoolsTable';
import { schools, movements, surplusItems, generateInventory, items } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Package,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Warehouse,
  Banknote,
  PackageCheck,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const MODAL_PAGE_SIZE = 8;

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'sdo_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showUpdatedSchoolsModal, setShowUpdatedSchoolsModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showPendingTransfersModal, setShowPendingTransfersModal] = useState(false);
  const [updatedSchoolsPage, setUpdatedSchoolsPage] = useState(1);
  const [itemsModalPage, setItemsModalPage] = useState(1);
  const [lowStockModalPage, setLowStockModalPage] = useState(1);
  const [pendingTransfersModalPage, setPendingTransfersModalPage] = useState(1);

  const schoolsSectionRef = useRef(null);

  // Filter schools based on search and level
  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || school.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Calculate stats
  const pendingTransfersList = useMemo(
    () => movements.filter((m) => m.type === 'Transfer' && m.status?.includes('Pending')),
    []
  );
  const pendingTransfers = pendingTransfersList.length;

  // Get schools updated this week, sorted by latest update first
  // For demo purposes, showing sample schools (most recent updates)
  const schoolsUpdatedThisWeekList = useMemo(() => {
    return schools
      .sort((a, b) => {
        const dateA = new Date(a.lastUpdated);
        const dateB = new Date(b.lastUpdated);
        return dateB - dateA; // Most recent first
      })
      .slice(0, 10); // Show top 10 most recently updated schools as samples
  }, []);

  const schoolsUpdatedThisWeek = schoolsUpdatedThisWeekList.length;

  // School-specific stats
  const schoolInventory = user?.schoolId ? generateInventory(user.schoolId) : [];
  const lowStockItems = schoolInventory.filter((item) => item.quantity <= item.reorderLevel);

  // Division-wide items snapshot for prototype listing
  const divisionItems = useMemo(
    () => generateInventory('division'),
    []
  );

  const lowStockDivisionItems = useMemo(
    () => divisionItems.filter((item) => item.quantity <= item.reorderLevel),
    [divisionItems]
  );

  const paginatedUpdatedSchools = useMemo(() => {
    const start = (updatedSchoolsPage - 1) * MODAL_PAGE_SIZE;
    return schoolsUpdatedThisWeekList.slice(start, start + MODAL_PAGE_SIZE);
  }, [schoolsUpdatedThisWeekList, updatedSchoolsPage]);
  const updatedSchoolsTotalPages = Math.ceil(schoolsUpdatedThisWeekList.length / MODAL_PAGE_SIZE) || 1;
  const paginatedDivisionItems = useMemo(() => {
    const start = (itemsModalPage - 1) * MODAL_PAGE_SIZE;
    return divisionItems.slice(start, start + MODAL_PAGE_SIZE);
  }, [divisionItems, itemsModalPage]);
  const divisionItemsTotalPages = Math.ceil(divisionItems.length / MODAL_PAGE_SIZE) || 1;
  const paginatedLowStock = useMemo(() => {
    const start = (lowStockModalPage - 1) * MODAL_PAGE_SIZE;
    return lowStockDivisionItems.slice(start, start + MODAL_PAGE_SIZE);
  }, [lowStockDivisionItems, lowStockModalPage]);
  const lowStockTotalPages = Math.ceil(lowStockDivisionItems.length / MODAL_PAGE_SIZE) || 1;
  const paginatedPendingTransfers = useMemo(() => {
    const start = (pendingTransfersModalPage - 1) * MODAL_PAGE_SIZE;
    return pendingTransfersList.slice(start, start + MODAL_PAGE_SIZE);
  }, [pendingTransfersList, pendingTransfersModalPage]);
  const pendingTransfersTotalPages = Math.ceil(pendingTransfersList.length / MODAL_PAGE_SIZE) || 1;

  const scrollToSchoolsOverview = () => {
    if (schoolsSectionRef.current) {
      schoolsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen">
        <Header
          title="Division Dashboard"
          subtitle="Schools Division of City of Baliuag Overview"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Schools"
              value={schools.length}
              icon={Building2}
              onClick={scrollToSchoolsOverview}
            />
            <StatCard
              title="Updated This Week"
              value={schoolsUpdatedThisWeek}
              icon={Clock}
              onClick={() => setShowUpdatedSchoolsModal(true)}
            />
            <StatCard
              title="Total Items"
              value="3,450"
              icon={Package}
              onClick={() => setShowItemsModal(true)}
            />
            <StatCard
              title="Low Stock Alerts"
              value={lowStockDivisionItems.length}
              icon={AlertTriangle}
              variant="warning"
              onClick={() => setShowLowStockModal(true)}
            />
            <StatCard
              title="Pending Transfers"
              value={pendingTransfers}
              icon={ArrowLeftRight}
              variant="info"
              onClick={() => setShowPendingTransfersModal(true)}
            />
          </div>

          {/* Schools Table */}
          <div ref={schoolsSectionRef}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              Schools Overview
            </h2>
            <SchoolsTable
              schools={filteredSchools}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              levelFilter={levelFilter}
              onLevelChange={setLevelFilter}
            />
          </div>

          {/* Resource Sharing Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-4">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Available Surplus Items
              </h3>
              <div className="space-y-3">
                {surplusItems.slice(0, 4).map((item) => (
                  <div
                    key={`${item.schoolId}-${item.itemId}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">{item.schoolName}</p>
                    </div>
                    <span className="text-lg font-semibold text-success">
                      +{item.surplusQuantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-4">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-info" />
                Recent Transfer Requests
              </h3>
              <div className="space-y-3">
                {movements
                  .filter((m) => m.type === 'Transfer')
                  .slice(0, 4)
                  .map((transfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {transfer.schoolName} → {transfer.targetSchoolName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transfer.items.map((i) => i.itemName).join(', ')}
                        </p>
                      </div>
                      <span
                        className={`badge-status ${
                          transfer.status?.includes('Approved')
                            ? 'badge-approved'
                            : transfer.status?.includes('Rejected')
                            ? 'badge-rejected'
                            : 'badge-pending'
                        }`}
                      >
                        {transfer.status?.split(' - ')[0]}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schools Updated This Week Modal */}
        <Dialog open={showUpdatedSchoolsModal} onOpenChange={setShowUpdatedSchoolsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Schools Updated This Week ({schoolsUpdatedThisWeek})
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Monitoring schools that have recently updated their inventory. Listed by most recent update first.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Completeness Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolsUpdatedThisWeekList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No schools updated this week.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUpdatedSchools.map((school, index) => (
                        <TableRow key={school.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {(updatedSchoolsPage - 1) * MODAL_PAGE_SIZE + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{school.name}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{school.level}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(school.lastUpdated).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold">{school.completenessScore}%</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {schoolsUpdatedThisWeekList.length > 0 && updatedSchoolsTotalPages > 1 && (
                <TablePagination
                  currentPage={updatedSchoolsPage}
                  totalPages={updatedSchoolsTotalPages}
                  totalItems={schoolsUpdatedThisWeekList.length}
                  onPageChange={setUpdatedSchoolsPage}
                  itemLabel="schools"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Total Items Modal */}
        <Dialog open={showItemsModal} onOpenChange={setShowItemsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Total Items (Sample List)
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Prototype view of division-wide items with sample quantities. This uses generated data
                for demo purposes.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDivisionItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-sm">{item.type}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.reorderLevel}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.lastUpdated).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {divisionItems.length > 0 && divisionItemsTotalPages > 1 && (
                <TablePagination
                  currentPage={itemsModalPage}
                  totalPages={divisionItemsTotalPages}
                  totalItems={divisionItems.length}
                  onPageChange={setItemsModalPage}
                  itemLabel="items"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Low Stock Alerts Modal */}
        <Dialog open={showLowStockModal} onOpenChange={setShowLowStockModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Low Stock Items (Sample Division View)
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Items where quantity is at or below the reorder level, using generated division data
                for demo purposes.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockDivisionItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No low stock items in this sample view.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLowStock.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-sm">{item.type}</TableCell>
                          <TableCell className="text-right font-semibold text-warning">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {item.reorderLevel}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {lowStockDivisionItems.length > 0 && lowStockTotalPages > 1 && (
                <TablePagination
                  currentPage={lowStockModalPage}
                  totalPages={lowStockTotalPages}
                  totalItems={lowStockDivisionItems.length}
                  onPageChange={setLowStockModalPage}
                  itemLabel="items"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Transfers Modal */}
        <Dialog open={showPendingTransfersModal} onOpenChange={setShowPendingTransfersModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Pending Transfers ({pendingTransfers})
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                All transfer requests that are still pending, based on the same data used in the
                Transfers tab.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Ref. No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfersList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No pending transfers.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPendingTransfers.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-mono text-sm">{transfer.refNo}</TableCell>
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
                          <TableCell className="text-sm">
                            {transfer.items.map((i) => i.itemName).join(', ')}
                          </TableCell>
                          <TableCell>
                            <span className="badge-status badge-pending">
                              {transfer.status?.split(' - ')[0]}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {pendingTransfersList.length > 0 && pendingTransfersTotalPages > 1 && (
                <TablePagination
                  currentPage={pendingTransfersModalPage}
                  totalPages={pendingTransfersTotalPages}
                  totalItems={pendingTransfersList.length}
                  onPageChange={setPendingTransfersModalPage}
                  itemLabel="transfers"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // School User Dashboard
  return (
    <div className="min-h-screen">
      <Header
        title="School Dashboard"
        subtitle={schools.find((s) => s.id === user?.schoolId)?.name}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Items" value={schoolInventory.length} icon={Package} />
          <StatCard
            title="Low Stock Items"
            value={lowStockItems.length}
            icon={AlertTriangle}
            variant={lowStockItems.length > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Recent Movements"
            value={movements.filter((m) => m.schoolId === user?.schoolId).length}
            icon={TrendingUp}
          />
          <StatCard
            title="Pending Transfers"
            value={
              movements.filter(
                (m) =>
                  m.type === 'Transfer' &&
                  (m.schoolId === user?.schoolId || m.targetSchoolId === user?.schoolId) &&
                  m.status?.includes('Pending')
              ).length
            }
            icon={ArrowLeftRight}
            variant="info"
          />
        </div>

        {/* Quick Actions */}
        <div className="card-elevated p-4">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Add Delivery', icon: Package, href: '/transactions/delivery' },
              { label: 'Issue Items', icon: ArrowLeftRight, href: '/transactions/issue' },
              { label: 'Request Transfer', icon: Building2, href: '/transfers/new' },
              { label: 'View Inventory', icon: TrendingUp, href: '/inventory' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
              >
                <action.icon className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="card-elevated p-4">
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Low Stock Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Reorder at: {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-warning">{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
