import React from 'react';
import { movements } from '@/data/mockData';

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
 * Item master ID for matching movements (base items use id, school additions use itemId).
 */
const getItemMasterId = (item) => item.itemId || item.id;

/**
 * Build transaction rows for an item from movements and inventory.
 * Uses actual inventory quantity as the authoritative balance.
 */
const buildTransactionRows = (item, schoolId, isAdmin) => {
  const rows = [];
  const effectiveSchool = schoolId || item.schoolId;
  const itemMasterId = getItemMasterId(item);
  const relevantMovements = movements
    .filter((m) => {
      if (!m.items?.some((i) => i.itemId === itemMasterId)) return false;
      if (isAdmin) return true;
      return m.schoolId === schoolId || m.targetSchoolId === schoolId;
    })
    .flatMap((m) =>
      m.items
        .filter((i) => i.itemId === itemMasterId)
        .map((i) => ({ ...m, qty: i.quantity }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const initialDate = item.dateAcquired || new Date().toISOString().split('T')[0];
  const hasAnyMovements = relevantMovements.length > 0;

  if (!hasAnyMovements) {
    rows.push({
      date: initialDate,
      reference: 'Initial / On-hand',
      receiptQty: item.quantity,
      issueQty: '',
      issueSchool: '',
      balance: item.quantity,
      daysToConsume: '—',
    });
    return rows;
  }

  let balance = 0;
  relevantMovements.forEach((m) => {
    const isReceipt = m.type === 'Delivery' || (m.type === 'Transfer' && m.targetSchoolId === effectiveSchool);
    const isIssue = m.type === 'Issue' || m.type === 'Disposal' || (m.type === 'Transfer' && m.schoolId === effectiveSchool);
    const ref = m.refNo || m.reason || '—';
    const school = isIssue ? (m.targetSchoolName || m.schoolName || '—') : '';

    if (isReceipt) {
      balance += m.qty;
      rows.push({
        date: m.date,
        reference: ref,
        receiptQty: m.qty,
        issueQty: '',
        issueSchool: '',
        balance,
        daysToConsume: '—',
      });
    } else if (isIssue) {
      balance -= m.qty;
      if (balance < 0) balance = 0;
      rows.push({
        date: m.date,
        reference: ref,
        receiptQty: '',
        issueQty: m.qty,
        issueSchool: school,
        balance,
        daysToConsume: '—',
      });
    }
  });

  // Ensure final balance matches actual inventory quantity (authoritative)
  const actualBalance = item.quantity ?? 0;
  if (rows.length > 0 && rows[rows.length - 1].balance !== actualBalance) {
    rows.push({
      date: new Date().toISOString().split('T')[0],
      reference: 'Balance as of report date',
      receiptQty: '',
      issueQty: '',
      issueSchool: '',
      balance: actualBalance,
      daysToConsume: '—',
    });
  }

  return rows;
};

const EMPTY_ROW = { date: '', reference: '', receiptQty: '', issueQty: '', issueSchool: '', balance: '', daysToConsume: '' };
const MIN_DATA_ROWS = 6;

const formatDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${parseInt(m, 10)}/${parseInt(day, 10)}/${y}`;
};

const StockCardReport = ({ items, schoolId, isAdmin, filtersSummary }) => {
  return (
    <div className="space-y-8">
      {items.map((item, cardIndex) => {
        const rows = buildTransactionRows(item, schoolId, isAdmin);
        const stockNo = item.code || item.id || '—';

        return (
          <div
            key={`${item.schoolId}-${item.id}-${cardIndex}`}
            className="stock-card bg-white"
            style={{ pageBreakAfter: cardIndex < items.length - 1 ? 'always' : 'auto' }}
          >
            {/* Top right: Appendix 58 */}
            <div className="text-right text-sm text-muted-foreground mb-1">
              Appendix 58
            </div>

            {/* Logo and title */}
            <DepEdLogo />
            <h1 className="text-center text-xl font-bold uppercase tracking-wide mb-3">
              Stock Card
            </h1>

            {/* Entity Name and Item details - organized layout */}
            <div className="space-y-4 mb-3 text-sm">
              <p className="font-bold">Entity Name: SDO BALIWAG</p>
              <div className="grid grid-cols-2 gap-x-16 gap-y-2">
                <div className="flex gap-2">
                  <span className="w-40 shrink-0 font-bold">Item:</span>
                  <span>{item.category || item.type || '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-40 shrink-0 font-bold">Fund Cluster:</span>
                  <span>{item.fundCluster ?? '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-40 shrink-0 font-bold">Description:</span>
                  <span>{item.name || '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-40 shrink-0 font-bold">Stock No.:</span>
                  <span>{stockNo}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-40 shrink-0 font-bold">Unit of Measurement:</span>
                  <span>{item.unit || '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-40 shrink-0 font-bold">Re-order Point:</span>
                  <span>{item.reorderLevel != null ? item.reorderLevel : '—'}</span>
                </div>
              </div>
            </div>

            {/* Transaction table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-left font-bold">Date</th>
                    <th className="border border-border p-2 text-left font-bold">Reference</th>
                    <th colSpan="1" className="border border-border p-2 text-center font-bold">Receipt</th>
                    <th colSpan="2" className="border border-border p-2 text-center font-bold">Issue</th>
                    <th colSpan="1" className="border border-border p-2 text-center font-bold">Balance</th>
                    <th className="border border-border p-2 text-center font-bold">No. of Days to Consume</th>
                  </tr>
                  <tr className="bg-muted/70">
                    <th className="border border-border p-1"></th>
                    <th className="border border-border p-1"></th>
                    <th className="border border-border p-1 text-center text-xs font-bold">Qty.</th>
                    <th className="border border-border p-1 text-center text-xs font-bold">Qty.</th>
                    <th className="border border-border p-1 text-center text-xs font-bold">SCHOOL</th>
                    <th className="border border-border p-1 text-center text-xs font-bold">Qty.</th>
                    <th className="border border-border p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const padded = [...rows];
                    while (padded.length < MIN_DATA_ROWS) padded.push(EMPTY_ROW);
                    return padded;
                  })().map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-border p-2">{row.date ? formatDate(row.date) : ''}</td>
                      <td className="border border-border p-2">{row.reference}</td>
                      <td className="border border-border p-2 text-center">{row.receiptQty}</td>
                      <td className="border border-border p-2 text-center">{row.issueQty}</td>
                      <td className="border border-border p-2">{row.issueSchool}</td>
                      <td className="border border-border p-2 text-center">{row.balance}</td>
                      <td className="border border-border p-2 text-center">{row.daysToConsume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filtersSummary && items.length > 0 && (
        <div className="text-xs text-muted-foreground pt-4 pb-4 border-t border-border break-words overflow-visible" style={{ pageBreakInside: 'avoid' }}>
          Filters applied: {filtersSummary} • Prepared by: {new Date().toLocaleDateString('en-PH')}
        </div>
      )}
    </div>
  );
};

export default StockCardReport;
