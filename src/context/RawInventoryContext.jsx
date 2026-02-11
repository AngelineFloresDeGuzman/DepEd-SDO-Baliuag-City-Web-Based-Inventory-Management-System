import React, { createContext, useContext, useState, useCallback } from 'react';
import { rawInventoryInitial } from '@/data/mockData';

const RawInventoryContext = createContext(undefined);

export const RawInventoryProvider = ({ children }) => {
  const [rawInventory, setRawInventory] = useState(rawInventoryInitial);

  const addRawEntry = useCallback((entry) => {
    const id = `raw${Date.now()}`;
    setRawInventory((prev) => [...prev, { ...entry, id }]);
  }, []);

  const removeRawEntry = useCallback((id) => {
    setRawInventory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateRawEntry = useCallback((id, updates) => {
    setRawInventory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
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
