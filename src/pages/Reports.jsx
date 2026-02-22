import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransfers } from '@/context/TransfersContext';
import { useSchoolInventory } from '@/context/SchoolInventoryContext';
import { useRawInventory } from '@/context/RawInventoryContext';
import Header from '@/components/layout/Header';
import { schools, categories, generateInventory, items } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  Download,
  ClipboardList,
  BarChart3,
  Calendar,
  Printer,
  FileText,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import MovementReport from '@/components/reports/MovementReport';
import InventoryReport from '@/components/reports/InventoryReport';
import StockCardReport from '@/components/inventory/StockCardReport';
import RSMIReport from '@/components/inventory/RSMIReport';
import RCPIReport from '@/components/inventory/RCPIReport';

const Reports = () => {
  const { user } = useAuth();
  const { transfers } = useTransfers();
  const { getSchoolInventory, getConditionOverride } = useSchoolInventory();
  const { rawInventory } = useRawInventory();
  const isAdmin = user?.role === 'sdo_admin';
  const reportRef = useRef(null);

  const [selectedSchool, setSelectedSchool] = useState(
    isAdmin ? 'all' : user?.schoolId || ''
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemType, setSelectedItemType] = useState('all');
  const [reportType, setReportType] = useState('inventory');

  const reportTypes = [
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Complete list of all inventory items with quantities and conditions',
      icon: ClipboardList,
      color: 'text-primary',
    },
    {
      id: 'stockcard',
      title: 'Stock Card (Appendix 58)',
      description: 'Per-item stock card for audit and monitoring',
      icon: FileText,
      color: 'text-primary',
    },
    {
      id: 'rsmi',
      title: 'RSMI (Appendix 64)',
      description: 'Report of Supplies and Materials Issued',
      icon: FileText,
      color: 'text-primary',
    },
    {
      id: 'rcpi',
      title: 'RCPI (Appendix 66)',
      description: 'Report on the Physical Count of Inventories',
      icon: FileText,
      color: 'text-primary',
    },
    {
      id: 'movement',
      title: 'Movement History',
      description: 'All transactions including deliveries, issues, and disposals',
      icon: BarChart3,
      color: 'text-info',
      adminOnly: true,
    },
    {
      id: 'lowstock',
      title: 'Low Stock Alert Report',
      description: 'Items below reorder level requiring immediate attention',
      icon: Calendar,
      color: 'text-warning',
    },
  ];

  // Build filtered inventory for reports
  const filteredInventory = useMemo(() => {
    let inv = [];
    const effectiveSchool = selectedSchool === 'all' ? (isAdmin ? 'all' : user?.schoolId) : selectedSchool;

    if (effectiveSchool === 'sdo') {
      inv = rawInventory.map((item) => {
        const baseItem = items.find((i) => i.id === item.itemId);
        return {
          ...item,
          id: item.id,
          code: item.code,
          name: item.name,
          category: baseItem?.category || '',
          type: baseItem?.type || '',
          unit: baseItem?.unit || '',
          quantity: item.quantity,
          schoolId: 'sdo',
          schoolName: 'SDO Baliuag',
          condition: 'Good',
          dateAcquired: item.dateReceived,
        };
      });
    } else if (effectiveSchool === 'all' && isAdmin) {
      inv = schools
        .filter((s) => s.id !== 'sdo')
        .flatMap((school) =>
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
      const additions = schools.flatMap((school) =>
        (getSchoolInventory(school.id) || []).map((add) => ({
          ...add,
          schoolId: school.id,
          schoolName: school.name,
          reorderLevel: items.find((i) => i.id === add.itemId)?.reorderLevel || 0,
        }))
      );
      inv = [...inv, ...additions];
    } else if (effectiveSchool) {
      const schoolName = schools.find((s) => s.id === effectiveSchool)?.name || '';
      inv = generateInventory(effectiveSchool).map((item) => {
        const override = getConditionOverride(effectiveSchool, item.id);
        return {
          ...item,
          schoolName,
          ...(override && { condition: override.condition, lastUpdated: override.lastUpdated }),
        };
      });
      const additions = (getSchoolInventory(effectiveSchool) || []).map((add) => ({
        ...add,
        schoolId: effectiveSchool,
        schoolName,
        reorderLevel: items.find((i) => i.id === add.itemId)?.reorderLevel || 0,
      }));
      inv = [...inv, ...additions];
    }

    // Apply category filter (same logic as Inventory page)
    if (selectedCategory !== 'all') {
      inv = inv.filter((i) => i.category === selectedCategory);
    }
    // Apply item type filter (same logic as Inventory page)
    if (selectedItemType !== 'all') {
      inv = inv.filter((i) => i.type === selectedItemType);
    }

    return inv;
  }, [selectedSchool, selectedCategory, selectedItemType, isAdmin, user?.schoolId, rawInventory, getSchoolInventory, getConditionOverride]);

  const getPdfOptions = () => ({
    margin: [10, 12.7, 45, 12.7], // top, left, bottom, right (mm) - large bottom so signature block is never cut
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { avoid: ['tr'] }, // Buo ang table kada page - walang putol na row
  });

  const getReportFilename = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const typeName = reportTypes.find(r => r.id === reportType)?.title?.replace(/\s+/g, '-') || 'Report';
    const parts = [typeName, dateStr];
    
    if (selectedSchool !== 'all') {
      const schoolName = schools.find(s => s.id === selectedSchool)?.name || selectedSchool;
      parts.push(schoolName.replace(/\s+/g, '-').substring(0, 20));
    }
    if (selectedCategory !== 'all') {
      parts.push(selectedCategory.replace(/\s+/g, '-'));
    }
    if (selectedItemType !== 'all') {
      parts.push(selectedItemType.replace(/\s+/g, '-'));
    }
    
    return `${parts.join('-')}.pdf`;
  };

  const handleGenerateReport = async () => {
    if (!reportRef.current) return;

    const el = reportRef.current;
    const opt = {
      ...getPdfOptions(),
      filename: getReportFilename(),
    };

    try {
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrintPreview = async () => {
    if (!reportRef.current) return;

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
        a.download = getReportFilename();
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Print failed:', err);
      alert('Failed to open print preview. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="Generate and export inventory reports" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Report Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes
            .filter((r) => !r.adminOnly || isAdmin)
            .map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all flex flex-col ${
                  reportType === report.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => setReportType(report.id)}
              >
                <CardHeader className="pb-2 flex-1">
                  <div className="flex items-start gap-3">
                    <report.icon className={`w-6 h-6 shrink-0 ${report.color}`} />
                    <div className="min-w-0">
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <CardDescription className="text-sm mt-1.5">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>

        {/* Report Configuration */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Report Configuration
          </h3>

          <div className="flex flex-row flex-nowrap items-center gap-3 overflow-x-auto">
            {/* School Selection (Admin only or locked for school users) */}
            {isAdmin ? (
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="w-96 text-left bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-200">
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
            ) : (
              <div className="p-2 rounded border bg-muted text-sm min-w-[200px]">
                {schools.find((s) => s.id === user?.schoolId)?.name}
              </div>
            )}

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-44 bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-200">
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

            {/* Item Type */}
            <Select value={selectedItemType} onValueChange={setSelectedItemType}>
              <SelectTrigger className="w-36 bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Consumable">Consumable</SelectItem>
                <SelectItem value="Semi-Expendable">Semi-Expendable</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={handleGenerateReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button
                size="sm"
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={handlePrintPreview}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="card-elevated">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">
              Report Preview
            </h3>
            <span className="text-sm text-muted-foreground">
              {reportType === 'movement' && isAdmin
                ? 'Movement History Report (Admin Only)'
                : 'Sample output based on current selection'}
            </span>
          </div>

          <div className="p-6 inventory-report-print" ref={reportRef}>
            {reportType === 'inventory' ? (
              <InventoryReport
                inventory={filteredInventory}
                reportTitle="Inventory Report"
                selectedSchool={selectedSchool}
                selectedCategory={selectedCategory}
                selectedItemType={selectedItemType}
                preparedBy={user?.displayName || 'SDO Administrator'}
              />
            ) : reportType === 'movement' && isAdmin ? (
              <MovementReport 
                transfers={transfers}
                selectedSchool={selectedSchool}
                selectedCategory={selectedCategory}
                selectedItemType={selectedItemType}
              />
            ) : reportType === 'stockcard' ? (
              <StockCardReport
                items={filteredInventory}
                schoolId={selectedSchool === 'all' ? null : selectedSchool}
                isAdmin={isAdmin}
              />
            ) : reportType === 'rsmi' ? (
              <RSMIReport
                items={filteredInventory}
                schoolId={selectedSchool === 'all' ? null : selectedSchool}
                isAdmin={isAdmin}
              />
            ) : reportType === 'rcpi' ? (
              <RCPIReport
                items={filteredInventory}
                schoolId={selectedSchool === 'all' ? null : selectedSchool}
                isAdmin={isAdmin}
              />
            ) : (
              <InventoryReport
                inventory={filteredInventory}
                reportTitle={reportTypes.find((r) => r.id === reportType)?.title || 'Report'}
                selectedSchool={selectedSchool}
                selectedCategory={selectedCategory}
                selectedItemType={selectedItemType}
                preparedBy={user?.displayName || 'SDO Administrator'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
