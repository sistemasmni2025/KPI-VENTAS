import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { VentasSucursal } from './pages/VentasSucursal';
import { SelectEmpresa } from './pages/SelectEmpresa';
import { EmpresaProvider } from './context/EmpresaContext';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <h2 className="text-2xl text-gray-400 font-medium">Página de {title} en construcción...</h2>
    </div>
  );
}

function App() {
  return (
    <EmpresaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SelectEmpresa />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ventas/sucursal/:id" element={<VentasSucursal />} />
            <Route path="/clientes" element={<PlaceholderPage title="Clientes" />} />
            <Route path="/productos" element={<PlaceholderPage title="Productos" />} />
            <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EmpresaProvider>
  );
}

export default App;
