import React, { useEffect, useState } from 'react';
import { ShoppingCart, TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { SalesChart } from '../components/SalesChart';
import { useEmpresa } from '../context/EmpresaContext';
import { SmartFilterBar, defaultFilters } from '../components/SmartFilterBar';
import type { FilterState } from '../components/SmartFilterBar';
import { ThreeDBarChart, ThreeDDonutChart } from '../components/ThreeDCharts';

const formatPeriodText = (inicio: string, fin: string) => {
  const parseDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return `${day} ${months[monthIdx]} ${year}`;
    }
    return dStr;
  };
  return `${parseDate(inicio)} al ${parseDate(fin)}`;
};

export function Dashboard() {
  const { selectedEmpresa } = useEmpresa();
  const { isFilterOpen, setIsFilterOpen } = useOutletContext<{ isFilterOpen: boolean, setIsFilterOpen: (val: boolean) => void }>() || { isFilterOpen: true, setIsFilterOpen: () => { } };

  const [activeTab, setActiveTab] = useState('general');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activePeriod, setActivePeriod] = useState<{ inicio: string; fin: string } | null>(null);

  const [sucursales, setSucursales] = useState<{ id: string, nombre: string }[]>([]);
  const [asesores, setAsesores] = useState<{ id: string, nombre: string }[]>([]);

  const handleAdvisorClick = (advisorName: string) => {
    const found = asesores.find(a => a.nombre.toLowerCase() === advisorName.toLowerCase());
    if (found) {
      setFilters(prev => {
        const current = prev.asesores || [];
        const isAlreadyFiltered = current.includes(found.id);
        const nextAsesores = isAlreadyFiltered
          ? current.filter(id => id !== found.id)
          : [...current, found.id];
        return { ...prev, asesores: nextAsesores };
      });
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setFilters(prev => {
      const current = prev.categoriasCliente || [];
      const isAlreadyFiltered = current.includes(categoryName);
      const nextCategories = isAlreadyFiltered
        ? current.filter(c => c !== categoryName)
        : [...current, categoryName];
      return { ...prev, categoriasCliente: nextCategories };
    });
  };

  const [kpis, setKpis] = useState({
    ventas_totales: 0,
    ticket_promedio: 0,
    nuevos_clientes: 0,
    tendencia_ventas: "+0%",
    tendencia_ventas_val: 0,
    tendencia_ticket: "+0%",
    tendencia_clientes: "+0%",
    sales_trend: [] as { name: string; Ventas: number; Meta: number }[],
    brand_distribution: [] as { name: string; value: number }[],
    category_distribution: [] as { name: string; value: number }[],
    advisor_sales: [] as { name: string; Ventas: number; Meta: number }[],
    group_sales: [] as { name: string; Ventas: number; Meta: number; categoria: string }[]
  });

  // Cargar sucursales y asesores
  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/sucursales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = selectedEmpresa ? data.filter(d => d.empresa_id === selectedEmpresa.id || d.empresa_id == null) : data;
          setSucursales(filtered.map(s => ({ id: String(s.id), nombre: s.nombre })));
        }
      })
      .catch(err => console.error("Error cargando sucursales:", err));

    let asesoresUrl = 'http://127.0.0.1:8001/api/asesores';
    if (selectedEmpresa) {
      asesoresUrl += `?empresa_id=${selectedEmpresa.id}`;
    }
    fetch(asesoresUrl)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAsesores(data.map(a => ({ id: String(a.id), nombre: a.nombre })));
        }
      })
      .catch(err => console.error("Error cargando asesores:", err));
  }, [selectedEmpresa]);

  useEffect(() => {
    let url = 'http://127.0.0.1:8001/api/dashboard/kpis';
    const params = new URLSearchParams();
    if (selectedEmpresa) {
      params.append('empresa_id', String(selectedEmpresa.id));
    }
    if (filters) {
      if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
      if (filters.sucursales && filters.sucursales.length > 0) {
        params.append('sucursales', filters.sucursales.join(','));
      }
      if (filters.asesores && filters.asesores.length > 0) {
        params.append('asesores', filters.asesores.join(','));
      }
      if (filters.categoriasCliente && filters.categoriasCliente.length > 0) {
        params.append('categorias_cliente', filters.categoriasCliente.join(','));
      }
      if (filters.manoDeObra && filters.manoDeObra.length > 0) {
        params.append('mano_de_obra', filters.manoDeObra.join(','));
      }
      if (filters.talleresExternos && filters.talleresExternos.length > 0) {
        params.append('talleres_externos', filters.talleresExternos.join(','));
      }
      if (filters.gruposProducto && filters.gruposProducto.length > 0) {
        params.append('grupos_producto', filters.gruposProducto.join(','));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setKpis({
            ventas_totales: data.ventas_totales || 0,
            ticket_promedio: data.ticket_promedio || 0,
            nuevos_clientes: data.nuevos_clientes || 0,
            tendencia_ventas: data.tendencia_ventas || "+0%",
            tendencia_ventas_val: data.tendencia_ventas_val || 0,
            tendencia_ticket: data.tendencia_ticket || "+0%",
            tendencia_clientes: data.tendencia_clientes || "+0%",
            sales_trend: data.sales_trend || [],
            brand_distribution: data.brand_distribution || [],
            category_distribution: data.category_distribution || [],
            advisor_sales: data.advisor_sales || [],
            group_sales: data.group_sales || []
          });
          if (data.fecha_inicio && data.fecha_fin) {
            setActivePeriod({ inicio: data.fecha_inicio, fin: data.fecha_fin });
          }
        }
      })
      .catch(err => console.error("Error cargando KPIs:", err));
  }, [selectedEmpresa, filters]); // Se ejecuta al cambiar filtros

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const TABS = [
    { id: 'general', label: 'Resumen General' },
    { id: 'auto', label: 'Auto / Camioneta' },
    { id: 'camion', label: 'Camión & Muevetierra' },
    { id: 'servicios', label: 'Servicios & Otros' },
  ];

  const COLORS = ['#62D9F3', '#F2AA27', '#E11D48', '#9333EA', '#10B981', '#64748B'];

  // Contenido por Pestaña
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

        {/* Pestañas (Tabs) de Navegación y Periodo Activo en una sola fila */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-4 gap-4">
          <div className="flex bg-[var(--color-surface-card)] shadow-sm border border-[var(--color-border-light)] p-1.5 rounded-2xl self-start">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${activeTab === tab.id
                    ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-bg)]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Banner de Periodo Activo (Rojo suave/Rose para contraste, a la derecha) */}
          {activePeriod && (
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100/60 rounded-2xl px-4 py-2 text-rose-700 shadow-sm animate-fade-in self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Periodo: {formatPeriodText(activePeriod.inicio, activePeriod.fin)}
              </span>
            </div>
          )}
        </div>

        {/* Barra de Filtros Interactivos Activos (Drill-down) */}
        {(filters.asesores.length > 0 || filters.categoriasCliente.length > 0) && (
          <div className="bg-indigo-50/70 border border-indigo-100/80 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse flex-shrink-0" />
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">Segmentación activa:</span>
              <div className="flex flex-wrap gap-1.5 pl-1">
                {filters.asesores.map(id => {
                  const name = asesores.find(a => a.id === id)?.nombre || `Asesor ${id}`;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm">
                      Asesor: {name}
                      <button
                        onClick={() => handleAdvisorClick(name)}
                        className="text-indigo-400 hover:text-indigo-700 cursor-pointer ml-1 text-xs font-bold font-mono"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {filters.categoriasCliente.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm">
                    Cliente: {cat}
                    <button
                      onClick={() => handleCategoryClick(cat)}
                      className="text-indigo-400 hover:text-indigo-700 cursor-pointer ml-1 text-xs font-bold font-mono"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setFilters(prev => ({ ...prev, asesores: [], categoriasCliente: [] }))}
              className="text-xs font-black text-indigo-600 hover:text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:border-rose-200 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
            >
              Restablecer Filtros
            </button>
          </div>
        )}

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
              <SalesChart data={kpis.sales_trend} />
            </ChartCard>
            <ChartCard title="Distribución de Ventas vs Objetivo" type="pie">
              <ThreeDDonutChart
                data={kpis.brand_distribution}
              />
            </ChartCard>
          </div>
        )}

        {activeTab === 'auto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Auto/Camnta por Grupo" type="bar">
              <ThreeDBarChart
                data={kpis.group_sales.filter(g => g.categoria === 'AUTO')}
                colorByBrand={true}
              />
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Auto/Camnta" type="pie">
              <ThreeDDonutChart
                data={kpis.category_distribution}
              />
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Auto/Camnta" type="bar" className="lg:col-span-2">
              <ThreeDBarChart
                data={kpis.advisor_sales}
                colorByGender={true}
              />
            </ChartCard>
          </div>
        )}

        {activeTab === 'camion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Camion por Grupo" type="bar">
              <ThreeDBarChart
                data={kpis.group_sales.filter(g => g.categoria === 'CAMION')}
                colorByBrand={true}
              />
            </ChartCard>
            <ChartCard title="Ventas por Categoria de Cliente Camion" type="pie">
              <ThreeDDonutChart
                data={kpis.category_distribution}
              />
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Muevetierra por Grupo" type="bar">
              <ThreeDBarChart
                data={kpis.group_sales.filter(g => g.categoria === 'MUEVETIERRA')}
                colorByBrand={true}
              />
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo por Asesor Camion / Muevetierra" type="bar" className="lg:col-span-2">
              <ThreeDBarChart
                data={kpis.advisor_sales}
                colorByGender={true}
              />
            </ChartCard>
          </div>
        )}

        {activeTab === 'servicios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Ventas vs Objetivo Patio de Servicio" type="bar">
              <ThreeDBarChart
                data={kpis.group_sales.filter(g => g.categoria === 'OTROS')}
                colorByBrand={true}
              />
            </ChartCard>
            <ChartCard title="Ventas de Talleres Externos" type="pie">
              <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de talleres externos</div>
            </ChartCard>
            <ChartCard title="Ventas de Camioneta de servicio" type="bar">
              <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">Sin datos de camioneta de servicio</div>
            </ChartCard>
            <ChartCard title="Ventas vs Objetivo Motocicleta" type="pie">
              <ThreeDDonutChart
                data={kpis.group_sales.filter(g => g.categoria === 'MOTOCICLETA').map(g => ({ name: g.name, value: g.Ventas }))}
              />
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, negative = false }: { title: string, value: string, trend: string, negative?: boolean }) {
  return (
    <div className="bg-[var(--color-surface-card)] p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--color-border-light)] flex flex-col relative overflow-hidden group hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
        <TrendingUp size={100} className="text-[var(--color-brand-500)]" />
      </div>
      <div className="flex items-center justify-between gap-2 mb-2 z-10">
        <span className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{title}</span>
      </div>
      <span className="text-4xl font-black text-[var(--color-text-main)] tracking-tight leading-none my-1 z-10">{value}</span>
      <div className="mt-5 flex items-center z-10">
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${negative
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
    <div className={`bg-[var(--color-surface-card)] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--color-border-light)] flex flex-col overflow-hidden relative min-h-[380px] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500 ${className}`}>
      <div className="px-6 py-5 border-b border-[var(--color-border-light)]/50 flex items-center justify-between bg-[var(--color-surface-bg)]/50">
        <div>
          <h3 className="font-bold text-[var(--color-text-main)] text-base tracking-wide">{title}</h3>
        </div>
        <div className="p-2 bg-[var(--color-brand-50)] rounded-xl text-[var(--color-brand-600)] shadow-sm">
          {type === 'pie' ? <PieChartIcon size={18} /> : <BarChart2 size={18} />}
        </div>
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
