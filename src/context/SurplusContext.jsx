import React, { createContext, useContext, useState, useCallback } from 'react';
import { surplusItems as initialSurplus } from '@/data/mockData';
import { schools } from '@/data/mockData';

const SurplusContext = createContext(undefined);

export const SurplusProvider = ({ children }) => {
  const [addedSurplus, setAddedSurplus] = useState([]);

  const allSurplus = [...initialSurplus, ...addedSurplus];

  const addSurplus = useCallback((entry) => {
    const id = `surplus-${Date.now()}`;
    const school = schools.find((s) => s.id === entry.schoolId);
    setAddedSurplus((prev) => [
      ...prev,
      {
        ...entry,
        id,
        schoolName: school?.name || entry.schoolName,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    ]);
  }, []);

  const removeSurplus = useCallback((id) => {
    setAddedSurplus((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <SurplusContext.Provider
      value={{
        surplusItems: allSurplus,
        addSurplus,
        removeSurplus,
      }}
    >
      {children}
    </SurplusContext.Provider>
  );
};

export const useSurplus = () => {
  const context = useContext(SurplusContext);
  if (context === undefined) {
    throw new Error('useSurplus must be used within a SurplusProvider');
  }
  return context;
};
