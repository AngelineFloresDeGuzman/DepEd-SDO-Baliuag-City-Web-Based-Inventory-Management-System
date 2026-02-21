import React from 'react';
import { movements, items } from '@/data/mockData';

/**
 * DepEd official logo.
 */
const DepEdLogo = () => (
  <div className="flex justify-center mb-2">
    <img
      src="/deped-logo.png"
      alt="DepEd - Kagawaran ng Edukasyon"
      className="w-20 h-20 object-contain"
    />
  </div>
);

/**
 * RSMI Report - Report of Supplies and Materials Issued
 */
const RSMIReport = ({ items, schoolId, isAdmin, filtersSummary }) => {
  // Get current month and year
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  
  // Get school name
  const schoolName = schoolId === 'sdo' || !schoolId ? 'SDO CITY OF BALIWAG' : 'SDO CITY OF BALIWAG';
  
  // Filter movements to get issued items
  // RSMI shows items issued FROM the selected school (or all if viewing as admin/all)
  // For admin/all: show all Issue movements from any school
  // For specific school: show only Issue movements from that school
  const issuedMovements = movements
    .filter((m) => {
      // Only show Issue type movements (items issued to users/offices)
      if (m.type !== 'Issue') return false;
      
      // If viewing all schools as admin, show all issues
      if (isAdmin && (!schoolId || schoolId === 'all')) return true;
      
      // Otherwise, show only issues from the selected school
      return m.schoolId === schoolId;
    })
    .flatMap((m) =>
      m.items?.map((item) => ({
        ...m,
        itemId: item.itemId,
        quantity: item.quantity,
      })) || []
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Build report rows by matching movements with items
  const reportRows = [];
  issuedMovements.forEach((movement) => {
    // Find item from base items (mockData)
    const item = items.find((i) => i.id === movement.itemId);
    
    // If not found in base items, try to get from movement's itemName
    const itemName = item?.name || movement.items?.find(i => i.itemId === movement.itemId)?.itemName || '—';
    const itemCode = item?.code || item?.id || '—';
    const itemUnit = item?.unit || '—';
    const unitCost = item?.unitPrice || 0;
    const amount = unitCost * movement.quantity;
    
    // Get responsibility center code (school code)
    // Use school ID as responsibility center code, or default to '101101' for SDO
    const responsibilityCenterCode = movement.schoolId === 'sdo' 
      ? '101101' // SDO code
      : movement.schoolId?.toUpperCase() || '—';
    
    reportRows.push({
      risNo: movement.refNo || `RIS-${movement.date}`,
      responsibilityCenterCode: responsibilityCenterCode,
      stockNo: itemCode,
      item: itemName,
      unit: itemUnit,
      quantityIssued: movement.quantity,
      unitCost: unitCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      amount: amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    });
  });

  // Ensure minimum 10 rows
  const MIN_ROWS = 10;
  const paddedRows = [...reportRows];
  while (paddedRows.length < MIN_ROWS) {
    paddedRows.push({
      risNo: '',
      responsibilityCenterCode: '',
      stockNo: '',
      item: '',
      unit: '',
      quantityIssued: '',
      unitCost: '',
      amount: '',
    });
  }

  const totalAmount = reportRows.reduce((sum, row) => {
    const amt = parseFloat(row.amount.replace(/,/g, '')) || 0;
    return sum + amt;
  }, 0);

  return (
    <div className="stock-card bg-white" style={{ minHeight: '250mm', display: 'flex', flexDirection: 'column' }}>
      {/* Top right: Appendix 64 */}
      <div className="text-right text-sm text-muted-foreground mb-1">
        Appendix 64
      </div>

      {/* Logo and title */}
      <DepEdLogo />
      <h1 className="text-center text-xl font-bold uppercase tracking-wide mb-3">
        REPORT OF SUPPLIES AND MATERIALS ISSUED
      </h1>

      {/* Entity and Date info */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="font-bold">Entity Name: {schoolName}</p>
            <p className="font-bold">Fund Cluster: 101101</p>
          </div>
          <div className="text-right">
            <p>Serial No.:</p>
            <p>Date: {monthYear}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th colSpan="5" className="border border-border p-2 text-center font-bold">
                  To be filled up by the Supply and/or Property Division/Unit
                </th>
                <th colSpan="3" className="border border-border p-2 text-center font-bold">
                  To be filled up by the Accounting Division/Unit
                </th>
              </tr>
              <tr className="bg-muted/70">
                <th className="border border-border p-2 text-left font-bold">RIS No.</th>
                <th className="border border-border p-2 text-left font-bold">Responsibility Center Code</th>
                <th className="border border-border p-2 text-left font-bold">Stock No.</th>
                <th className="border border-border p-2 text-left font-bold">Item</th>
                <th className="border border-border p-2 text-center font-bold">Unit</th>
                <th className="border border-border p-2 text-center font-bold">Quantity Issued</th>
                <th className="border border-border p-2 text-center font-bold">Unit Cost</th>
                <th className="border border-border p-2 text-center font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paddedRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-border p-2">{row.risNo || ''}</td>
                  <td className="border border-border p-2">{row.responsibilityCenterCode || ''}</td>
                  <td className="border border-border p-2">{row.stockNo || ''}</td>
                  <td className="border border-border p-2">{row.item || ''}</td>
                  <td className="border border-border p-2 text-center">{row.unit || ''}</td>
                  <td className="border border-border p-2 text-center">{row.quantityIssued || ''}</td>
                  <td className="border border-border p-2 text-center">{row.unitCost || ''}</td>
                  <td className="border border-border p-2 text-center">{row.amount || ''}</td>
                </tr>
              ))}
              {reportRows.length > 0 && (
                <tr className="bg-muted/50">
                  <td colSpan="7" className="border border-border p-2 text-right font-bold">Total:</td>
                  <td className="border border-border p-2 text-center font-bold">
                    {totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer pinned at bottom - do not cut when printing */}
      <div className="report-signature-block report-footer mt-8 pt-4 pb-12 border-t border-border text-sm">
        <div className="mb-4">
          <p className="mb-2">I hereby certify to the correctness of the above information.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-8">MARY GRACE S. RAMOS</p>
            <p className="text-muted-foreground">Administrative Officer IV</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">Posted by:</p>
            <p className="font-medium mb-8">LUCIA B. PASCUAL</p>
            <p className="text-muted-foreground">Accountant III</p>
            <p className="text-muted-foreground mt-4">DATE:</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSMIReport;
