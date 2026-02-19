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
  FileText,
  Download,
  ClipboardList,
  BarChart3,
  Calendar,
  Shield,
  Printer,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import MovementReport from '@/components/reports/MovementReport';
import InventoryReport from '@/components/reports/InventoryReport';

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
      id: 'movement',
      title: 'Movement History',
      description: 'All transactions including deliveries, issues, and disposals',
      icon: BarChart3,
      color: 'text-info',
      adminOnly: true,
    },
    {
      id: 'coa',
      title: 'COA Summary Report',
      description: 'Audit-ready report with complete documentation trail',
      icon: Shield,
      color: 'text-success',
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
    margin: [5, 12.7, 12.7, 12.7],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes
            .filter((r) => !r.adminOnly || isAdmin)
            .map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all ${
                  reportType === report.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => setReportType(report.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <report.icon className={`w-6 h-6 ${report.color}`} />
                    <CardTitle className="text-base">{report.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Report Configuration */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Report Configuration
          </h3>

          <div className="space-y-4">
            {/* School Selection (Admin only or locked for school users) */}
            <div>
              <Label htmlFor="school-select" className="text-sm font-medium">
                School / Office
              </Label>
              {isAdmin ? (
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger id="school-select" className="mt-1.5">
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
                <div className="mt-1.5 p-2 rounded border bg-muted text-sm">
                  {schools.find((s) => s.id === user?.schoolId)?.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <Label htmlFor="category-select" className="text-sm font-medium">
                  Category
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-select" className="mt-1.5">
                    <SelectValue placeholder="Select category" />
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

              {/* Item Type */}
              <div>
                <Label htmlFor="item-type-select" className="text-sm font-medium">
                  Item Type
                </Label>
                <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                  <SelectTrigger id="item-type-select" className="mt-1.5">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                    <SelectItem value="Semi-Expendable">Semi-Expendable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleGenerateReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate PDF Report
            </Button>
            <Button variant="outline" onClick={handlePrintPreview}>
              <Printer className="w-4 h-4 mr-2" />
              Print Preview
            </Button>
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

          <div className="p-6" ref={reportRef}>
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
