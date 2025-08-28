import React, { createContext, useContext, useState } from 'react';

const DataUpdateContext = createContext({});

export const DataUpdateProvider = ({ children }) => {
  const [myListNeedsUpdate, setMyListNeedsUpdate] = useState(false);
  const [viewingHistoryNeedsUpdate, setViewingHistoryNeedsUpdate] = useState(false);

  // マイリストの更新を通知
  const markMyListForUpdate = () => {
    console.log('My list marked for update');
    setMyListNeedsUpdate(true);
  };

  // 視聴履歴の更新を通知
  const markViewingHistoryForUpdate = () => {
    console.log('Viewing history marked for update');
    setViewingHistoryNeedsUpdate(true);
  };

  // 更新フラグをクリア
  const clearUpdateFlags = () => {
    setMyListNeedsUpdate(false);
    setViewingHistoryNeedsUpdate(false);
  };

  const value = {
    myListNeedsUpdate,
    viewingHistoryNeedsUpdate,
    markMyListForUpdate,
    markViewingHistoryForUpdate,
    clearUpdateFlags,
  };

  return (
    <DataUpdateContext.Provider value={value}>
      {children}
    </DataUpdateContext.Provider>
  );
};

export const useDataUpdate = () => {
  const context = useContext(DataUpdateContext);
  if (!context) {
    throw new Error('useDataUpdate must be used within a DataUpdateProvider');
  }
  return context;
};