import React from 'react';
import { movements, schools, items, rawInventoryInitial } from '@/data/mockData';

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
 * Format date for display
 */
const formatDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${parseInt(m, 10)}/${parseInt(day, 10)}/${y}`;
};

/**
 * Get school name by ID
 */
const getSchoolName = (schoolId) => {
  if (!schoolId) return 'Unknown';
  const school = schools.find(s => s.id === schoolId);
  return school ? school.name : schoolId;
};

/**
 * Get item details by itemId
 */
const getItemDetails = (itemId) => {
  return items.find(item => item.id === itemId) || null;
};

/**
 * Build report rows from movements and transfers with filters
 */
const buildReportRows = (transfers = [], selectedSchool = 'all', selectedCategory = 'all', selectedItemType = 'all') => {
  const rows = [];
  
  // Combine movements and transfers into a unified list
  let allTransactions = [
    ...movements.map(m => ({
      ...m,
      source: 'movements',
    })),
    ...transfers.map(t => ({
      ...t,
      source: 'transfers',
    })),
  ];

  // Filter by school
  if (selectedSchool !== 'all') {
    allTransactions = allTransactions.filter(t => {
      // For Delivery, Issue, Disposal: check schoolId
      if (t.type === 'Delivery' || t.type === 'Issue' || t.type === 'Disposal') {
        return t.schoolId === selectedSchool;
      }
      // For Transfer: check if schoolId or targetSchoolId matches
      if (t.type === 'Transfer') {
        return t.schoolId === selectedSchool || t.targetSchoolId === selectedSchool;
      }
      return false;
    });
  }

  // Flatten items from each transaction and apply category/item type filters
  const flatTransactions = [];
  
  allTransactions.forEach(transaction => {
    if (transaction.items && transaction.items.length > 0) {
      transaction.items.forEach(item => {
        const itemDetails = getItemDetails(item.itemId);
        
        // Filter by category
        if (selectedCategory !== 'all') {
          if (!itemDetails || itemDetails.category !== selectedCategory) {
            return; // Skip this item
          }
        }
        
        // Filter by item type
        if (selectedItemType !== 'all') {
          if (!itemDetails || itemDetails.type !== selectedItemType) {
            return; // Skip this item
          }
        }
        
        flatTransactions.push({
          ...transaction,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          itemCategory: itemDetails?.category || '',
          itemType: itemDetails?.type || '',
        });
      });
    }
  });

  // Group by item and school, then sort by date
  const grouped = {};
  
  flatTransactions.forEach(t => {
    // Determine which school this transaction affects
    let affectedSchoolId, affectedSchoolName;
    
    if (t.type === 'Delivery') {
      // Delivery: affects the receiving school
      affectedSchoolId = t.schoolId;
      affectedSchoolName = t.schoolName || getSchoolName(t.schoolId);
    } else if (t.type === 'Issue' || t.type === 'Disposal') {
      // Issue/Disposal: affects the school that issued/disposed
      affectedSchoolId = t.schoolId;
      affectedSchoolName = t.schoolName || getSchoolName(t.schoolId);
    } else if (t.type === 'Transfer') {
      // Transfer: for SDO movement report, we only track the sender (bawas sa nagbigay)
      const senderId = t.schoolId;
      const receiverId = t.targetSchoolId;
      const senderName = t.schoolName || getSchoolName(senderId);
      const receiverName = t.targetSchoolName || getSchoolName(receiverId);
      
      // Add sender entry (issue) only
      const senderKey = `${t.itemId}-${senderId}`;
      if (!grouped[senderKey]) {
        grouped[senderKey] = {
          itemId: t.itemId,
          itemName: t.itemName,
          schoolId: senderId,
          schoolName: senderName,
          transactions: [],
        };
      }
      grouped[senderKey].transactions.push({
        ...t,
        isReceipt: false,
        isIssue: true,
        counterparty: receiverName,
        fromOffice: senderName,
        toOffice: receiverName,
        affectedSchoolId: senderId,
        affectedSchoolName: senderName,
      });
      
      return; // Skip the default processing for transfers (no receiver entry)
    }
    
    if (!affectedSchoolId) return;
    
    const key = `${t.itemId}-${affectedSchoolId}`;
    if (!grouped[key]) {
      grouped[key] = {
        itemId: t.itemId,
        itemName: t.itemName,
        schoolId: affectedSchoolId,
        schoolName: affectedSchoolName,
        transactions: [],
      };
    }
    
    // Determine if this is receipt or issue
    const isReceipt = t.type === 'Delivery';
    const isIssue = t.type === 'Issue' || t.type === 'Disposal';
    
    grouped[key].transactions.push({
      ...t,
      isReceipt,
      isIssue,
      counterparty: '',
      fromOffice:
        t.type === 'Delivery'
          ? '—'
          : affectedSchoolName,
      toOffice:
        t.type === 'Delivery'
          ? affectedSchoolName
          : '—',
      affectedSchoolId,
      affectedSchoolName,
    });
  });

  // Build rows for each item-school combination
  Object.values(grouped).forEach(group => {
    const sortedTransactions = group.transactions.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Starting balance: for SDO, use rawInventoryInitial as authoritative
    let balance = 0;
    if (group.schoolId === 'sdo') {
      const rawEntry = rawInventoryInitial.find((e) => e.itemId === group.itemId);
      balance = rawEntry?.quantity ?? 0;
    }
    
    sortedTransactions.forEach(t => {
      const baseRef = t.refNo || t.reason || '—';
     
      const reference = `${baseRef} - ${group.itemName}`;

      const openingQty = balance;
      let deducted = 0;
      let transferTo = '—';

      if (t.isReceipt) {
        
        balance += t.quantity;
      } else if (t.isIssue) {
        
        deducted = t.quantity;
        transferTo = t.toOffice || t.counterparty || '—';
        balance -= t.quantity;
        if (balance < 0) balance = 0;
      }

      const qtyForRow = t.isReceipt ? balance : openingQty;

      rows.push({
        date: t.date,
        reference,
        qty: qtyForRow,
        deducted,
        transferTo,
        balance,
        itemName: group.itemName,
      });
    });
  });

  // Sort all rows by date, then by item (no more office column in output)
  rows.sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.itemName.localeCompare(b.itemName);
  });

  return rows;
};

const MovementReport = ({ 
  transfers = [], 
  selectedSchool = 'all', 
  selectedCategory = 'all', 
  selectedItemType = 'all' 
}) => {
  const reportRows = buildReportRows(transfers, selectedSchool, selectedCategory, selectedItemType);

  return (
    <div className="space-y-8">
      <div
        className="stock-card bg-white"
        style={{ minHeight: '250mm', display: 'flex', flexDirection: 'column' }}
      >
        {/* Top right: Report Title */}
        <div className="text-right text-sm text-muted-foreground mb-1">
          Inventory Movement Report
        </div>

        <div className="flex-1 flex flex-col">
          {/* Logo and title */}
          <DepEdLogo />
          <h1 className="text-center text-xl font-bold uppercase tracking-wide mb-3">
            Schools Division of City of Baliuag
          </h1>
          <h2 className="text-center text-lg font-semibold mb-4">
            Inventory Movement Report
          </h2>

          {/* Report Date and Filters */}
          <div className="mb-4 text-sm">
          <div className="text-center mb-3">
            <p className="font-semibold">
              As of{' '}
              {new Date().toLocaleDateString('en-PH', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          
          {(selectedSchool !== 'all' || selectedCategory !== 'all' || selectedItemType !== 'all') && (
            <div className="border-t border-b border-border py-2 mt-3">
             
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {selectedSchool !== 'all' && (
                  <div>
                    <span className="font-medium text-muted-foreground">School:</span>{' '}
                    <span className="text-foreground">{getSchoolName(selectedSchool)}</span>
                  </div>
                )}
                {selectedCategory !== 'all' && (
                  <div>
                    <span className="font-medium text-muted-foreground">Category:</span>{' '}
                    <span className="text-foreground">{selectedCategory}</span>
                  </div>
                )}
                {selectedItemType !== 'all' && (
                  <div>
                    <span className="font-medium text-muted-foreground">Item Type:</span>{' '}
                    <span className="text-foreground">{selectedItemType}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Transaction table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left font-bold">Date</th>
                <th className="border border-border p-2 text-left font-bold">Reference</th>
                <th className="border border-border p-2 text-center font-bold">Qty</th>
                <th className="border border-border p-2 text-center font-bold">Deducted</th>
                <th className="border border-border p-2 text-left font-bold">Transfer To</th>
                <th className="border border-border p-2 text-center font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const MIN_ROWS = 10;
                const rows =
                  reportRows.length === 0
                    ? [{ __empty: true }]
                    : [...reportRows];
                while (rows.length < MIN_ROWS) {
                  rows.push({ __placeholder: true });
                }
                return rows.map((row, idx) => {
                  if (row.__empty) {
                    return (
                      <tr key={`empty-${idx}`}>
                        <td colSpan="5" className="border border-border p-4 text-center text-muted-foreground">
                          No transactions found
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx}>
                      <td className="border border-border p-2">
                        {row.date ? formatDate(row.date) : ''}
                      </td>
                      <td className="border border-border p-2">{row.reference || ''}</td>
                      <td className="border border-border p-2 text-center">
                        {row.qty != null ? row.qty : ''}
                      </td>
                      <td className="border border-border p-2 text-center">
                        {row.deducted || ''}
                      </td>
                      <td className="border border-border p-2">
                        {row.transferTo || ''}
                      </td>
                      <td className="border border-border p-2 text-center">
                        {row.balance != null ? row.balance : ''}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
            </table>
          </div>
        </div>

        {/* Footer pinned near bottom of page - do not cut when printing */}
        <div className="report-footer mt-8 pt-4 pb-12 border-t border-border grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Prepared By:</p>
            <p className="font-medium mt-4 border-t border-foreground w-48 pt-1">
              SDO Administrator
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
  );
};

export default MovementReport;
