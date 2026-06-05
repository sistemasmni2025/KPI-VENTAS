import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ShoppingCart, Bell, ChevronDown, Building2, Repeat, Sparkles, Bot, X } from 'lucide-react';
import { Outlet, NavLink, useLocation, Navigate, Link } from 'react-router-dom';
import { useEmpresa } from '../context/EmpresaContext';

export function Layout() {
  const [sucursales, setSucursales] = useState<{id: number, nombre: string, empresa_id?: number}[]>([]);
  const [ventasOpen, setVentasOpen] = useState(false);
  const [orbisOpen, setOrbisOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { selectedEmpresa, setSelectedEmpresa } = useEmpresa();

  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/sucursales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSucursales(data);
        }
      })
      .catch(err => {
        console.warn("No se pudo conectar al backend de sucursales.", err);
      });
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setVentasOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedEmpresa) {
    return <Navigate to="/" replace />;
  }

  // Filtrar sucursales por la empresa seleccionada
  const sucursalesEmpresa = sucursales.filter(s => s.empresa_id === selectedEmpresa.id || s.empresa_id === undefined);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-sky-bg)] font-sans text-[var(--color-sky-text)] selection:bg-[var(--color-sky-accent)] selection:text-white overflow-hidden">
      
      {/* Top Header Navigation */}
      <header className="h-16 bg-[var(--color-sky-surface)] border-b border-[var(--color-sky-border)] flex items-center justify-between px-4 md:px-8 shrink-0 z-50 shadow-sm relative">
        
        {/* Left Section: Logo & Nav */}
        <div className="flex items-center space-x-8 h-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/icon.png" alt="Logo Nieto" className="w-full h-full object-cover" />
            </div>
            <div className="ml-3 hidden sm:flex flex-col justify-center">
              <span className="font-extrabold text-lg tracking-tight text-[var(--color-sky-text)] leading-tight">
                Reportes <span className="text-[#c1121f]">Nieto</span>
              </span>
              <span className="text-xs font-semibold text-sky-600 truncate max-w-[150px]">
                {selectedEmpresa.nombre}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center h-full space-x-1">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `flex items-center space-x-2 px-4 h-full border-b-2 transition-colors ${isActive ? 'border-[var(--color-sky-accent)] text-[var(--color-sky-accent)] font-bold bg-sky-50/50' : 'border-transparent text-slate-500 hover:text-[var(--color-sky-text)] hover:bg-sky-50/50'}`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>

            {/* Ventas Dropdown */}
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button 
                onClick={() => setVentasOpen(!ventasOpen)}
                className={`flex items-center space-x-2 px-4 h-full border-b-2 transition-colors cursor-pointer ${
                  location.pathname.startsWith('/ventas/sucursal/') || ventasOpen
                    ? 'border-[var(--color-sky-accent)] text-[var(--color-sky-accent)] font-bold bg-sky-50/50' 
                    : 'border-transparent text-slate-500 hover:text-[var(--color-sky-text)] hover:bg-sky-50/50'
                }`}
              >
                <ShoppingCart size={18} />
                <span className="hidden sm:inline">Ventas</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${ventasOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Panel */}
              <div 
                className={`absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden transition-all duration-200 origin-top-left ${
                  ventasOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="max-h-[70vh] overflow-y-auto p-2 space-y-1">
                  {sucursalesEmpresa.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No hay sucursales disponibles.
                    </div>
                  ) : (
                    sucursalesEmpresa.map(suc => (
                      <NavLink
                        key={suc.id}
                        to={`/ventas/sucursal/${suc.id}`}
                        onClick={() => setVentasOpen(false)}
                        className={({ isActive }) => `w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                          isActive 
                            ? 'bg-sky-100 text-[var(--color-sky-accent)] font-bold' 
                            : 'text-slate-600 hover:bg-sky-50 hover:text-[var(--color-sky-text)]'
                        }`}
                      >
                        <Building2 size={16} className={location.pathname === `/ventas/sucursal/${suc.id}` ? 'text-[var(--color-sky-accent)]' : 'text-slate-400'} />
                        <span>{suc.nombre}</span>
                      </NavLink>
                    ))
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Right Section: User & Orbis */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link 
            to="/"
            onClick={() => setSelectedEmpresa(null)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium"
          >
            <Repeat size={14} />
            <span className="hidden md:inline">Cambiar Empresa</span>
          </Link>
          
          <button 
            onClick={() => setOrbisOpen(true)}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 cursor-pointer relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Sparkles size={16} className="animate-pulse" />
            <span className="font-bold text-sm tracking-wide">Orbis AI</span>
          </button>

          <button className="relative p-2 text-slate-500 hover:text-[var(--color-sky-accent)] transition-colors cursor-pointer hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-amber-400 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold cursor-pointer">
            JR
          </div>
        </div>
      </header>

      {/* Orbis Offcanvas Panel */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${orbisOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setOrbisOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl transition-transform duration-300 transform ${orbisOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-slate-200`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <div className="flex items-center space-x-2">
              <Sparkles size={20} />
              <h2 className="font-bold text-lg">Orbis Assistant</h2>
            </div>
            <button onClick={() => setOrbisOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center text-center space-y-4 text-slate-500">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-4">
              <Bot size={32} />
            </div>
            <p className="font-medium text-slate-700">Orbis está listo para ayudarte.</p>
            <p className="text-sm">Pronto podrás interactuar con Orbis para consultar datos de ventas, generar reportes predictivos y mucho más usando lenguaje natural.</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[var(--color-sky-bg)] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
        <Outlet />
      </main>

    </div>
  );
}
