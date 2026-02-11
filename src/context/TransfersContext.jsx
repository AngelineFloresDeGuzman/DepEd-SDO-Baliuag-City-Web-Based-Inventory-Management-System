import React, { createContext, useContext, useState, useCallback } from 'react';
import { movements } from '@/data/mockData';

const baseTransfers = movements.filter((m) => m.type === 'Transfer');

const TransfersContext = createContext(undefined);

export const TransfersProvider = ({ children }) => {
  const [addedTransfers, setAddedTransfers] = useState([]);

  const allTransfers = [...baseTransfers, ...addedTransfers];

  const addTransfer = useCallback((transfer) => {
    setAddedTransfers((prev) => [...prev, { ...transfer }]);
  }, []);

  const updateTransferStatus = useCallback((transferId, status) => {
    setAddedTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status } : t))
    );
  }, []);

  return (
    <TransfersContext.Provider
      value={{
        transfers: allTransfers,
        addTransfer,
        updateTransferStatus,
      }}
    >
      {children}
    </TransfersContext.Provider>
  );
};

export const useTransfers = () => {
  const context = useContext(TransfersContext);
  if (context === undefined) {
    throw new Error('useTransfers must be used within a TransfersProvider');
  }
  return context;
};
