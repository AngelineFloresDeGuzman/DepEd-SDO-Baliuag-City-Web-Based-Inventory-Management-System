import React from 'react';

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
 * RCPI Report - Report on the Physical Count of Inventories
 */
const RCPIReport = ({ items, schoolId, isAdmin, filtersSummary }) => {
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Get school name
  const schoolName = schoolId === 'sdo' || !schoolId ? 'SDO CITY OF BALIWAG' : 'SDO CITY OF BALIWAG';
  
  // Determine inventory type (Consumable or Semi-Expendable)
  const inventoryType = items.length > 0 && items[0].type === 'Semi-Expendable' 
    ? 'SEMI-EXPENDABLE' 
    : 'CONSUMABLE';

  // Build report rows
  const reportRows = items.map((item) => {
    const balancePerCard = item.quantity || 0;
    const onHandCount = item.quantity || 0; // Assuming physical count matches inventory
    const shortage = balancePerCard - onHandCount;
    const unitValue = item.unitPrice || 0;
    const shortageValue = shortage * unitValue;

    return {
      article: item.category || '—',
      description: item.name || '—',
      stockNo: item.code || item.id || '—',
      unit: item.unit || '—',
      unitValue: unitValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      balancePerCard: balancePerCard,
      onHandCount: onHandCount,
      shortageQty: shortage !== 0 ? shortage : '',
      shortageValue: shortage !== 0 ? Math.abs(shortageValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '',
      remarks: '',
    };
  });

  // Ensure minimum 10 rows
  const MIN_ROWS = 10;
  const paddedRows = [...reportRows];
  while (paddedRows.length < MIN_ROWS) {
    paddedRows.push({
      article: '',
      description: '',
      stockNo: '',
      unit: '',
      unitValue: '',
      balancePerCard: '',
      onHandCount: '',
      shortageQty: '',
      shortageValue: '',
      remarks: '',
    });
  }

  return (
    <div className="stock-card bg-white" style={{ minHeight: '250mm', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%' }}>
      {/* Top right: Appendix 66 */}
      <div className="text-right text-sm text-muted-foreground mb-1">
        Appendix 66
      </div>

      {/* Logo and title */}
      <DepEdLogo />
      <h1 className="text-center text-xl font-bold uppercase tracking-wide mb-2">
        REPORT ON THE PHYSICAL COUNT OF INVENTORIES
      </h1>
      <p className="text-center text-sm font-bold mb-1">
        ({inventoryType})
      </p>
      <p className="text-center text-sm mb-3">
        As of {currentYear}
      </p>

      {/* Entity info */}
      <div className="space-y-2 mb-3 text-sm">
        <p className="font-bold">Fund Cluster: {schoolName}</p>
        <p className="text-sm">
          For which <span className="font-bold">MARY GRACE S. RAMOS, ADMINISTRATIVE OFFICER IV, SDO CITY OF BALIWAG PROPERTY AND SUPPLY UNIT</span> is accountable, having assumed such accountability on {currentYear}.
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col" style={{ width: '100%', overflow: 'visible' }}>
        <div className="overflow-x-auto print:overflow-visible" style={{ width: '100%' }}>
          <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto', width: '100%', minWidth: '100%', fontSize: '11px' }}>
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left font-bold" style={{ minWidth: '80px' }}>Article</th>
                <th className="border border-border p-2 text-left font-bold" style={{ minWidth: '120px' }}>Description</th>
                <th className="border border-border p-2 text-left font-bold" style={{ minWidth: '100px' }}>Stock Number</th>
                <th className="border border-border p-2 text-center font-bold" style={{ minWidth: '80px' }}>Unit of Measure</th>
                <th className="border border-border p-2 text-center font-bold" style={{ minWidth: '80px' }}>Unit Value</th>
                <th colSpan="2" className="border border-border p-2 text-center font-bold" style={{ minWidth: '120px' }}>Balance Per Card</th>
                <th colSpan="2" className="border border-border p-2 text-center font-bold" style={{ minWidth: '120px' }}>On Hand Per Count</th>
                <th colSpan="2" className="border border-border p-2 text-center font-bold" style={{ minWidth: '120px' }}>Shortage/Overage</th>
                <th className="border border-border p-2 text-left font-bold" style={{ minWidth: '100px', width: '100px' }}>Remarks</th>
              </tr>
              <tr className="bg-muted/70">
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1 text-center text-xs font-bold">Quantity</th>
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1 text-center text-xs font-bold">Quantity</th>
                <th className="border border-border p-1"></th>
                <th className="border border-border p-1 text-center text-xs font-bold">Quantity</th>
                <th className="border border-border p-1 text-center text-xs font-bold">Value</th>
                <th className="border border-border p-1"></th>
              </tr>
            </thead>
            <tbody>
              {paddedRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-border p-2">{row.article || ''}</td>
                  <td className="border border-border p-2">{row.description || ''}</td>
                  <td className="border border-border p-2">{row.stockNo || ''}</td>
                  <td className="border border-border p-2 text-center">{row.unit || ''}</td>
                  <td className="border border-border p-2 text-center">{row.unitValue || ''}</td>
                  <td className="border border-border p-2 text-center">{row.balancePerCard || ''}</td>
                  <td className="border border-border p-2"></td>
                  <td className="border border-border p-2 text-center">{row.onHandCount || ''}</td>
                  <td className="border border-border p-2"></td>
                  <td className="border border-border p-2 text-center">{row.shortageQty || ''}</td>
                  <td className="border border-border p-2 text-center">{row.shortageValue || ''}</td>
                  <td className="border border-border p-2" style={{ minWidth: '100px', width: '100px' }}>{row.remarks || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer pinned at bottom - do not cut when printing */}
      <div className="report-signature-block report-footer mt-8 pt-4 pb-12 border-t border-border text-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-muted-foreground mb-2">Certified Correct by:</p>
            <p className="font-medium mb-8">MARY GRACE S. RAMOS</p>
            <p className="text-muted-foreground">Administrative Officer IV</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">Approved by:</p>
            <p className="font-medium mb-8">ROWENA T. QUIAMBAO, CESO VI</p>
            <p className="text-muted-foreground text-xs">
              Signature over Printed Name of Head of Agency/Entity or Authorized Representative
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">Verified by:</p>
            <p className="text-muted-foreground text-xs mt-8">
              Signature over Printed Name of COA Representative
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RCPIReport;
