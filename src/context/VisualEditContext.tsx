import React, { createContext, useContext, useState } from 'react';

interface VisualEditContextType {
  isVisualEditActive: boolean;
  setIsVisualEditActive: (active: boolean) => void;
  activeEditingSlotKey: string | null;
  setActiveEditingSlotKey: (slotKey: string | null) => void;
}

const VisualEditContext = createContext<VisualEditContextType | undefined>(undefined);

export const VisualEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisualEditActive, setIsVisualEditActive] = useState(false);
  const [activeEditingSlotKey, setActiveEditingSlotKey] = useState<string | null>(null);

  return (
    <VisualEditContext.Provider value={{
      isVisualEditActive,
      setIsVisualEditActive,
      activeEditingSlotKey,
      setActiveEditingSlotKey
    }}>
      {children}
    </VisualEditContext.Provider>
  );
};

export const useVisualEdit = () => {
  const context = useContext(VisualEditContext);
  if (!context) {
    throw new Error('useVisualEdit must be used within a VisualEditProvider');
  }
  return context;
};
