import React, { useEffect, useState } from 'react';
import { ShoppingCart, TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { SalesChart } from '../components/SalesChart';
import { useEmpresa } from '../context/EmpresaContext';
import { SmartFilterBar } from '../components/SmartFilterBar';
import type { FilterState } from '../components/SmartFilterBar';

export function Dashboard() {
  const { selectedEmpresa } = useEmpresa();
  const { isFilterOpen, setIsFilterOpen } = useOutletContext<{isFilterOpen: boolean, setIsFilterOpen: (val: boolean) => void}>() || { isFilterOpen: true, setIsFilterOpen: () => {} };
  
  const [activeTab, setActiveTab] = useState('general');
  const [filters, setFilters] = useState<FilterState | null>(null);
  
  const [sucursales, setSucursales] = useState<{id: string, nombre: string}[]>([]);
  const [asesores, setAsesores] = useState<{id: string, nombre: string}[]>([]);

  const [kpis, setKpis] = useState({
    ventas_totales: 0,
    ticket_promedio: 0,
    nuevos_clientes: 0,
    tendencia_ventas: "+0%",
    tendencia_ventas_val: 0,
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
    <div className="flex flex-col min-h-screen relative z-10 bg-transparent">
      {/* 1. Smart Filter Bar Flotante (Colapsable) */}
      <div className={`transition-all duration-500 origin-top relative z-50 ${isFilterOpen ? 'max-h-[800px] opacity-100 scale-y-100 mb-4 overflow-visible' : 'max-h-0 opacity-0 scale-y-95 mb-0 overflow-hidden pointer-events-none'}`}>
        <SmartFilterBar 
          onFilterChange={setFilters} 
          availableSucursales={sucursales} 
          availableAsesores={asesores} 
          onClose={() => setIsFilterOpen(false)}
        />
      </div>

      <div className={`p-4 md:px-8 space-y-8 max-w-[1400px] mx-auto w-full animate-fade-in transition-all duration-500 ${!isFilterOpen ? 'mt-4' : ''}`}>
        {/* Pestañas (Tabs) de Navegación */}
        <div className="flex border-b border-slate-200/60 pb-4">
          <div className="flex bg-white shadow-sm border border-slate-100 p-1.5 rounded-2xl">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Camion por Grupo" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Ventas vs Objetivo (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Camion" type="pie">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Pastel (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Muevetierra por Grupo" type="bar">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Ventas vs Objetivo (Pendiente)</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Camion / Muevetierra" type="bar" className="lg:col-span-2">
               <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Gráfica de Barras (Pendiente)</div>
            </ChartCard>
          </div>
        )}
        
        {activeTab === 'servicios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
    <div className="bg-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
        <TrendingUp size={100} className="text-indigo-600" />
      </div>
      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</span>
      <span className="text-4xl font-black text-slate-900 tracking-tight leading-none my-1">{value}</span>
      <div className="mt-5 flex items-center">
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
          negative 
            ? 'bg-rose-50 text-rose-600' 
            : 'bg-emerald-50 text-emerald-600'
        }`}>
          {trend}
        </span>
        <span className="text-xs text-slate-400 ml-3 font-medium">vs periodo anterior</span>
      </div>
    </div>
  );
}

function ChartCard({ title, children, type, className = '' }: { title: string, children: React.ReactNode, type: 'bar' | 'pie', className?: string }) {
  return (
    <div className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden relative min-h-[380px] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500 ${className}`}>
      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-base tracking-wide">{title}</h3>
        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
          {type === 'pie' ? <PieChartIcon size={18} /> : <BarChart2 size={18} />}
        </div>
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
