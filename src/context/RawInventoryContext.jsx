import React, { createContext, useContext, useState, useCallback } from 'react';
import { rawInventoryInitial } from '@/data/mockData';

const RawInventoryContext = createContext(undefined);

export const RawInventoryProvider = ({ children }) => {
  // Attach an immutable baseline quantity so we can show "Deducted" in the SDO warehouse table
  const [rawInventory, setRawInventory] = useState(
    rawInventoryInitial.map((entry) => ({
      ...entry,
      initialQuantity:
        typeof entry.initialQuantity === 'number' && entry.initialQuantity >= 0
          ? entry.initialQuantity
          : entry.quantity || 0,
    }))
  );

  const addRawEntry = useCallback((entry) => {
    const id = `raw${Date.now()}`;
    const quantity = entry.quantity || 0;
    setRawInventory((prev) => [
      ...prev,
      {
        ...entry,
        id,
        initialQuantity:
          typeof entry.initialQuantity === 'number' && entry.initialQuantity >= 0
            ? entry.initialQuantity
            : quantity,
      },
    ]);
  }, []);

  const removeRawEntry = useCallback((id) => {
    setRawInventory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateRawEntry = useCallback((id, updates) => {
    setRawInventory((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              // Preserve the original baseline unless an explicit initialQuantity is provided
              initialQuantity:
                typeof (updates.initialQuantity ?? e.initialQuantity) === 'number' &&
                (updates.initialQuantity ?? e.initialQuantity) >= 0
                  ? updates.initialQuantity ?? e.initialQuantity
                  : e.initialQuantity,
            }
          : e
      )
    );
  }, []);

  // Stats for dashboard
  const totalRawLineItems = rawInventory.length;
  const totalRawQuantity = rawInventory.reduce((sum, e) => sum + (e.quantity || 0), 0);
  const totalBudgetValue = rawInventory.reduce((sum, e) => sum + (e.totalCost || e.quantity * e.unitPrice || 0), 0);

  return (
    <RawInventoryContext.Provider
      value={{
        rawInventory,
        addRawEntry,
        removeRawEntry,
        updateRawEntry,
        totalRawLineItems,
        totalRawQuantity,
        totalBudgetValue,
      }}
    >
      {children}
    </RawInventoryContext.Provider>
  );
};

export const useRawInventory = () => {
  const context = useContext(RawInventoryContext);
  if (context === undefined) {
    throw new Error('useRawInventory must be used within a RawInventoryProvider');
  }
  return context;
};
