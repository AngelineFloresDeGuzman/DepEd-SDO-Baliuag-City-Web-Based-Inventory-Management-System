import React, { createContext, useContext, useState, useCallback } from 'react';

const SchoolInventoryContext = createContext(undefined);

const overrideKey = (schoolId, itemId) => `${schoolId}-${itemId}`;

export const SchoolInventoryProvider = ({ children }) => {
  // schoolId -> array of inventory entries
  const [schoolInventories, setSchoolInventories] = useState({});
  // Condition overrides for base (generated) inventory: key -> { condition, lastUpdated }
  const [conditionOverrides, setConditionOverrides] = useState({});

  const addToSchoolInventory = useCallback((schoolId, entry) => {
    const id = `school-inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setSchoolInventories((prev) => ({
      ...prev,
      [schoolId]: [...(prev[schoolId] || []), { ...entry, id }],
    }));
  }, []);

  const updateSchoolInventory = useCallback((schoolId, entryId, updates) => {
    setSchoolInventories((prev) => ({
      ...prev,
      [schoolId]: (prev[schoolId] || []).map((e) =>
        e.id === entryId ? { ...e, ...updates } : e
      ),
    }));
  }, []);

  const removeFromSchoolInventory = useCallback((schoolId, entryId) => {
    setSchoolInventories((prev) => ({
      ...prev,
      [schoolId]: (prev[schoolId] || []).filter((e) => e.id !== entryId),
    }));
  }, []);

  const getSchoolInventory = useCallback(
    (schoolId) => schoolInventories[schoolId] || [],
    [schoolInventories]
  );

  const setConditionOverride = useCallback((schoolId, itemId, condition) => {
    const key = overrideKey(schoolId, itemId);
    setConditionOverrides((prev) => ({
      ...prev,
      [key]: {
        condition,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    }));
  }, []);

  const getConditionOverride = useCallback(
    (schoolId, itemId) => conditionOverrides[overrideKey(schoolId, itemId)] || null,
    [conditionOverrides]
  );

  return (
    <SchoolInventoryContext.Provider
      value={{
        addToSchoolInventory,
        updateSchoolInventory,
        removeFromSchoolInventory,
        getSchoolInventory,
        setConditionOverride,
        getConditionOverride,
      }}
    >
      {children}
    </SchoolInventoryContext.Provider>
  );
};

export const useSchoolInventory = () => {
  const context = useContext(SchoolInventoryContext);
  if (context === undefined) {
    throw new Error('useSchoolInventory must be used within a SchoolInventoryProvider');
  }
  return context;
};
