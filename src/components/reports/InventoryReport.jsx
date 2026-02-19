import React from 'react';
import { schools } from '@/data/mockData';

const DepEdLogo = () => (
  <div className="flex justify-center mb-2">
    <img
      src="/deped-logo.png"
      alt="DepEd - Kagawaran ng Edukasyon"
      className="w-20 h-20 object-contain"
    />
  </div>
);

const getSchoolName = (schoolId) => {
  if (!schoolId) return 'All Schools';
  const school = schools.find(s => s.id === schoolId);
  return school ? school.name : schoolId;
};

const InventoryReport = ({
  inventory = [],
  reportTitle = 'Inventory Report',
  selectedSchool = 'all',
  selectedCategory = 'all',
  selectedItemType = 'all',
  preparedBy = 'SDO Administrator',
}) => {
  return (
    <div
      className="stock-card bg-white"
      style={{ minHeight: '250mm', display: 'flex', flexDirection: 'column' }}
    >
      <div className="text-right text-sm text-muted-foreground mb-1">
        {reportTitle}
      </div>

      <div className="flex-1 flex flex-col">
        <DepEdLogo />
        <h1 className="text-center text-xl font-bold uppercase tracking-wide mb-3">
          Schools Division of City of Baliuag
        </h1>
        <h2 className="text-center text-lg font-semibold mb-4">
          {reportTitle}
        </h2>

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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-bold">Item Code</th>
              <th className="border border-border p-2 text-left font-bold">Item Name</th>
              <th className="border border-border p-2 text-left font-bold">Category</th>
              <th className="border border-border p-2 text-center font-bold">Quantity</th>
              <th className="border border-border p-2 text-left font-bold">Condition</th>
              <th className="border border-border p-2 text-left font-bold">Date Acquired</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const MIN_ROWS = 10;
              const rows =
                inventory.length === 0
                  ? [{ __empty: true }]
                  : [...inventory];
              while (rows.length < MIN_ROWS) {
                rows.push({ __placeholder: true });
              }
              return rows.map((item, idx) => {
                if (item.__empty) {
                  return (
                    <tr key={`empty-${idx}`}>
                      <td colSpan="6" className="border border-border p-4 text-center text-muted-foreground">
                        No inventory items found
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={`${item.schoolId || 'na'}-${item.id || item.itemId || idx}`}>
                    <td className="border border-border p-2 font-mono">{item.code || item.itemCode || ''}</td>
                    <td className="border border-border p-2">{item.name || item.itemName || ''}</td>
                    <td className="border border-border p-2">{item.category || ''}</td>
                    <td className="border border-border p-2 text-center">
                      {item.quantity != null ? item.quantity : ''}
                    </td>
                    <td className="border border-border p-2">{item.condition || ''}</td>
                    <td className="border border-border p-2">{item.dateAcquired || ''}</td>
                  </tr>
                );
              });
            })()}
          </tbody>
          </table>
        </div>
      </div>

      {/* Footer pinned near bottom of page */}
      <div className="mt-8 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Prepared By:</p>
          <p className="font-medium mt-4 border-t border-foreground w-48 pt-1">
            {preparedBy}
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
  );
};

export default InventoryReport;
