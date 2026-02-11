import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import { schools, categories, generateInventory } from '@/data/mockData';
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

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'sdo_admin';

  const [selectedSchool, setSelectedSchool] = useState(
    isAdmin ? 'all' : user?.schoolId || ''
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const handleGenerateReport = () => {
    // Mock report generation - in production, this would generate a PDF
    console.log('Generating report:', {
      type: reportType,
      school: selectedSchool,
      category: selectedCategory,
    });

    // Show mock PDF preview
    alert(
      `Report Generated!\n\nType: ${reportType}\nSchool: ${
        selectedSchool === 'all'
          ? 'All Schools'
          : schools.find((s) => s.id === selectedSchool)?.name
      }\nCategory: ${
        selectedCategory === 'all' ? 'All Categories' : selectedCategory
      }\n\nPrepared By: ${user?.displayName}\nDate: ${new Date().toLocaleDateString(
        'en-PH'
      )}`
    );
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* School Selection (Admin only or locked for school users) */}
            <div>
              <Label>School</Label>
              {isAdmin ? (
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="mt-1">
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
                <div className="mt-1 p-2 rounded border bg-muted text-sm">
                  {schools.find((s) => s.id === user?.schoolId)?.name}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
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

            {/* Item Type (for inventory reports) */}
            <div>
              <Label>Item Type</Label>
              <Select defaultValue="all">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Consumable">Consumable</SelectItem>
                  <SelectItem value="Asset">Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleGenerateReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate PDF Report
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print Preview
            </Button>
          </div>
        </div>

        {/* COA Audit Mode (Admin Only) */}
        {isAdmin && (
          <div className="card-elevated p-6 border-l-4 border-l-success">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">
                  COA Audit Mode
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Generate comprehensive audit reports with complete movement history,
                  attached documentation, and change logs. All reports include
                  "Prepared By" and "Date Generated" fields for official use.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-success hover:bg-success/90">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate COA Report
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Attachments
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sample Report Preview */}
        <div className="card-elevated">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">
              Report Preview
            </h3>
            <span className="text-sm text-muted-foreground">
              Sample output based on current selection
            </span>
          </div>

          <div className="p-6">
            {/* Mock Report Header */}
            <div className="text-center mb-6 pb-6 border-b border-border">
              <h4 className="text-lg font-display font-bold text-foreground">
                SCHOOLS DIVISION OF CITY OF BALIUAG
              </h4>
              <p className="text-muted-foreground">
                {reportTypes
                  .find((r) => r.id === reportType)
                  ?.title.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                As of{' '}
                {new Date().toLocaleDateString('en-PH', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Mock Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Item Code</th>
                    <th className="text-left p-2">Item Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-center p-2">Quantity</th>
                    <th className="text-left p-2">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-mono">OS-001</td>
                    <td className="p-2">Bondpaper, A4, Ream</td>
                    <td className="p-2">Office Supplies</td>
                    <td className="p-2 text-center">45</td>
                    <td className="p-2">Good</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-mono">OS-003</td>
                    <td className="p-2">Ball Pen, Black, Pc</td>
                    <td className="p-2">Office Supplies</td>
                    <td className="p-2 text-center">180</td>
                    <td className="p-2">Good</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-mono">ICT-001</td>
                    <td className="p-2">Printer, Epson L121</td>
                    <td className="p-2">ICT Equipment</td>
                    <td className="p-2 text-center">3</td>
                    <td className="p-2">Good</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mock Footer */}
            <div className="mt-8 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Prepared By:</p>
                <p className="font-medium mt-4 border-t border-foreground w-48 pt-1">
                  {user?.displayName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Date Generated:</p>
                <p className="font-medium mt-4">
                  {new Date().toLocaleDateString('en-PH')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
