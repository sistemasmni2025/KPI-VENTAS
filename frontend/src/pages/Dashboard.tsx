import React, { useEffect, useState } from 'react';
import { ShoppingCart, TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { SalesChart } from '../components/SalesChart';
import { useEmpresa } from '../context/EmpresaContext';
import { SmartFilterBar } from '../components/SmartFilterBar';
import type { FilterState } from '../components/SmartFilterBar';

export function Dashboard() {
  const { selectedEmpresa } = useEmpresa();
  const [activeTab, setActiveTab] = useState('general');
  const [filters, setFilters] = useState<FilterState | null>(null);
  
  const [sucursales, setSucursales] = useState<{id: string, nombre: string}[]>([]);
  const [asesores, setAsesores] = useState<{id: string, nombre: string}[]>([]);

  const [kpis, setKpis] = useState({
    ventas_totales: 0,
    ticket_promedio: 0,
    nuevos_clientes: 0,
    tendencia_ventas: "+0%",
    tendencia_ticket: "+0%",
    tendencia_clientes: "+0%"
  });

  // Cargar sucursales (mock o reales)
  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/sucursales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filtrar por empresa si aplica
          const filtered = selectedEmpresa ? data.filter(d => d.empresa_id === selectedEmpresa.id || d.empresa_id == null) : data;
          setSucursales(filtered.map(s => ({ id: String(s.id), nombre: s.nombre })));
        }
      })
      .catch(err => console.error(err));
      
    // TODO: Fetch asesores
    setAsesores([
      { id: '1', nombre: 'Juan Perez' },
      { id: '2', nombre: 'Maria Gomez' }
    ]);
  }, [selectedEmpresa]);

  useEffect(() => {
    // Al cambiar los filtros, volvemos a traer los KPIs
    let url = 'http://127.0.0.1:8001/api/dashboard/kpis';
    if (selectedEmpresa) {
      url += `?empresa_id=${selectedEmpresa.id}`;
      // TODO: Añadir filtros al URL (ej: &periodo=Mes&sucursales=1,2,3)
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setKpis(data);
        }
      })
      .catch(err => console.error("Error conectando al backend:", err));
  }, [selectedEmpresa, filters]); // Se ejecuta al cambiar filtros

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const TABS = [
    { id: 'general', label: 'Resumen General' },
    { id: 'auto', label: 'Auto / Camioneta' },
    { id: 'camion', label: 'Camión & Muevetierra' },
    { id: 'servicios', label: 'Servicios & Otros' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative z-10 bg-[var(--color-sky-bg)]">
      {/* 1. Smart Filter Bar Flotante */}
      <SmartFilterBar 
        onFilterChange={setFilters} 
        availableSucursales={sucursales} 
        availableAsesores={asesores} 
      />

      <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
        {/* Encabezado y Pestañas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--color-sky-border)] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-sky-text)] tracking-tight">Dashboard Ejecutivo</h1>
            <p className="text-[var(--color-sky-muted)] mt-1 text-sm">Rendimiento comercial en tiempo real</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-sky-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjetas de Resumen (KPIs Top) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Ventas Totales" value={formatCurrency(kpis.ventas_totales)} trend={kpis.tendencia_ventas} />
          <StatCard title="Utilidad Bruta" value="$0.00" trend="+0%" />
          <StatCard title="Nuevos Clientes" value={kpis.nuevos_clientes.toString()} trend={kpis.tendencia_clientes} negative={kpis.tendencia_clientes.startsWith('-')} />
        </div>

        {/* Contenido por Pestaña */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Tendencia de Ventas (Acumulado)" type="bar">
              <SalesChart />
            </ChartCard>
            <ChartCard title="Distribución de Ventas vs Objetivo" type="pie">
              <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
                Gráfica de Pastel (Pendiente de Datos)
              </div>
            </ChartCard>
          </div>
        )}

        {activeTab === 'auto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Ventas vs Objetivo Auto/Camnta por Grupo" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Ventas vs Objetivo (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Auto/Camnta" type="pie">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Pastel (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Auto/Camnta" type="bar" className="lg:col-span-2">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Barras (Pendiente)</div>
            </ChartCard>
          </div>
        )}

        {activeTab === 'camion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Ventas vs Objetivo Camion por Grupo" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Ventas vs Objetivo (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Camion" type="pie">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Pastel (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Muevetierra por Grupo" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Ventas vs Objetivo (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Camion / Muevetierra" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Barras (Pendiente)</div>
            </ChartCard>
          </div>
        )}
        
        {activeTab === 'servicios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Ventas vs Objetivo Patio de Servicio" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Ventas vs Objetivo (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas de Talleres Externos" type="pie">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Pastel (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas de Camioneta de servicio" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Barras (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Motocicleta" type="pie">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Pastel (Pendiente)</div>
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, negative = false }: { title: string, value: string, trend: string, negative?: boolean }) {
  return (
    <div className="bg-[var(--color-sky-surface)] p-6 rounded-2xl shadow-lg shadow-sky-900/5 border border-[var(--color-sky-border)] flex flex-col relative overflow-hidden group hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp size={64} className="text-[var(--color-sky-accent)]" />
      </div>
      <span className="text-xs font-extrabold text-[var(--color-sky-muted)] uppercase tracking-wider mb-1">{title}</span>
      <span className="text-3xl font-black text-[var(--color-sky-text)] tracking-tight leading-none my-1">{value}</span>
      <div className="mt-4 flex items-center">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          negative 
            ? 'bg-red-50 text-red-600 border-red-200' 
            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
          {trend}
        </span>
        <span className="text-xs text-slate-500 ml-2 font-medium">vs periodo anterior</span>
      </div>
    </div>
  );
}

function ChartCard({ title, children, type, className = '' }: { title: string, children: React.ReactNode, type: 'bar' | 'pie', className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg shadow-sky-900/5 border border-slate-100 flex flex-col overflow-hidden relative min-h-[350px] ${className}`}>
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm tracking-wide">{title}</h3>
        <div className="p-1.5 bg-sky-50 rounded-lg text-sky-500">
          {type === 'pie' ? <PieChartIcon size={16} /> : <BarChart2 size={16} />}
        </div>
      </div>
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  );
}
