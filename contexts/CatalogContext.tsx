import React, { createContext, useContext, ReactNode } from "react";
import { useCatalogData } from "@/hooks/useCatalogData";

type CatalogContextType = ReturnType<typeof useCatalogData>;

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

interface CatalogProviderProps {
  children: ReactNode;
}

export const CatalogProvider: React.FC<CatalogProviderProps> = ({ children }) => {
  const catalogData = useCatalogData();

  return (
    <CatalogContext.Provider value={catalogData}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalogContext = (): CatalogContextType => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalogContext debe usarse dentro de un CatalogProvider");
  }
  return context;
};
