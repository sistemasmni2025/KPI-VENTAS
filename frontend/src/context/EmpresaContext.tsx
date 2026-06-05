import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Empresa {
  id: number;
  nombre: string;
}

interface EmpresaContextType {
  selectedEmpresa: Empresa | null;
  setSelectedEmpresa: (empresa: Empresa | null) => void;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

  return (
    <EmpresaContext.Provider value={{ selectedEmpresa, setSelectedEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider');
  }
  return context;
}
